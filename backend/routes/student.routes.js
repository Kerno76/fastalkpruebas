const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const cron = require('node-cron');

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
            .select(`*, Courses ( Name, Level, Status )`)
            .eq('StudentID', studentId)
            .order('Deadline', { ascending: true });

        if (error) throw error;

        // Filtramos tareas canceladas en inglés y español
        const assignments = allAssignments.filter(a => 
            a.Status?.toLowerCase() !== 'canceled' && a.Status?.toLowerCase() !== 'cancelado'
        );

        const tutorIds = [...new Set(assignments.map(a => a.TutorID).filter(Boolean))];
        let profiles = [];
        
        if (tutorIds.length > 0) {
            const { data: profData, error: profErr } = await supabaseAdmin
                .from('UsersProfiles')
                .select('ID, Name')
                .in('ID', tutorIds);
            if (!profErr && profData) profiles = profData;
        }

        const tareasFormateadas = assignments.map(t => {
            const tutorProfile = profiles.find(p => p.ID === t.TutorID);
            return {
                id: t.AssignmentID,
                tutorId: t.TutorID,
                tutorName: tutorProfile?.Name || 'Tu Tutor',
                courseName: `${t.Courses?.Name || ''} ${t.Courses?.Level || ''}`.trim(),
                courseStatus: t.Courses?.Status || null, 
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
        console.error("Error en tareas:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/entregar-tarea', async (req, res) => {
    const { AssignmentID, StudentID, TutorID, Title, Links, Files } = req.body;
    
    try {
        let uploadedFilesArray = [];

        if (Files && Files.length > 0) {
            for (let file of Files) {
                const buffer = Buffer.from(file.fileBase64.split(',')[1], 'base64');
                const cleanFileName = file.fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "");
                const uniqueName = `entrega_${StudentID}_${Date.now()}_${cleanFileName}`;
                
                await supabaseAdmin.storage.from('entregas-alumnos').upload(`public/${uniqueName}`, buffer, { contentType: file.fileType });
                const { data: urlData } = supabaseAdmin.storage.from('entregas-alumnos').getPublicUrl(`public/${uniqueName}`);
                
                uploadedFilesArray.push({
                    name: file.fileName,
                    url: urlData.publicUrl
                });
            }
        }

        const linksText = Links && Links.length > 0 ? JSON.stringify(Links) : null;
        const filesText = uploadedFilesArray.length > 0 ? JSON.stringify(uploadedFilesArray) : null;

        const { error } = await supabaseAdmin
            .from('Assignments')
            .update({ 
                Status: 'Submitted', 
                StudentUrl: linksText, 
                StudentFile: filesText, 
                AllowResubmit: false 
            })
            .eq('AssignmentID', AssignmentID);

        if (error) throw error;

        const { data: studentProfile } = await supabaseAdmin.from('UsersProfiles').select('Name').eq('ID', StudentID).single();
        
        await supabaseAdmin.from('Notifications').insert([{
            ReceiverID: TutorID,
            SenderID: StudentID,
            Type: 'MaterialSubido', 
            Title: 'Tarea Entregada',
            Message: `El alumno ${studentProfile?.Name || ''} ha entregado su evidencia para la tarea "${Title}".`,
            RelatedEntityID: AssignmentID
        }]);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error al subir tarea múltiple:", error);
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
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/dashboard-summary/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: studentBase } = await supabaseAdmin
            .from('Students')
            .select('Language, CurrentLevel')
            .eq('ID', studentId)
            .single();

        const { data: enrollments } = await supabaseAdmin
            .from('Enrollments')
            .select(`CourseID, Courses ( Name, TutorID, Status )`)
            .eq('StudentID', studentId);

        const currentEnrollment = enrollments?.find(e => 
            e.Courses && ['Active', 'Upcoming'].includes(e.Courses.Status)
        );

        let courseData = null;
        let tutorData = null;
        let pendingCount = 0;
        let submittedCount = 0;
        let missingCount = 0;

        if (currentEnrollment) {
            courseData = currentEnrollment.Courses;

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

            const { data: assignments, error: assignmentsError } = await supabaseAdmin
    .from('Assignments')
    .select('AssignmentID, Status, Deadline')
    .eq('StudentID', studentId)
    .eq('CourseID', currentEnrollment.CourseID);

    if (assignmentsError) throw assignmentsError;

    const now = new Date();

    assignments.forEach(task => {

        const status = task.Status?.toLowerCase();

        if (status === 'submitted' || status === 'graded') {
            submittedCount++;
            return;
        }

        if (status === 'pending') {

            if (!task.Deadline) {
                pendingCount++;
                return;
            }

            const deadline = new Date(task.Deadline);

            if (deadline < now) {
                missingCount++;
            }

            else {
                pendingCount++;
            }
        }
    });
        }

        res.status(200).json({
            success: true,
            summary: {
                language: studentBase?.Language || 'Sin idioma',
                level: studentBase?.CurrentLevel || 'Sin nivel',
                courseName: courseData?.Name || 'Sin curso activo',
                tutor: tutorData || { name: 'Por asignar', career: '-' },
                pendingTasks: pendingCount,
                submittedTasks: submittedCount,
                missingTasks: missingCount
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/mi-tutor/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: enrollments, error: enrollErr } = await supabaseAdmin
            .from('Enrollments')
            .select(`CourseID, Courses ( TutorID, Status )`)
            .eq('StudentID', studentId);

        if (enrollErr) throw enrollErr;

        const currentEnrollment = enrollments?.find(e => 
            e.Courses && ['Active', 'Upcoming'].includes(e.Courses.Status)
        );

        if (!currentEnrollment || !currentEnrollment.Courses.TutorID) {
            return res.status(200).json({ success: true, tutor: null, sesiones: [] });
        }

        const tutorId = currentEnrollment.Courses.TutorID;

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
                .eq('CourseID', currentEnrollment.CourseID)
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
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/ultima-calificacion/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: enrollments, error } = await supabaseAdmin
            .from('Enrollments')
            .select('FinalGrade, CourseID')
            .eq('StudentID', studentId)
            .not('FinalGrade', 'is', null) 
            .order('EnrollmentID', { ascending: false })
            .limit(1);

        if (error) throw error;
        
        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({ success: true, data: null }); 
        }

        const courseInfo = await supabaseAdmin
            .from('Courses')
            .select('Name')
            .eq('CourseID', enrollments[0].CourseID)
            .single();

        res.status(200).json({ 
            success: true, 
            data: { 
                grade: enrollments[0].FinalGrade, 
                courseName: courseInfo.data?.Name || 'Curso Anterior' 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/eventos-calendario/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: enrollments } = await supabaseAdmin.from('Enrollments').select('CourseID').eq('StudentID', studentId);
        if (!enrollments || enrollments.length === 0) return res.status(200).json({ success: true, eventos: [] });

        const courseIds = enrollments.map(e => e.CourseID);
        const { data: activeCourses } = await supabaseAdmin.from('Courses')
            .select('CourseID, Name')
            .in('CourseID', courseIds)
            .in('Status', ['Active', 'Upcoming']);
            
        if (!activeCourses || activeCourses.length === 0) return res.status(200).json({ success: true, eventos: [] });
        const activeCourseIds = activeCourses.map(c => c.CourseID);

        const { data: assignments } = await supabaseAdmin.from('Assignments').select('*').eq('StudentID', studentId).in('CourseID', activeCourseIds);
        const { data: sessions } = await supabaseAdmin.from('Session').select('*').in('CourseID', activeCourseIds);

        const tzOptions = { timeZone: 'America/Mexico_City' };
        const now = new Date();
        const hoyStr = now.toLocaleDateString('sv-SE', tzOptions); 
        const horaStr = now.toLocaleTimeString('es-MX', { ...tzOptions, hour: '2-digit', minute: '2-digit', hour12: false }).substring(0, 5);

        let eventos = [];

        if (assignments) {
            const tareasValidas = assignments.filter(a => {
                if (['Canceled', 'Cancelado', 'Submitted', 'Graded'].includes(a.Status)) return false;
                if (!a.Deadline) return false;
                
                const partes = a.Deadline.split(/[T ]/);
                const dDate = partes[0];
                const dTime = partes[1];
                const tTime = dTime ? dTime.substring(0, 5) : '23:59';
                
                if (dDate < hoyStr) return false; 
                if (dDate === hoyStr && tTime <= horaStr) return false; 
                return true;
            });
            
            tareasValidas.forEach(a => {
                const curso = activeCourses.find(c => c.CourseID === a.CourseID);
                const partes = a.Deadline.split(/[T ]/);
                const dDate = partes[0];
                const dTime = partes[1];
                eventos.push({
                    id: `tar_${a.AssignmentID}`,
                    type: 'Tarea',
                    title: a.Title,
                    date: dDate,
                    time: dTime ? dTime.substring(0, 5) : '23:59',
                    course: curso?.Name || 'Curso',
                    description: a.Description || 'Fecha límite para entregar tarea.'
                });
            });
        }

        if (sessions) {
            const sesionesValidas = sessions.filter(s => {
                if (['Canceled', 'Cancelado', 'Completed'].includes(s.Status)) return false;
                if (!s.Date || !s.StartTime) return false;
                
                if (s.Date < hoyStr) return false; 
                if (s.Date === hoyStr && s.StartTime.substring(0, 5) <= horaStr) return false; 
                return true;
            });
            
            sesionesValidas.forEach(s => {
                const curso = activeCourses.find(c => c.CourseID === s.CourseID);
                eventos.push({
                    id: `ses_${s.SessionID}`,
                    type: 'Sesión',
                    title: s.Topic,
                    date: s.Date,
                    time: s.StartTime.substring(0, 5),
                    course: curso?.Name || 'Curso',
                    description: s.Description || 'Sesión virtual de clase programada.'
                });
            });
        }

        res.status(200).json({ success: true, eventos });
    } catch (error) {
        console.error("Error en eventos-calendario:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/recursos-compartidos/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('SharedResources')
            .select('*')
            .eq('StudentID', studentId)
            .order('CreatedAt', { ascending: false });

        if (error) throw error;
        res.status(200).json({ success: true, recursos: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;