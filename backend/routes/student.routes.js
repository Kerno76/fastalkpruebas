const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

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
        const hoy = new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseAdmin
            .from('Session')
            .select('Date, StartTime, Topic, Url')
            .in('SessionID', sessionIds)
            .eq('Status', 'Scheduled')
            .gte('Date', hoy)
            .order('Date', { ascending: true })
            .order('StartTime', { ascending: true })
            .limit(1);

        if (error) throw error;
        
        res.status(200).json({ success: true, proximaSesion: data.length > 0 ? data[0] : null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/tareas/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: allAssignments, error } = await supabaseAdmin
            .from('Assignments')
            .select(`*, Courses ( Name, Level )`)
            .eq('StudentID', studentId)
            .order('Deadline', { ascending: true });

        if (error) throw error;

        const assignments = allAssignments.filter(a => a.Status?.toLowerCase() !== 'canceled');

        const tutorIds = [...new Set(assignments.map(a => a.TutorID).filter(Boolean))];
        let profiles = [];
        
        if (tutorIds.length > 0) {
            const { data: profData, error: profErr } = await supabaseAdmin
                .from('UsersProfiles')
                .select('ID, Name')
                .in('ID', tutorIds);
            if (!profErr) profiles = profData;
        }

        const tareasFormateadas = assignments.map(t => {
            const tutorProfile = profiles.find(p => p.ID === t.TutorID);
            return {
                id: t.AssignmentID,
                tutorId: t.TutorID,
                tutorName: tutorProfile?.Name || 'Tu Tutor',
                courseName: `${t.Courses?.Name || ''} ${t.Courses?.Level || ''}`.trim(),
                title: t.Title,
                description: t.Description,
                deadline: t.Deadline,
                status: t.Status, 
                grade: t.Grade,
                feedback: t.Feedback,
                helpMaterialLink: t.HelpMaterialLink,
                helpMaterialFile: t.HelpMaterialFile,
                studentFile: t.StudentFile,
                studentUrl: t.StudentUrl,
                allowResubmit: t.AllowResubmit
            };
        });

        res.status(200).json({ success: true, tareas: tareasFormateadas });
    } catch (error) {
        console.error("Error en GET /tareas (Student):", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/entregar-tarea', async (req, res) => {
    const { AssignmentID, StudentID, TutorID, Title, fileBase64, fileName, fileType, studentUrl } = req.body;
    try {
        let fileUrl = null;

        if (fileBase64) {
            const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
            
            const cleanFileName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "");
            const uniqueName = `entrega_${StudentID}_${Date.now()}_${cleanFileName}`;
            
            await supabaseAdmin.storage.from('entregas-alumnos').upload(`public/${uniqueName}`, buffer, { contentType: fileType });
            const { data: urlData } = supabaseAdmin.storage.from('entregas-alumnos').getPublicUrl(`public/${uniqueName}`);
            fileUrl = urlData.publicUrl;
        }

        const { error: updateErr } = await supabaseAdmin.from('Assignments')
            .update({
                Status: 'Submitted',
                StudentFile: fileUrl,
                StudentUrl: studentUrl || null
            })
            .eq('AssignmentID', AssignmentID);

        if (updateErr) throw updateErr;

        const { data: studentData } = await supabaseAdmin.from('UsersProfiles').select('Name').eq('ID', StudentID).single();

        await supabaseAdmin.from('Notifications').insert([{
            ReceiverID: TutorID,
            SenderID: StudentID,
            Type: 'MaterialSubido',
            Title: 'Tarea Entregada',
            Message: `El alumno ${studentData?.Name || ''} ha entregado la tarea: "${Title}". Ya puedes calificarla.`,
            RelatedEntityID: AssignmentID
        }]);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/sesiones/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: participaciones, error: partErr } = await supabaseAdmin
            .from('SessionStudents')
            .select('SessionID, Attendance')
            .eq('StudentID', studentId);

        if (partErr) throw partErr;

        if (!participaciones || participaciones.length === 0) {
            return res.status(200).json({ success: true, sesiones: [] });
        }

        const sessionIds = participaciones.map(p => p.SessionID);

        const { data: sessions, error: sessErr } = await supabaseAdmin
            .from('Session')
            .select(`
                *,
                Courses ( Name, Level, Language )
            `)
            .in('SessionID', sessionIds)
            .order('Date', { ascending: true })
            .order('StartTime', { ascending: true });

        if (sessErr) throw sessErr;

        const sesionesFormateadas = sessions.map(sess => {
            const participacion = participaciones.find(p => p.SessionID === sess.SessionID);
            return {
                id: sess.SessionID,
                date: sess.Date,
                time: sess.StartTime,
                course: sess.Courses?.Name || 'Curso',
                language: sess.Courses?.Language || 'Inglés', 
                level: sess.Courses?.Level || '',
                topic: sess.Topic || 'Tema por definir',
                url: sess.Url,
                attendance: participacion?.Attendance || null
            };
        });

        res.status(200).json({ success: true, sesiones: sesionesFormateadas });
    } catch (error) {
        console.error("Error en GET /sesiones:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});


router.get('/dashboard-summary/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: enrollments, error: enrollErr } = await supabaseAdmin
            .from('Enrollments')
            .select(`
                CourseID,
                Courses ( Name, Language, Level, TutorID )
            `)
            .eq('StudentID', studentId)
            .limit(1); 

        let courseData = null;
        let tutorData = null;

        if (!enrollErr && enrollments && enrollments.length > 0) {
            courseData = enrollments[0].Courses;

            if (courseData && courseData.TutorID) {
                const { data: tutorProfile } = await supabaseAdmin
                    .from('UsersProfiles')
                    .select('Name')
                    .eq('ID', courseData.TutorID)
                    .single();

                const { data: tutorDetails } = await supabaseAdmin
                    .from('Tutors')
                    .select('Career')
                    .eq('ID', courseData.TutorID)
                    .single();

                tutorData = {
                    name: tutorProfile?.Name || 'Tutor Asignado',
                    career: tutorDetails?.Career || 'Profesional de Idiomas'
                };
            }
        }

        const { count: pendingCount, error: tasksErr } = await supabaseAdmin
            .from('Assignments')
            .select('AssignmentID', { count: 'exact', head: true })
            .eq('StudentID', studentId)
            .eq('Status', 'Pending');

        res.status(200).json({
            success: true,
            summary: {
                language: courseData?.Language || 'Idioma',
                level: courseData?.Level || 'Nivel',
                courseName: courseData?.Name || 'No inscrito',
                tutor: tutorData || { name: 'Por asignar', career: '-' },
                pendingTasks: pendingCount || 0
            }
        });

    } catch (error) {
        console.error("Error en dashboard-summary:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});



router.get('/mi-tutor/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: enrollments, error: enrollErr } = await supabaseAdmin
            .from('Enrollments')
            .select(`CourseID, Courses ( TutorID )`)
            .eq('StudentID', studentId)
            .limit(1);

        if (enrollErr || !enrollments || enrollments.length === 0 || !enrollments[0].Courses?.TutorID) {
            return res.status(200).json({ success: true, tutor: null, sesiones: [] });
        }

        const tutorId = enrollments[0].Courses.TutorID;

        const { data: profile } = await supabaseAdmin.from('UsersProfiles').select('Name, Email, AvatarUrl').eq('ID', tutorId).single();
        const { data: tutorDetails } = await supabaseAdmin.from('Tutors').select('Phone, Career, Hobbies').eq('ID', tutorId).single();

        const tutorData = {
            name: profile?.Name || 'Tutor Asignado',
            email: profile?.Email || 'Sin correo registrado',
            avatar: profile?.AvatarUrl || '',
            phone: tutorDetails?.Phone || '',
            specialty: tutorDetails?.Career || 'Profesional de Idiomas',
            bio: tutorDetails?.Hobbies ? `Mis intereses: ${tutorDetails.Hobbies}` : '¡Hola! Soy tu tutor asignado y estoy aquí para apoyarte en tu aprendizaje.'
        };

        const hoy = new Date().toISOString().split('T')[0];
        const { data: participaciones } = await supabaseAdmin.from('SessionStudents').select('SessionID').eq('StudentID', studentId);
        
        let upcomingSessions = [];
        if (participaciones && participaciones.length > 0) {
            const sessionIds = participaciones.map(p => p.SessionID);
            const { data: sessions } = await supabaseAdmin
                .from('Session')
                .select('SessionID, Date, StartTime')
                .in('SessionID', sessionIds)
                .eq('Status', 'Scheduled')
                .gte('Date', hoy)
                .order('Date', { ascending: true })
                .order('StartTime', { ascending: true })
                .limit(4);
            
            if (sessions) {
                upcomingSessions = sessions.map(s => ({
                    id: s.SessionID,
                    date: `${s.Date} a las ${s.StartTime.slice(0,5)}`,
                    status: 'Programada'
                }));
            }
        }

        res.status(200).json({ success: true, tutor: tutorData, sesiones: upcomingSessions });
    } catch (error) {
        console.error("Error en GET /mi-tutor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;