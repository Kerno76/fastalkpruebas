const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

router.get('/notificaciones/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { data: perfil, error: perfilError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID')
            .eq('ID', userId)
            .single(); 

        if (perfilError || !perfil) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        const { data, error } = await supabaseAdmin
            .from('Notifications')
            .select('*')
            .eq('ReceiverID', userId)
            .order('CreatedAt', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.status(200).json({ success: true, notificaciones: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/notificaciones/leer/:notifId', async (req, res) => {
    const { notifId } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('Notifications')
            .update({ IsRead: true })
            .eq('NotificationID', notifId);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/bitacoras/:reviewerId', async (req, res) => {
    const { reviewerId } = req.params;
    try {
        const { data: sesiones, error: sesErr } = await supabaseAdmin
            .from('Session')
            .select(`
                *, 
                Courses ( Name ),
                SessionStudents (
                    StudentID,
                    Attendance,
                    IncidentReport,
                    UsersProfiles ( Name )
                )
            `)
            .eq('ReviewerID', reviewerId)
            .eq('Status', 'Completed')
            .order('Date', { ascending: false });

        if (sesErr) throw sesErr;

        if (!sesiones || sesiones.length === 0) {
            return res.status(200).json({ success: true, bitacoras: [] });
        }

        const tutorIds = [...new Set(sesiones.map(s => s.TutorID))];
        const { data: perfiles, error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name')
            .in('ID', tutorIds);

        if (profErr) throw profErr;

        const formateadas = sesiones.map(s => {
            const tutor = perfiles.find(p => p.ID === s.TutorID);
            return {
                id: s.SessionID,
                tutor: tutor ? tutor.Name : 'Desconocido',
                tutorId: s.TutorID,
                course: s.Courses?.Name || 'N/A',
                date: s.Date,
                startTime: s.StartTime, 
                topic: s.Topic,
                duration: s.Duration,
                status: s.ReviewerStatus || 'Pendiente',
                evidenceLink: s.EvidencePhoto,
                description: s.Description,
                nextSession: s.NextSession,
                reviewerComments: s.ReviewerComments || '', 
                estudiantes: s.SessionStudents ? s.SessionStudents.map(st => ({
                    Name: st.UsersProfiles?.Name || 'Alumno',
                    Attendance: st.Attendance,
                    IncidentReport: st.IncidentReport
                })) : []
            };
        });

        res.status(200).json({ success: true, bitacoras: formateadas });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

router.put('/evaluar-bitacora', async (req, res) => {
    const { SessionID, TutorID, ReviewerID, NewStatus, Topic, ReviewerComments, allowResubmit } = req.body;
    try {
        const { data: sessionPrev } = await supabaseAdmin
            .from('Session')
            .select('ReviewerID, Duration, ReviewerStatus')
            .eq('SessionID', SessionID)
            .single();

        const { data: evaluator } = await supabaseAdmin
            .from('UsersProfiles')
            .select('Name, Rol')
            .eq('ID', ReviewerID)
            .single();
            
        const evaluatorName = evaluator?.Name || 'Usuario';
        const evaluatorRol = evaluator?.Rol || 'Reviewer';

        const firma = evaluatorRol === 'Admin' ? `Administrador (${evaluatorName})` : `Revisor (${evaluatorName})`;
        const finalComments = ReviewerComments && ReviewerComments.trim() !== '' ? ReviewerComments : 'Sin comentarios adicionales.';
        
        let comentarioBD = `Evaluado por: ${firma}\n`;
        if (NewStatus === 'Rechazado') {
            comentarioBD += `Permite Reenvío: ${allowResubmit ? 'Sí' : 'No'}\n`;
        }
        comentarioBD += `Comentarios: ${finalComments}`;

        const { error: updateErr } = await supabaseAdmin.from('Session')
            .update({ 
                ReviewerStatus: NewStatus,
                ReviewerComments: comentarioBD
            })
            .eq('SessionID', SessionID);

        if (updateErr) throw updateErr;

        if (sessionPrev && sessionPrev.ReviewerID && sessionPrev.ReviewerStatus === 'Pendiente') {
            const { data: revData } = await supabaseAdmin
                .from('Reviewer')
                .select('ValidationsCompleted')
                .eq('ID', sessionPrev.ReviewerID)
                .single();
            
            if (revData) {
                const currentValidations = revData.ValidationsCompleted || 0;
                await supabaseAdmin
                    .from('Reviewer')
                    .update({ ValidationsCompleted: currentValidations + 1 })
                    .eq('ID', sessionPrev.ReviewerID);
            }
        }

        let mensajeExtra = "";

        if (NewStatus === 'Aprobado' && sessionPrev?.ReviewerStatus !== 'Aprobado') {
            const horasASumar = sessionPrev.Duration || 0;

            const { data: tutorData } = await supabaseAdmin.from('Tutors').select('TotalHours').eq('ID', TutorID).single();
            const horasActuales = tutorData?.TotalHours || 0;

            await supabaseAdmin.from('Tutors').update({ TotalHours: horasActuales + horasASumar }).eq('ID', TutorID);
            mensajeExtra = ` Se han sumado ${horasASumar} horas a tu conteo total.`;
        }

        let notificaciones = [];
        const titNotif = NewStatus === 'Rechazado' ? 'Bitácora rechazada' : 'Bitácora aprobada';
        
        let msgNotifTutor = NewStatus === 'Rechazado' 
            ? `Tu bitácora de la sesión "${Topic}" ha sido rechazada por el ${firma}.`
            : `Tu bitácora de la sesión "${Topic}" ha sido aprobada con éxito por el ${firma}.${mensajeExtra}`;

        if (NewStatus === 'Rechazado' && allowResubmit) {
            msgNotifTutor += `\n\nSe te ha habilitado la opción de corregirla y reenviarla desde tu panel.`;
        }

        notificaciones.push({
            ReceiverID: TutorID,
            SenderID: ReviewerID,
            Type: 'SessionRevisada',
            Title: titNotif,
            Message: msgNotifTutor,
            RelatedEntityID: SessionID
        });

        if (evaluatorRol === 'Admin' && sessionPrev && sessionPrev.ReviewerID && sessionPrev.ReviewerID !== ReviewerID) {
            notificaciones.push({
                ReceiverID: sessionPrev.ReviewerID,
                SenderID: ReviewerID, 
                Type: 'SessionRevisada',
                Title: 'Bitácora evaluada por Administrador',
                Message: `El ${firma} ha ${NewStatus === 'Aprobado' ? 'aprobado' : 'rechazado'} la bitácora de la sesión "${Topic}" de uno de tus tutores.`,
                RelatedEntityID: SessionID
            });
        }

        if (notificaciones.length > 0) {
            await supabaseAdmin.from('Notifications').insert(notificaciones);
        }

        res.status(200).json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

router.get('/stats/:reviewerId', async (req, res) => {
    const { reviewerId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('Reviewer')
            .select('ValidationsCompleted')
            .eq('ID', reviewerId)
            .single();

        if (error) throw error;
        
        res.status(200).json({ 
            success: true, 
            validationsCompleted: data?.ValidationsCompleted || 0 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/eventos-calendario/:reviewerId', async (req, res) => {
    const { reviewerId } = req.params;
    try {
        const { data: perfil } = await supabaseAdmin.from('UsersProfiles').select('Rol').eq('ID', reviewerId).single();
        const isAdmin = perfil?.Rol === 'Admin';

        let query = supabaseAdmin.from('Session').select('*, Courses(Name)');

        if (!isAdmin) {
            const { data: asignaciones } = await supabaseAdmin.from('Enrollments_Reviewers').select('TutorID').eq('ReviewerID', reviewerId);
            
            let tutorIds = [];
            if (asignaciones && asignaciones.length > 0) {
                tutorIds = asignaciones.map(a => a.TutorID);
            }

            if (tutorIds.length > 0) {
                query = query.or(`ReviewerID.eq.${reviewerId},TutorID.in.(${tutorIds.join(',')})`);
            } else {
                query = query.eq('ReviewerID', reviewerId);
            }
        }

        const { data: sessions, error } = await query;
        if (error) throw error;

        let eventos = [];
        if (sessions && sessions.length > 0) {
            const sesionesValidas = sessions.filter(s => s.Status !== 'Canceled' && s.Status !== 'Cancelado');

            const tutorIds = [...new Set(sesionesValidas.map(s => s.TutorID))];
            const { data: profiles } = await supabaseAdmin.from('UsersProfiles').select('ID, Name').in('ID', tutorIds);

            sesionesValidas.forEach(s => {
                if (s.Date) {
                    const tutor = profiles?.find(p => p.ID === s.TutorID);
                    eventos.push({
                        id: `ses_${s.SessionID}`,
                        type: 'Sesión',
                        title: s.Topic,
                        date: s.Date,
                        time: s.StartTime ? s.StartTime.substring(0, 5) : '',
                        course: s.Courses?.Name || 'Curso',
                        tutorName: tutor?.Name || 'Tutor sin nombre',
                        description: s.Description || 'Clase virtual programada.'
                    });
                }
            });
        }

        res.status(200).json({ success: true, eventos });
    } catch (error) {
        console.error("Error en eventos-calendario revisor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;