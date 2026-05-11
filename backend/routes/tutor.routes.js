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


router.post('/asignar-tarea', async (req, res) => {
    const { TutorID, StudentIDs, CourseID, Title, Description, Deadline, HelpMaterialLink, fileBase64, fileName, fileType } = req.body;

    try {
        let fileUrl = null;
        if (fileBase64) {
            const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
            const cleanFileName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "");
            const uniqueName = `material_${Date.now()}_${cleanFileName}`;
            
            await supabaseAdmin.storage.from('material-tareas-tutor').upload(`public/${uniqueName}`, buffer, { contentType: fileType });
            const { data: urlData } = supabaseAdmin.storage.from('material-tareas-tutor').getPublicUrl(`public/${uniqueName}`);
            fileUrl = urlData.publicUrl;
        }

        const assignmentsPayload = StudentIDs.map(studentId => ({
            TutorID, StudentID: studentId, CourseID, Title, Description, 
            Deadline, HelpMaterialLink, HelpMaterialFile: fileUrl, Status: 'Pending'
        }));

        const { data: insertedAssignments, error: assignErr } = await supabaseAdmin
            .from('Assignments').insert(assignmentsPayload).select('AssignmentID, StudentID');
        if (assignErr) throw assignErr;

        const notificationsPayload = insertedAssignments.map(assignment => ({
            ReceiverID: assignment.StudentID, SenderID: TutorID, Type: 'AsignacionCurso', 
            Title: 'Nueva Tarea Asignada', Message: `Tu tutor ha publicado una nueva tarea: "${Title}". Revisa la fecha limite.`,
            RelatedEntityID: assignment.AssignmentID
        }));
        await supabaseAdmin.from('Notifications').insert(notificationsPayload);

        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});


router.get('/tareas-calificar/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: allAssignments, error } = await supabaseAdmin
            .from('Assignments')
            .select(`*, Courses ( Name, Level )`)
            .eq('TutorID', tutorId)
            .order('Deadline', { ascending: false });

        if (error) throw error;

        // Filtro seguro en Javascript
        const assignments = allAssignments.filter(a => a.Status?.toLowerCase() !== 'canceled');

        const studentIds = [...new Set(assignments.map(a => a.StudentID).filter(Boolean))];
        let profiles = [];
        
        if (studentIds.length > 0) {
            const { data: profData, error: profErr } = await supabaseAdmin
                .from('UsersProfiles')
                .select('ID, Name, Email')
                .in('ID', studentIds);
            if (!profErr) profiles = profData;
        }

        const porEstudiante = assignments.reduce((acc, task) => {
            const statusNormal = task.Status?.toLowerCase();
            if (statusNormal === 'pending') return acc; 

            const studentId = task.StudentID;
            const studentProfile = profiles.find(p => p.ID === studentId);

            if (!acc[studentId]) {
                acc[studentId] = {
                    id: studentId, 
                    name: studentProfile?.Name || 'Alumno',
                    course: `${task.Courses?.Name || ''} ${task.Courses?.Level || ''}`.trim(), 
                    tasks: []
                };
            }

            let statusText = 'Pendiente por Calificar';
            if (statusNormal === 'graded') statusText = 'Calificada';

            acc[studentId].tasks.push({
                id: task.AssignmentID, 
                title: task.Title, 
                description: task.Description,
                date: task.Deadline, 
                status: statusText, 
                grade: task.Grade ? `${task.Grade}/100` : null,
                archivoAlumno: task.StudentFile, 
                urlAlumno: task.StudentUrl
            });
            return acc;
        }, {});

        const porTarea = assignments.reduce((acc, task) => {
            const key = `${task.CourseID}_${task.Title}`;
            if (!acc[key]) {
                acc[key] = {
                    CourseID: task.CourseID,
                    CourseName: task.Courses?.Name || 'Curso', 
                    Title: task.Title, 
                    Description: task.Description,
                    Deadline: task.Deadline, 
                    HelpMaterialFile: task.HelpMaterialFile, 
                    HelpMaterialLink: task.HelpMaterialLink, 
                    AssignmentIDs: [], 
                    StudentIDs: []
                };
            }
            acc[key].AssignmentIDs.push(task.AssignmentID);
            acc[key].StudentIDs.push(task.StudentID);
            return acc;
        }, {});

        res.status(200).json({ success: true, estudiantes: Object.values(porEstudiante), publicadas: Object.values(porTarea) });
    } catch (error) { 
        console.error("Error en GET /tareas-calificar (Tutor):", error.message);
        res.status(500).json({ success: false, message: error.message }); 
    }
});

router.put('/actualizar-deadline', async (req, res) => {
    const { AssignmentIDs, NewDeadline, Title, TutorID, StudentIDs } = req.body;
    try {
        await supabaseAdmin.from('Assignments').update({ Deadline: NewDeadline }).in('AssignmentID', AssignmentIDs);

        const notificaciones = StudentIDs.map(sid => ({
            ReceiverID: sid, SenderID: TutorID, Type: 'AsignacionCurso',
            Title: 'Fecha limite actualizada', Message: `Se ha modificado la fecha limite de la tarea "${Title}". Revisa el nuevo plazo.`,
            RelatedEntityID: null 
        }));
        await supabaseAdmin.from('Notifications').insert(notificaciones);

        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});


router.put('/cancelar-tarea', async (req, res) => {
    const { AssignmentIDs, Title, TutorID, StudentIDs } = req.body;
    try {
        await supabaseAdmin.from('Assignments').update({ Status: 'Canceled' }).in('AssignmentID', AssignmentIDs);

        const notificaciones = StudentIDs.map(sid => ({
            ReceiverID: sid, SenderID: TutorID, Type: 'AsignacionCurso',
            Title: 'Tarea Cancelada', Message: `Tu tutor ha cancelado la tarea "${Title}". Ya no es necesario entregarla.`,
            RelatedEntityID: null 
        }));
        await supabaseAdmin.from('Notifications').insert(notificaciones);

        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});


router.put('/calificar-tarea', async (req, res) => {
    const { AssignmentID, Grade, Feedback, AllowResubmit, StudentID, TutorID, Title } = req.body;
    
    try {
        const { error } = await supabaseAdmin
            .from('Assignments')
            .update({ 
                Grade, 
                Feedback, 
                AllowResubmit, 
                Status: 'Graded' 
            })
            .eq('AssignmentID', AssignmentID);

        if (error) throw error;

        let mensajeNotif = `Tu tutor ha calificado tu entrega de "${Title}" con ${Grade}/100.`;
        if (AllowResubmit) {
            mensajeNotif += " Además, te ha dado la oportunidad de hacer correcciones y volver a entregarla.";
        }

        await supabaseAdmin.from('Notifications').insert([{
            ReceiverID: StudentID,
            SenderID: TutorID,
            Type: 'AsignacionCurso', 
            Title: '¡Tarea Calificada!',
            Message: mensajeNotif,
            RelatedEntityID: AssignmentID
        }]);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error al calificar tarea:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/editar-tarea-completa', async (req, res) => {
    const { AssignmentIDs, CurrentStudentIDs, NewStudentIDs, CourseID, TutorID, Title, Description, Deadline, HelpMaterialLink, fileBase64, fileName, fileType, existingFileUrl, removeExistingFile } = req.body;

    try {
        let fileUrl = removeExistingFile ? null : (existingFileUrl || null);
        
        if (fileBase64) {
            const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
            const cleanFileName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "");
            const uniqueName = `material_${Date.now()}_${cleanFileName}`;
            await supabaseAdmin.storage.from('material-tareas-tutor').upload(`public/${uniqueName}`, buffer, { contentType: fileType });
            const { data: urlData } = supabaseAdmin.storage.from('material-tareas-tutor').getPublicUrl(`public/${uniqueName}`);
            fileUrl = urlData.publicUrl; 
        }

        await supabaseAdmin.from('Assignments')
            .update({ Title, Description, Deadline, HelpMaterialLink, HelpMaterialFile: fileUrl })
            .in('AssignmentID', AssignmentIDs);

        const studentsToAdd = NewStudentIDs.filter(id => !CurrentStudentIDs.includes(id));
        const studentsToRemove = CurrentStudentIDs.filter(id => !NewStudentIDs.includes(id));

        if (studentsToRemove.length > 0) {
            const idsToCancel = AssignmentIDs.filter((_, idx) => studentsToRemove.includes(CurrentStudentIDs[idx]));
            if (idsToCancel.length > 0) {
                await supabaseAdmin.from('Assignments').update({ Status: 'Canceled' }).in('AssignmentID', idsToCancel);
            }
        }

        if (studentsToAdd.length > 0) {
            const newAssignments = studentsToAdd.map(studentId => ({
                TutorID, StudentID: studentId, CourseID, Title, Description,
                Deadline, HelpMaterialLink, HelpMaterialFile: fileUrl, Status: 'Pending'
            }));
            const { data: newInserts } = await supabaseAdmin.from('Assignments').insert(newAssignments).select('AssignmentID, StudentID');
            
            if(newInserts) {
                const notifs = newInserts.map(a => ({
                    ReceiverID: a.StudentID, SenderID: TutorID, Type: 'AsignacionCurso', 
                    Title: 'Nueva Tarea Asignada', Message: `Se te ha asignado la tarea: "${Title}".`, RelatedEntityID: a.AssignmentID
                }));
                await supabaseAdmin.from('Notifications').insert(notifs);
            }
        }

        const studentsToNotifyUpdate = CurrentStudentIDs.filter(id => !studentsToRemove.includes(id));
        if(studentsToNotifyUpdate.length > 0) {
            const updateNotifs = studentsToNotifyUpdate.map(sid => ({
                ReceiverID: sid, SenderID: TutorID, Type: 'AsignacionCurso',
                Title: 'Actualizacion de Tarea', Message: `El tutor ha modificado detalles o material de la tarea "${Title}".`, RelatedEntityID: null
            }));
            await supabaseAdmin.from('Notifications').insert(updateNotifs);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = router;