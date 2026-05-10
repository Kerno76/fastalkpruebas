const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

router.get('/dashboard/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: profile, error: profErr } = await supabaseAdmin.from('UsersProfiles').select('Name').eq('ID', tutorId).single();
        if (profErr) throw profErr;

        const { data: tutorInfo } = await supabaseAdmin.from('Tutors').select('TotalHours').eq('ID', tutorId).single();
        const totalHours = tutorInfo?.TotalHours || 0;

        const { data: courses, error: courErr } = await supabaseAdmin.from('Courses').select('CourseID, Level').eq('TutorID', tutorId);
        if (courErr) throw courErr;

        let totalEstudiantes = 0;
        let niveles = new Set(); 

        if (courses && courses.length > 0) {
            courses.forEach(c => { if (c.Level) niveles.add(c.Level); });
            const courseIds = courses.map(c => c.CourseID);
            const { data: enrollments } = await supabaseAdmin.from('Enrollments').select('StudentID').in('CourseID', courseIds);
            totalEstudiantes = enrollments ? enrollments.length : 0;
        }

        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
        const hoyLocal = localISOTime.split('T')[0];

        const { data: proximaData } = await supabaseAdmin
            .from('Session')
            .select(`Date, StartTime, Topic, Url, SessionStudents ( UsersProfiles (Name) )`)
            .eq('TutorID', tutorId)
            .eq('Status', 'Scheduled')
            .gte('Date', hoyLocal)
            .order('Date', { ascending: true })
            .order('StartTime', { ascending: true })
            .limit(1);

        let proximaSesion = null;
        if (proximaData && proximaData.length > 0) {
            const proxima = proximaData[0];
            let nombres = 'Varios alumnos';
            if (proxima.SessionStudents && proxima.SessionStudents.length === 1) {
                nombres = proxima.SessionStudents[0].UsersProfiles?.Name;
            } else if (proxima.SessionStudents && proxima.SessionStudents.length > 1) {
                nombres = `${proxima.SessionStudents[0].UsersProfiles?.Name} y ${proxima.SessionStudents.length - 1} más`;
            }
            proximaSesion = { date: proxima.Date, time: proxima.StartTime, student: nombres, topic: proxima.Topic, url: proxima.Url };
        }

        res.status(200).json({
            success: true,
            data: { name: profile.Name, totalHours, totalStudents: totalEstudiantes, nivelesAsignados: Array.from(niveles).join(' y ') || 'Ninguno', proximaSesion }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/mis-estudiantes/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: courses } = await supabaseAdmin.from('Courses').select('*').eq('TutorID', tutorId);
        if (!courses || courses.length === 0) return res.status(200).json({ success: true, estudiantes: [] });

        const courseIds = courses.map(c => c.CourseID);
        const { data: enrollments } = await supabaseAdmin.from('Enrollments').select('*').in('CourseID', courseIds);
        if (!enrollments || enrollments.length === 0) return res.status(200).json({ success: true, estudiantes: [] });

        const { data: profiles } = await supabaseAdmin.from('UsersProfiles').select('ID, Name, Email').in('ID', enrollments.map(e => e.StudentID));

        const estudiantes = profiles.map(profile => {
            const rel = enrollments.find(e => e.StudentID === profile.ID);
            const course = courses.find(c => c.CourseID === rel.CourseID);
            return {
                id: profile.ID,
                name: profile.Name,
                email: profile.Email,
                courseName: course?.Name || 'N/A',
                language: course?.Language || 'N/A',
                level: course?.Level || 'N/A',
                horasTotales: '0 hrs',
                ultimaSesion: 'Sin registro'
            };
        });
        res.status(200).json({ success: true, estudiantes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/estudiantes-curso/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data: enrollments, error: enrErr } = await supabaseAdmin
            .from('Enrollments')
            .select('StudentID')
            .eq('CourseID', courseId);
            
        if (enrErr) throw enrErr;
        if (!enrollments || enrollments.length === 0) return res.status(200).json({ success: true, estudiantes: [] });

        const studentIds = enrollments.map(e => e.StudentID);
        const { data: students, error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name')
            .in('ID', studentIds);
            
        if (profErr) throw profErr;
        res.status(200).json({ success: true, estudiantes: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/materiales/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: materiales } = await supabaseAdmin.from('Repository').select('*').order('Rating', { ascending: false });
        const { data: profiles } = await supabaseAdmin.from('UsersProfiles').select('ID, Name');
        const { data: misVotos } = await supabaseAdmin.from('MaterialRatings').select('MaterialID, Score').eq('TutorID', tutorId);

        const formatData = materiales.map(m => ({
            ...m,
            tutorName: profiles.find(p => p.ID === m.TutorID)?.Name || 'Desconocido',
            miVoto: misVotos.find(v => v.MaterialID === m.MaterialID)?.Score || 0
        }));

        res.status(200).json({ success: true, materiales: formatData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/materiales', async (req, res) => {
    const { CourseID, TutorID, Topic, Level, Language, fileBase64, fileName, fileType } = req.body;
    try {
        const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
        const uniqueName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
        await supabaseAdmin.storage.from('materiales').upload(`public/${uniqueName}`, buffer, { contentType: fileType });

        const { data: publicUrlData } = supabaseAdmin.storage.from('materiales').getPublicUrl(`public/${uniqueName}`);

        await supabaseAdmin.from('Repository').insert([{
            CourseID: CourseID || null, TutorID, Topic, FileUrl: publicUrlData.publicUrl, Rating: 0, Level, Language
        }]);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/materiales/rating', async (req, res) => {
    const { MaterialID, TutorID, Score } = req.body;
    try {
        const { data: existe } = await supabaseAdmin.from('MaterialRatings').select('ID').eq('MaterialID', MaterialID).eq('TutorID', TutorID).single();

        if (existe) {
            await supabaseAdmin.from('MaterialRatings').update({ Score }).eq('ID', existe.ID);
        } else {
            await supabaseAdmin.from('MaterialRatings').insert([{ MaterialID, TutorID, Score }]);
        }

        const { data: todos } = await supabaseAdmin.from('MaterialRatings').select('Score').eq('MaterialID', MaterialID);
        const promedio = Math.round(todos.reduce((acc, c) => acc + c.Score, 0) / todos.length);

        await supabaseAdmin.from('Repository').update({ Rating: promedio }).eq('MaterialID', MaterialID);

        res.status(200).json({ success: true, nuevoPromedio: promedio });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/materiales/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: mat } = await supabaseAdmin.from('Repository').select('FileUrl').eq('MaterialID', id).single();
        if (mat?.FileUrl) {
            const fileName = mat.FileUrl.split('/').pop();
            await supabaseAdmin.storage.from('materiales').remove([`public/${fileName}`]);
        }
        await supabaseAdmin.from('Repository').delete().eq('MaterialID', id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/tutor-cursos/:tutorId', async (req, res) => {
    try {
        const { data } = await supabaseAdmin.from('Courses').select('*').eq('TutorID', req.params.tutorId);
        res.status(200).json({ success: true, cursos: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/revisores-asignados/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: asignaciones, error: asigErr } = await supabaseAdmin
            .from('Enrollments_Reviewers')
            .select('ReviewerID')
            .eq('TutorID', tutorId);

        if (asigErr) throw asigErr;

        if (!asignaciones || asignaciones.length === 0) {
            return res.status(200).json({ success: true, revisores: [] });
        }

        const reviewerIds = asignaciones.map(a => a.ReviewerID);

        const { data: perfiles, error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name')
            .in('ID', reviewerIds);

        if (profErr) throw profErr;

        res.status(200).json({ success: true, revisores: perfiles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/agendar-sesion', async (req, res) => {
    const { TutorID, CourseID, ReviewerID, Estudiantes, Date, StartTime, Duration, Topic, Url, TypeAssistence, Description } = req.body;
    
    try {
        const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from('Session')
            .insert([{
                CourseID,
                TutorID,
                ReviewerID,
                Date,
                StartTime,
                Duration,
                Topic,
                Url,
                TypeAssistence,
                Description
            }])
            .select('SessionID')
            .single();

        if (sessionError) throw sessionError;
        
        const newSessionId = sessionData.SessionID;

        const sessionStudentsPayload = Estudiantes.map(studentId => ({
            SessionID: newSessionId,
            StudentID: studentId
        }));

        const { error: studentsError } = await supabaseAdmin
            .from('SessionStudents')
            .insert(sessionStudentsPayload);

        if (studentsError) throw studentsError;

        const notificationsPayload = Estudiantes.map(studentId => ({
            ReceiverID: studentId,
            SenderID: TutorID,
            Type: 'SessionAgendada',
            Title: 'Nueva sesion programada',
            Message: `Tu tutor ha agendado la sesion "${Topic}" para el ${Date} a las ${StartTime}.`,
            RelatedEntityID: newSessionId
        }));

        const { error: notificationsError } = await supabaseAdmin
            .from('Notifications')
            .insert(notificationsPayload);

        if (notificationsError) throw notificationsError;

        res.status(200).json({ success: true, sessionId: newSessionId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/sesiones-pendientes/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: sesiones, error } = await supabaseAdmin
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
            .eq('TutorID', tutorId)
            .in('Status', ['Scheduled', 'Completed']) 
            .or('ReviewerStatus.eq.Rechazado,Status.eq.Scheduled')
            .order('Date', { ascending: false })
            .order('StartTime', { ascending: false });

        if (error) throw error;

        const formateadas = sesiones.map(s => ({
            ...s,
            courseName: s.Courses?.Name || 'Curso Desconocido',
            studentCount: s.SessionStudents ? s.SessionStudents.length : 0,
            estudiantes: s.SessionStudents.map(st => ({
                StudentID: st.StudentID,
                Name: st.UsersProfiles?.Name || 'Alumno',
                Attendance: st.Attendance,
                IncidentReport: st.IncidentReport || ''
            }))
        }));

        res.status(200).json({ success: true, sesiones: formateadas });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/completar-sesion', async (req, res) => {
    const { SessionID, Status, Description, NextSession, fileBase64, fileName, fileType, estudiantesData } = req.body;

    try {
        const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
        const uniqueName = `evidencia_${SessionID}_${Date.now()}.jpg`;
        
        await supabaseAdmin.storage.from('evidencias-sesiones').upload(`public/${uniqueName}`, buffer, { contentType: fileType });
        const { data: urlData } = supabaseAdmin.storage.from('evidencias-sesiones').getPublicUrl(`public/${uniqueName}`);

        const { error: sessionError } = await supabaseAdmin
            .from('Session')
            .update({ 
                Status, 
                Description, 
                NextSession, 
                EvidencePhoto: urlData.publicUrl,
                ReviewerStatus: 'Pendiente' 
            })
            .eq('SessionID', SessionID);

        if (sessionError) throw sessionError;

        if (estudiantesData && estudiantesData.length > 0) {
            for (let est of estudiantesData) {
                await supabaseAdmin
                    .from('SessionStudents')
                    .update({ Attendance: est.Attendance, IncidentReport: est.IncidentReport })
                    .eq('SessionID', SessionID)
                    .eq('StudentID', est.StudentID);
            }
        }

        const { data: sesionData } = await supabaseAdmin.from('Session').select('ReviewerID, Topic, TutorID').eq('SessionID', SessionID).single();
        const { data: tutorProfile } = await supabaseAdmin.from('UsersProfiles').select('Name').eq('ID', sesionData.TutorID).single();

        if (sesionData && sesionData.ReviewerID) {
            await supabaseAdmin.from('Notifications').insert([{
                ReceiverID: sesionData.ReviewerID,
                SenderID: sesionData.TutorID,
                Type: 'MaterialSubido', 
                Title: 'Bitacora enviada para revision',
                Message: `El tutor ${tutorProfile?.Name || 'asignado'} ha enviado la bitacora de la clase "${sesionData.Topic}".`,
                RelatedEntityID: SessionID
            }]);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/historial-sesiones/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
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
            .eq('TutorID', tutorId)
            .order('Date', { ascending: false })
            .order('StartTime', { ascending: false });

        if (error) throw error;

        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const nowLocal = new Date(Date.now() - tzOffset);
        const hoyLocal = nowLocal.toISOString().split('T')[0];
        const horaLocal = nowLocal.toISOString().split('T')[1].substring(0, 5); 

        const historial = data.filter(s => {
            if (s.Status !== 'Scheduled') return true; 
            if (s.Date < hoyLocal) return true;
            if (s.Date === hoyLocal && s.StartTime <= horaLocal) return true;
            return false;
        }).map(s => ({
            ...s,
            courseName: s.Courses?.Name || 'N/A',
            estudiantes: s.SessionStudents ? s.SessionStudents.map(st => ({
                Name: st.UsersProfiles?.Name || 'Alumno',
                Attendance: st.Attendance,
                IncidentReport: st.IncidentReport
            })) : []
        }));

        res.status(200).json({ success: true, sesiones: historial });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/notificaciones/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
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

router.get('/estudiante/proxima-sesion/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: participaciones, error: partErr } = await supabaseAdmin
            .from('SessionStudents')
            .select('SessionID')
            .eq('StudentID', studentId);

        if (partErr) throw partErr;

        if (!participaciones || participaciones.length === 0) {
            return res.status(200).json({ success: true, proximaSesion: null });
        }

        const sessionIds = participaciones.map(p => p.SessionID);

        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
        const hoyLocal = localISOTime.split('T')[0];

        const { data, error } = await supabaseAdmin
            .from('Session')
            .select('Date, StartTime, Topic, Url')
            .in('SessionID', sessionIds)
            .eq('Status', 'Scheduled')
            .gte('Date', hoyLocal)
            .order('Date', { ascending: true })
            .order('StartTime', { ascending: true })
            .limit(1);

        if (error) throw error;
        
        res.status(200).json({ success: true, proximaSesion: data.length > 0 ? data[0] : null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/guardar-incidencias', async (req, res) => {
    const { SessionID, estudiantesData } = req.body;
    try {
        if (estudiantesData && estudiantesData.length > 0) {
            for (let est of estudiantesData) {
                await supabaseAdmin
                    .from('SessionStudents')
                    .update({ 
                        Attendance: est.Attendance, 
                        IncidentReport: est.IncidentReport 
                    })
                    .eq('SessionID', SessionID)
                    .eq('StudentID', est.StudentID);
            }
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/posponer-sesion', async (req, res) => {
    const { SessionID, TutorID, NewDate, NewTime, Estudiantes, Topic } = req.body;
    try {
        const { error } = await supabaseAdmin.from('Session')
            .update({ Date: NewDate, StartTime: NewTime })
            .eq('SessionID', SessionID);
        if (error) throw error;

        if (Estudiantes && Estudiantes.length > 0) {
            const notifs = Estudiantes.map(est => ({
                ReceiverID: est.StudentID,
                SenderID: TutorID,
                Type: 'SessionAgendada',
                Title: 'Sesion Reagendada',
                Message: `Tu tutor pospuso la sesion "${Topic}". Nueva fecha: ${NewDate} a las ${NewTime}.`,
                RelatedEntityID: SessionID
            }));
            await supabaseAdmin.from('Notifications').insert(notifs);
        }
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/cancelar-sesion', async (req, res) => {
    const { SessionID, TutorID, Estudiantes, Topic } = req.body;
    try {
        const { error } = await supabaseAdmin.from('Session')
            .update({ Status: 'Canceled' })
            .eq('SessionID', SessionID);
        if (error) throw error;

        if (Estudiantes && Estudiantes.length > 0) {
            const notifs = Estudiantes.map(est => ({
                ReceiverID: est.StudentID,
                SenderID: TutorID,
                Type: 'ReporteIncidencia', 
                Title: 'Sesion Cancelada',
                Message: `Tu tutor ha cancelado la sesion de "${Topic}". Contacta con el para mas informacion.`,
                RelatedEntityID: SessionID
            }));
            await supabaseAdmin.from('Notifications').insert(notifs);
        }
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;