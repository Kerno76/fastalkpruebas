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
                reviewerComments: s.ReviewerComments || '', // <- Agregamos el campo de comentarios
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
    // Agregamos 'allowResubmit' que vendrá del frontend
    const { SessionID, TutorID, ReviewerID, NewStatus, Topic, ReviewerComments, allowResubmit } = req.body;
    try {
        // 1. Identificamos quién está calificando
        const { data: evaluator } = await supabaseAdmin.from('UsersProfiles').select('Name, Rol').eq('ID', ReviewerID).single();
        const evaluatorName = evaluator?.Name || 'Usuario';
        const evaluatorRol = evaluator?.Rol || 'Reviewer';

        // 2. Construimos la firma y el comentario final para guardarlo en la BD
        const firma = evaluatorRol === 'Admin' ? `Administrador (${evaluatorName})` : `Revisor (${evaluatorName})`;
        const finalComments = ReviewerComments && ReviewerComments.trim() !== '' ? ReviewerComments : 'Sin comentarios adicionales.';
        
        // Estructura oculta que el frontend leerá
        let comentarioBD = `Evaluado por: ${firma}\n`;
        if (NewStatus === 'Rechazado') {
            comentarioBD += `Permite Reenvío: ${allowResubmit ? 'Sí' : 'No'}\n`;
        }
        comentarioBD += `Comentarios: ${finalComments}`;

        // 3. Actualizamos el estado y guardamos la firma en la sesión
        const { error: updateErr } = await supabaseAdmin.from('Session')
            .update({ 
                ReviewerStatus: NewStatus,
                ReviewerComments: comentarioBD
            })
            .eq('SessionID', SessionID);

        if (updateErr) throw updateErr;

        let mensajeExtra = "";

        if (NewStatus === 'Aprobado') {
            const { data: sessionData } = await supabaseAdmin.from('Session').select('Duration').eq('SessionID', SessionID).single();
            const horasASumar = sessionData.Duration || 0;

            const { data: tutorData } = await supabaseAdmin.from('Tutors').select('TotalHours').eq('ID', TutorID).single();
            const horasActuales = tutorData.TotalHours || 0;

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
            Type: 'SesionRevisada',
            Title: titNotif,
            Message: msgNotifTutor,
            RelatedEntityID: SessionID
        });

        if (evaluatorRol === 'Admin') {
            const { data: sesionData } = await supabaseAdmin.from('Session').select('ReviewerID').eq('SessionID', SessionID).single();
            if (sesionData && sesionData.ReviewerID && sesionData.ReviewerID !== ReviewerID) {
                notificaciones.push({
                    ReceiverID: sesionData.ReviewerID,
                    SenderID: ReviewerID, 
                    Type: 'SesionRevisada',
                    Title: 'Bitácora evaluada por Administrador',
                    Message: `El ${firma} ha ${NewStatus === 'Aprobado' ? 'aprobado' : 'rechazado'} la bitácora de la sesión "${Topic}" de uno de tus tutores.`,
                    RelatedEntityID: SessionID
                });
            }
        }

        if (notificaciones.length > 0) {
            await supabaseAdmin.from('Notifications').insert(notificaciones);
        }

        res.status(200).json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

module.exports = router;