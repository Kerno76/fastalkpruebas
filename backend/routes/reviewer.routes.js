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
    const { SessionID, TutorID, ReviewerID, NewStatus, Topic } = req.body;
    try {
        const { error: updateErr } = await supabaseAdmin.from('Session')
            .update({ ReviewerStatus: NewStatus })
            .eq('SessionID', SessionID);

        if (updateErr) throw updateErr;

        let mensajeExtra = "";

        if (NewStatus === 'Aprobado') {
            const { data: sessionData, error: sesErr } = await supabaseAdmin
                .from('Session')
                .select('Duration')
                .eq('SessionID', SessionID)
                .single();
            
            if (sesErr) throw sesErr;
            const horasASumar = sessionData.Duration || 0;

            const { data: tutorData, error: tutErr } = await supabaseAdmin
                .from('Tutors')
                .select('TotalHours')
                .eq('ID', TutorID)
                .single();
            
            if (tutErr) throw tutErr;
            const horasActuales = tutorData.TotalHours || 0;

            const { error: finalTutErr } = await supabaseAdmin
                .from('Tutors')
                .update({ TotalHours: horasActuales + horasASumar })
                .eq('ID', TutorID);
            
            if (finalTutErr) throw finalTutErr;

            mensajeExtra = ` Se han sumado ${horasASumar} horas a tu conteo total de servicio social.`;
        }

        const titNotif = NewStatus === 'Rechazado' ? 'Bitacora rechazada' : 'Bitacora aprobada';
        const msgNotif = NewStatus === 'Rechazado' 
            ? `Tu bitacora de la sesion "${Topic}" ha sido rechazada. Por favor, corrigela en tu panel de Registro de Sesiones.`
            : `Tu bitacora de la sesion "${Topic}" ha sido aprobada con exito.${mensajeExtra}`;

        await supabaseAdmin.from('Notifications').insert([{
            ReceiverID: TutorID,
            SenderID: ReviewerID,
            Type: 'SesionRevisada',
            Title: titNotif,
            Message: msgNotif,
            RelatedEntityID: SessionID
        }]);

        res.status(200).json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

module.exports = router;