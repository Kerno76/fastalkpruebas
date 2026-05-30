const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dancc3112@gmail.com',
        pass: 'pmqfsimimwkdvovn' 
    }
});

const getTemplateCorreo = (rol, nombre, email, passwordTemporal, language) => {
    let detalleRol = '';

    if (rol === 'Tutor') {
        detalleRol = `<p>Idioma a impartir: <strong>${language}</strong></p>`;
    } else if (rol === 'Student') {
        detalleRol = `<p>Curso enrolado: <strong>${language}</strong></p>`;
    } else if (rol === 'Reviewer') {
        detalleRol = `<p>Tu función será evaluar y revisar el material de los tutores.</p>`;
    }

    return `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #3b82f6;">¡Hola, ${nombre}!</h2>
            <p>Tu cuenta como <strong>${rol}</strong> ha sido creada exitosamente.</p>
            ${detalleRol}
            <div style="background: #f4f4f4; padding: 10px; border-radius: 5px;">
                <p><strong>Usuario:</strong> ${email}</p>
                <p><strong>Contraseña:</strong> ${passwordTemporal}</p>
            </div>
            <br>
            <a href="http://localhost:5173/login" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Entrar a FasTalk</a>
        </div>
    `;
};

router.post('/registrar', async (req, res) => {
    const { nombre, email, rol, hobbies, language, Phone, career, BirthDate, CurrentLevel, assignedTutors, notes, programa } = req.body; 
    
    const passwordTemporal = '12345678';

    try {
        const { data: existingUsers, error: checkError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('Name, Email')
            .or(`Email.eq.${email},Name.eq.${nombre}`);

        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
            const emailDuplicado = existingUsers.find(u => u.Email.toLowerCase() === email.toLowerCase());
            if (emailDuplicado) {
                return res.status(400).json({ 
                    success: false, 
                    message: `El correo ${email} ya está registrado en otra cuenta.` 
                });
            }

            const nombreDuplicado = existingUsers.find(u => u.Name.toLowerCase() === nombre.toLowerCase());
            if (nombreDuplicado) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Ya existe un usuario llamado "${nombre}". Favor de agregar un apellido para diferenciarlo.` 
                });
            }
        }

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: passwordTemporal,
            email_confirm: true
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                return res.status(400).json({ success: false, message: 'Este correo ya está registrado en el sistema de autenticación.' });
            }
            throw authError;
        }

        const userId = authUser.user.id;

        const { error: profileError } = await supabaseAdmin
            .from('UsersProfiles')
            .insert([{ ID: userId, Name: nombre, Email: email, Rol: rol, BirthDate: BirthDate }]);

        if (profileError) throw profileError;

        const localISOTime = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        if (rol === 'Tutor') {
            const { error: tutorError } = await supabaseAdmin
                .from('Tutors')
                .insert([{
                    ID: userId,
                    Phone: Phone,
                    Language: language,
                    Hobbies: hobbies,
                    Career: career,
                    Notes: notes,
                    DateJoined: localISOTime,
                    ProgramType: programa
                }]);
            if (tutorError) throw tutorError;
        } else if (rol === 'Student') {
            const { error: studentError } = await supabaseAdmin
                .from('Students')
                .insert([{ 
                    ID: userId, 
                    Phone: Phone,
                    Language: language,
                    CurrentLevel: CurrentLevel,
                    Notes: notes,
                    DateJoined: localISOTime
                }]);
            if (studentError) throw studentError;
        } else if (rol === 'Reviewer') {
            const totalAssigned = assignedTutors ? assignedTutors.length : 0;

            const { error: reviewerError } = await supabaseAdmin
                .from('Reviewer') 
                .insert([{ 
                    ID: userId,
                    Phone: Phone,
                    Career: career,
                    AsignedTutors: totalAssigned,
                    Notes: notes,
                    DateJoined: localISOTime 
                }]);
                
            if (reviewerError) throw reviewerError;

            if (totalAssigned > 0) {
                const enrollments = assignedTutors.map(tutorId => ({
                    TutorID: tutorId,
                    ReviewerID: userId
                }));

                const { error: enrollError } = await supabaseAdmin
                    .from('Enrollments_Reviewers')
                    .insert(enrollments);
                    
                if (enrollError) throw enrollError;
            }
        }

        const mailOptions = {
            from: '"FasTalk Admin" <dancc3112@gmail.com>',
            to: email,
            subject: `Bienvenido a FasTalk - Cuenta de ${rol} activada`,
            html: getTemplateCorreo(rol, nombre, email, passwordTemporal, language)
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Usuario registrado y correo enviado.' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/editar-tutor', async (req, res) => {
    const { userId, Name, BirthDate, Phone, Language, Career, Hobbies, Notes, Programa } = req.body;
    try {
        const { data: tutorActual, error: checkErr } = await supabaseAdmin
            .from('Tutors')
            .select('Language', 'ProgramType')
            .eq('ID', userId)
            .single();

        if (checkErr) throw checkErr;

        if (tutorActual) {
            const intentoCambiarIdioma = tutorActual.Language !== Language;
            const intentoCambiarPrograma = tutorActual.ProgramType != Programa; 

            if (intentoCambiarIdioma || intentoCambiarPrograma) {
                // Buscamos si tiene cursos asignados
                const { data: cursosAsignados, error: cursosErr } = await supabaseAdmin
                    .from('Courses')
                    .select('CourseID')
                    .eq('TutorID', userId);

                if (cursosErr) throw cursosErr;

                // Si tiene cursos, bloqueamos la acción y le decimos exactamente qué falló
                if (cursosAsignados && cursosAsignados.length > 0) {
                    const motivo = intentoCambiarIdioma ? 'el idioma' : 'el programa de servicio social';
                    return res.status(400).json({ 
                        success: false, 
                        message: `No se puede cambiar ${motivo} porque el tutor ya tiene cursos o alumnos asignados. Debes retirarlo de sus cursos primero.` 
                    });
                }
            }
        }

        const { error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .update({ Name, BirthDate })
            .eq('ID', userId);
        if (profErr) throw profErr;

        const { error: tutErr } = await supabaseAdmin
            .from('Tutors')
            .update({ Phone, Language, Career, Hobbies, Notes, ProgramType: Programa })
            .eq('ID', userId);
        if (tutErr) throw tutErr;

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/editar-estudiante', async (req, res) => {
    const { userId, Name, BirthDate, Phone, Language, CurrentLevel, Notes } = req.body;
    try {
        const { data: estudianteActual, error: checkErr } = await supabaseAdmin
            .from('Students')
            .select('Language')
            .eq('ID', userId)
            .single();

        if (checkErr) throw checkErr;

        if (estudianteActual && estudianteActual.Language !== Language) {
            const { data: cursosEnrolado, error: cursosErr } = await supabaseAdmin
                .from('Enrollments')
                .select('CourseID')
                .eq('StudentID', userId);

            if (cursosErr) throw cursosErr;

            if (cursosEnrolado && cursosEnrolado.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `No se puede cambiar el idioma a ${Language} porque el estudiante está enrolado en un curso. Debes retirarlo del curso primero.` 
                });
            }
        }

        const { error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .update({ Name, BirthDate })
            .eq('ID', userId);
        if (profErr) throw profErr;

        const { error: estErr } = await supabaseAdmin
            .from('Students')
            .update({ Phone, Language, CurrentLevel, Notes })
            .eq('ID', userId);
        if (estErr) throw estErr;

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/editar-reviewer', async (req, res) => {
    const { userId, Name, BirthDate, Phone, Career, Notes } = req.body;
    try {
        const { error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .update({ Name, BirthDate })
            .eq('ID', userId);
        if (profErr) throw profErr;

        const { error: revErr } = await supabaseAdmin
            .from('Reviewer')
            .update({ Phone, Career, Notes })
            .eq('ID', userId);
        if (revErr) throw revErr;

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/editar-curso', async (req, res) => {
    const { courseId, Name, Period, Language, Level, StartDate, EndDate, TutorID } = req.body;
    try {
        const { data: cursoActual } = await supabaseAdmin.from('Courses').select('Language').eq('CourseID', courseId).single();

        if (cursoActual && cursoActual.Language !== Language) {
            const { count } = await supabaseAdmin.from('Enrollments').select('*', { count: 'exact', head: true }).eq('CourseID', courseId);
            if (count > 0) {
                return res.status(400).json({ success: false, message: 'No se puede cambiar el idioma si hay alumnos inscritos.' });
            }
        }

        const ahora = new Date();
        const start = new Date(StartDate);
        const end = new Date(EndDate);
        
        let nuevoStatus = 'Active';
        if (ahora < start) nuevoStatus = 'Upcoming';
        if (ahora > end) nuevoStatus = 'Past';

        const { error } = await supabaseAdmin
            .from('Courses')
            .update({ 
                Name, Period, Language, Level, StartDate, EndDate, TutorID: TutorID || null,
                Status: nuevoStatus,       
                GradingStatus: 'Active'    
            })
            .eq('CourseID', courseId);
            
        if (error) throw error;

        res.status(200).json({ success: true, message: 'Curso actualizado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/remover-alumno-curso', async (req, res) => {
    const { courseId, studentId } = req.body;
    try {
        const { error } = await supabaseAdmin
            .from('Enrollments')
            .delete()
            .match({ CourseID: courseId, StudentID: studentId });

        if (error) throw error;
        
        res.status(200).json({ success: true, message: 'Alumno removido del curso.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/tutores', async (req, res) => {
    try {
        const { data: tutores, error } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`
                ID, Name, Email, Rol, State, BirthDate,
                Tutors ( Phone, Language, Hobbies, Career, TotalHours, DateJoined, Notes, ProgramType ) 
            `) 
            .eq('Rol', 'Tutor');

        if (error) throw error;

        const { data: asignaciones, error: enrollError } = await supabaseAdmin
            .from('Enrollments_Reviewers')
            .select('TutorID, ReviewerID');

        const tutoresCompletos = tutores.map(tutor => {
            const revisorAsignado = asignaciones?.filter(a => a.TutorID === tutor.ID) || [];
            return {
                ...tutor,
                Enrollments_Reviewers: revisorAsignado 
            };
        });

        res.status(200).json(tutoresCompletos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/estudiantes', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`
                ID, Name, Email, Rol, State, BirthDate,
                Students ( Phone, Language, CurrentLevel, Notes, DateJoined ) 
            `) 
            .eq('Rol', 'Student');

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/revisores', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`
                ID, Name, Email, Rol, State, BirthDate,
                Reviewer ( Phone, Career, AsignedTutors, ValidationsCompleted, Notes, DateJoined ) 
            `) 
            .eq('Rol', 'Reviewer');

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/cambiar-estado', async (req, res) => {
    const { userId, newState } = req.body;

    try {
        const { error } = await supabaseAdmin
            .from('UsersProfiles')
            .update({ State: newState })
            .eq('ID', userId);

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Estado actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/asignar-revisor', async (req, res) => {
    const { tutorId, reviewerId } = req.body;

    try {
        const { error: insertError } = await supabaseAdmin
            .from('Enrollments_Reviewers')
            .insert([{ TutorID: tutorId, ReviewerID: reviewerId }]);

        if (insertError) throw insertError;

        const { data: revisorData, error: fetchError } = await supabaseAdmin
            .from('Reviewer')
            .select('AsignedTutors')
            .eq('ID', reviewerId)
            .single();
            
        if (fetchError) throw fetchError;

        const nuevosTutores = (revisorData.AsignedTutors || 0) + 1;

        const { error: updateError } = await supabaseAdmin
            .from('Reviewer')
            .update({ AsignedTutors: nuevosTutores })
            .eq('ID', reviewerId);

        if (updateError) throw updateError;

        res.status(200).json({ success: true, message: 'Revisor asignado correctamente en la BD.' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/estudiantes-disponibles', async (req, res) => {
    try {
        const { data: estudiantes, error: estError } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`ID, Name, Students ( Language, CurrentLevel )`)
            .eq('Rol', 'Student');

        if (estError) throw estError;

        const { data: activeCourses, error: courseErr } = await supabaseAdmin
            .from('Courses')
            .select('CourseID, EndDate')
            .in('Status', ['Active', 'Upcoming']);
            
        if (courseErr) throw courseErr;
        
        const ahora = new Date();
        const activeCourseIds = activeCourses 
            ? activeCourses.filter(c => new Date(c.EndDate) >= ahora).map(c => c.CourseID) 
            : [];
            
        let enrolledIds = [];

        if (activeCourseIds.length > 0) {
            const { data: enrollments } = await supabaseAdmin
                .from('Enrollments')
                .select('StudentID')
                .in('CourseID', activeCourseIds);

            if (enrollments) enrolledIds = enrollments.map(e => e.StudentID);
        }

        const disponibles = estudiantes.filter(est => !enrolledIds.includes(est.ID));

        const formated = disponibles.map(est => {
            const studentData = Array.isArray(est.Students) ? est.Students[0] : (est.Students || {});
            return {
                ID: est.ID,
                Name: est.Name,
                Language: studentData.Language || '',
                CurrentLevel: studentData.CurrentLevel || ''
            };
        });

        res.status(200).json(formated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/cursos', async (req, res) => {
    const { Name, Language, Level, Period, TutorID, StartDate, EndDate, StudentIDs } = req.body;

    try {
        const ahora = new Date();
        const start = new Date(StartDate);
        const end = new Date(EndDate);
        
        let statusInicial = 'Active';
        if (ahora < start) statusInicial = 'Upcoming';
        if (ahora > end) statusInicial = 'Past';

        const { data: nuevoCurso, error: cursoError } = await supabaseAdmin
            .from('Courses')
            .insert([{ 
                Name, Language, Level, Period, TutorID: TutorID || null, 
                StartDate, EndDate, 
                Status: statusInicial, 
                GradingStatus: 'Active' 
            }])
            .select()
            .single();

        if (cursoError) throw cursoError;

        if (StudentIDs && StudentIDs.length > 0) {
            const enrollments = StudentIDs.map(studentId => ({
                CourseID: nuevoCurso.CourseID,
                StudentID: studentId
            }));

            await supabaseAdmin.from('Enrollments').insert(enrollments);
        }

        res.status(200).json({ success: true, message: 'Curso creado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/cursos-list', async (req, res) => {
    try {
        const { data: courses, error: coursesError } = await supabaseAdmin
            .from('Courses')
            .select('*');
        if (coursesError) throw coursesError;

        const { data: enrollments, error: enrollError } = await supabaseAdmin
            .from('Enrollments')
            .select('CourseID');
        if (enrollError) throw enrollError;

        const { data: profiles, error: profError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name');
        if (profError) throw profError;

        const cursosConConteo = courses.map(curso => {
            const studentCount = enrollments.filter(e => e.CourseID === curso.CourseID).length;
            const tutor = profiles.find(p => p.ID === curso.TutorID);
            
            return { 
                ...curso, 
                studentCount,
                tutorName: tutor ? tutor.Name : 'Sin asignar'
            };
        });

        res.status(200).json({ success: true, cursos: cursosConConteo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/enroll-students', async (req, res) => {
    const { courseId, studentIds } = req.body;

    try {
        if (studentIds && studentIds.length > 0) {
            const enrollments = studentIds.map(studentId => ({
                CourseID: courseId,
                StudentID: studentId
            }));

            const { error: enrollError } = await supabaseAdmin
                .from('Enrollments')
                .insert(enrollments);

            if (enrollError) throw enrollError;
        }

        res.status(200).json({ success: true, message: 'Alumnos añadidos exitosamente al curso.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/curso-alumnos/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data: enrollments, error: enrError } = await supabaseAdmin
            .from('Enrollments')
            .select('StudentID')
            .eq('CourseID', courseId);
        if (enrError) throw enrError;

        const { data: profiles, error: profError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name');
        if (profError) throw profError;

        const alumnos = enrollments.map(item => {
            const profile = profiles.find(p => p.ID === item.StudentID);
            return {
                ID: item.StudentID,
                Name: profile ? profile.Name : 'Desconocido'
            };
        });

        res.status(200).json({ success: true, alumnos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/tutor-cursos/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('Courses')
            .select('*')
            .eq('TutorID', tutorId);

        if (error) throw error;
        res.status(200).json({ success: true, cursos: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/revisor-tutores/:reviewerId', async (req, res) => {
    const { reviewerId } = req.params;
    try {
        const { data: enrollments, error: enrError } = await supabaseAdmin
            .from('Enrollments_Reviewers')
            .select('TutorID')
            .eq('ReviewerID', reviewerId);
        if (enrError) throw enrError;

        const { data: profiles, error: profError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name')
            .eq('Rol', 'Tutor');
        if (profError) throw profError;

        const tutores = enrollments.map(e => {
            const profile = profiles.find(p => p.ID === e.TutorID);
            return {
                ID: e.TutorID,
                Name: profile ? profile.Name : 'Desconocido'
            };
        });

        res.status(200).json({ success: true, tutores });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/tutores-sin-revisor', async (req, res) => {
    try {
        const { data: tutores, error: tutError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name')
            .eq('Rol', 'Tutor')
            .eq('State', 'Active');
        if (tutError) throw tutError;

        const { data: asignados, error: asigError } = await supabaseAdmin
            .from('Enrollments_Reviewers')
            .select('TutorID');
        if (asigError) throw asigError;

        const asignadosIds = asignados.map(a => a.TutorID);
        const disponibles = tutores.filter(t => !asignadosIds.includes(t.ID));

        res.status(200).json({ success: true, tutores: disponibles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/asignar-tutores-revisor', async (req, res) => {
    const { reviewerId, tutorIds } = req.body;
    try {
        if (tutorIds && tutorIds.length > 0) {
            const inserts = tutorIds.map(tId => ({
                ReviewerID: reviewerId,
                TutorID: tId
            }));

            const { error: insertError } = await supabaseAdmin
                .from('Enrollments_Reviewers')
                .insert(inserts);
            if (insertError) throw insertError;

            const { data: revData, error: fetchError } = await supabaseAdmin
                .from('Reviewer')
                .select('AsignedTutors')
                .eq('ID', reviewerId)
                .single();
            
            if (!fetchError && revData) {
                await supabaseAdmin
                    .from('Reviewer')
                    .update({ AsignedTutors: (revData.AsignedTutors || 0) + tutorIds.length })
                    .eq('ID', reviewerId);
            }
        }
        res.status(200).json({ success: true, message: 'Tutores asignados correctamente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- RUTA MODIFICADA ---
router.get('/estudiantes-list', async (req, res) => {
    try {
        const { data: students, error: studErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name, Email, State, BirthDate, Students (Phone, Language, CurrentLevel, Notes, DateJoined)')
            .eq('Rol', 'Student');
        if (studErr) throw studErr;

        const { data: enrollments, error: enrErr } = await supabaseAdmin
            .from('Enrollments')
            .select('StudentID, CourseID');
        if (enrErr) throw enrErr;

        const { data: courses, error: courErr } = await supabaseAdmin
            .from('Courses')
            .select('*');
        if (courErr) throw courErr;

        const { data: profiles } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name');

        const estudiantesCompletos = students.map(st => {
            const studentEnrollments = enrollments.filter(e => e.StudentID === st.ID);
            let cursoData = null;
            let tutorName = 'Sin asignar';
            
            if (studentEnrollments.length > 0) {
                // Buscamos primero si tiene un curso activo o próximo
                let activeEnrollment = studentEnrollments.find(e => {
                    const c = courses.find(course => course.CourseID === e.CourseID);
                    return c && c.Status !== 'Past';
                });
                
                // Si no tiene cursos activos, entonces tomamos su último curso del historial
                if (!activeEnrollment) {
                    activeEnrollment = studentEnrollments[studentEnrollments.length - 1];
                }

                const curso = courses.find(c => c.CourseID === activeEnrollment.CourseID);
                if (curso) {
                    const tutor = profiles?.find(p => p.ID === curso.TutorID);
                    cursoData = { ...curso, tutorName: tutor ? tutor.Name : 'Sin asignar' };
                    tutorName = cursoData.tutorName;
                }
            }
            return { ...st, cursoData, tutorAsignado: tutorName };
        });

        res.status(200).json(estudiantesCompletos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/dashboard-summary', async (req, res) => {
    try {
        const { count: countEstudiantes } = await supabaseAdmin
            .from('UsersProfiles')
            .select('*', { count: 'exact', head: true })
            .eq('Rol', 'Student')
            .eq('State', 'Active');
            
        const { count: countTutores } = await supabaseAdmin
            .from('UsersProfiles')
            .select('*', { count: 'exact', head: true })
            .eq('Rol', 'Tutor')
            .eq('State', 'Active');
            
        const { count: countCursos } = await supabaseAdmin
            .from('Courses')
            .select('*', { count: 'exact', head: true })
            .eq('Status', 'Active');
        
        res.status(200).json({
            success: true,
            stats: [
                { title: "Estudiantes Activos", amount: countEstudiantes || 0 },
                { title: "Tutores Activos", amount: countTutores || 0 },
                { title: "Cursos Activos", amount: countCursos || 0 }
            ]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

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

router.get('/todas-bitacoras', async (req, res) => {
    try {
        const { data: sesiones, error: sesErr } = await supabaseAdmin
            .from('Session')
            .select(`
                *, 
                Courses ( Name ),
                SessionStudents (
                    StudentID, Attendance, IncidentReport, UsersProfiles ( Name )
                )
            `)
            .eq('Status', 'Completed') 
            .order('Date', { ascending: false });

        if (sesErr) throw sesErr;

        if (!sesiones || sesiones.length === 0) {
            return res.status(200).json({ success: true, bitacoras: [] });
        }

        const tutorIds = [...new Set(sesiones.map(s => s.TutorID).filter(Boolean))];
        const reviewerIds = [...new Set(sesiones.map(s => s.ReviewerID).filter(Boolean))];
        const allUserIds = [...new Set([...tutorIds, ...reviewerIds])];

        const { data: perfiles, error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name')
            .in('ID', allUserIds);

        if (profErr) throw profErr;

        const formateadas = sesiones.map(s => {
            const tutor = perfiles.find(p => p.ID === s.TutorID);
            const revisor = perfiles.find(p => p.ID === s.ReviewerID);
            return {
                id: s.SessionID,
                tutor: tutor ? tutor.Name : 'Desconocido',
                tutorId: s.TutorID,
                revisorName: revisor ? revisor.Name : 'Sin asignar',
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

router.get('/cursos-pendientes-cierre', async (req, res) => {
    try {
        const { data: cursos, error: cursosErr } = await supabaseAdmin
            .from('Courses')
            .select('*')
            .eq('GradingStatus', 'Pending_Admin_Approval');

        if (cursosErr) throw cursosErr;
        if (!cursos || cursos.length === 0) return res.status(200).json({ success: true, cursos: [] });

        const cursosConAlumnos = await Promise.all(cursos.map(async (curso) => {
            const { data: tutorProfile } = await supabaseAdmin.from('UsersProfiles').select('Name').eq('ID', curso.TutorID).single();

            const { data: enrollments } = await supabaseAdmin
                .from('Enrollments')
                .select('StudentID, FinalGrade, FinalTutorComments')
                .eq('CourseID', curso.CourseID);

            if (!enrollments || enrollments.length === 0) return { ...curso, tutorName: tutorProfile?.Name, alumnos: [] };

            const studentIds = enrollments.map(e => e.StudentID);
            const { data: profiles } = await supabaseAdmin.from('UsersProfiles').select('ID, Name').in('ID', studentIds);
            const { data: studentsData } = await supabaseAdmin.from('Students').select('ID, CurrentLevel').in('ID', studentIds);

            const alumnos = enrollments.map(enr => {
                const prof = profiles.find(p => p.ID === enr.StudentID);
                const stu = studentsData.find(s => s.ID === enr.StudentID);
                return {
                    StudentID: enr.StudentID,
                    Name: prof?.Name || 'Desconocido',
                    CurrentLevel: stu?.CurrentLevel || 'N/A',
                    FinalGrade: enr.FinalGrade,
                    FinalTutorComments: enr.FinalTutorComments
                };
            });
            return { ...curso, tutorName: tutorProfile?.Name || 'Sin asignar', alumnos };
        }));

        res.status(200).json({ success: true, cursos: cursosConAlumnos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/cerrar-curso', async (req, res) => {
    const { courseId } = req.body;
    try {
        const { data: curso } = await supabaseAdmin.from('Courses').select('Level, Name, TutorID').eq('CourseID', courseId).single();
        const nivelImpartido = curso.Level;

        const { data: enrollments } = await supabaseAdmin
            .from('Enrollments')
            .select('StudentID, FinalGrade')
            .eq('CourseID', courseId);

        let notificaciones = [];

        for (let enr of enrollments) {
            if (enr.FinalGrade >= 70) {
                const niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
                const indiceActual = niveles.indexOf(nivelImpartido);
                
                let nuevoNivel = nivelImpartido;
                let mensajeNotificacion = '';

                if (indiceActual !== -1 && indiceActual < niveles.length - 1) {
                    nuevoNivel = niveles[indiceActual + 1];
                    mensajeNotificacion = `Has aprobado el curso "${curso.Name}" con una calificación de ${enr.FinalGrade}. Tu nuevo nivel ahora es ${nuevoNivel}.`;
                } 
                else if (nivelImpartido === 'C2' || indiceActual === niveles.length - 1) {
                    nuevoNivel = 'C2';
                    mensajeNotificacion = `Has aprobado el curso "${curso.Name}" con una calificación de ${enr.FinalGrade}. ¡Felicidades por dominar y mantener el nivel máximo C2!`;
                }

                await supabaseAdmin.from('Students').update({ CurrentLevel: nuevoNivel }).eq('ID', enr.StudentID);

                notificaciones.push({
                    ReceiverID: enr.StudentID, SenderID: curso.TutorID, Type: 'AlertaAdmin', Title: '¡Felicidades, has aprobado!',
                    Message: mensajeNotificacion, RelatedEntityID: courseId
                });
            } else {
                notificaciones.push({
                    ReceiverID: enr.StudentID, SenderID: curso.TutorID, Type: 'AlertaAdmin', Title: 'Fin del Curso',
                    Message: `El curso "${curso.Name}" ha concluido. Tu calificación fue ${enr.FinalGrade}, por lo que necesitas seguir practicando para poder avanzar de nivel.`, RelatedEntityID: courseId
                });
            }
        }

        await supabaseAdmin
            .from('Courses')
            .update({ 
                Status: 'Past', 
                GradingStatus: 'Finished' 
            })
            .eq('CourseID', courseId);

        notificaciones.push({
            ReceiverID: curso.TutorID, SenderID: curso.TutorID, Type: 'AlertaAdmin', Title: 'Curso Cerrado Exitosamente',
            Message: `El administrador ha revisado y cerrado oficialmente tu curso "${curso.Name}".`, RelatedEntityID: courseId
        });

        if (notificaciones.length > 0) {
            await supabaseAdmin.from('Notifications').insert(notificaciones);
        }

        res.status(200).json({ success: true, message: 'Curso cerrado y niveles actualizados.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/historial-cursos-cerrados', async (req, res) => {
    try {
        const { data: cursos, error: cursosErr } = await supabaseAdmin
            .from('Courses')
            .select('*')
            .eq('GradingStatus', 'Finished');

        if (cursosErr) throw cursosErr;
        if (!cursos || cursos.length === 0) return res.status(200).json({ success: true, cursos: [] });

        const cursosConAlumnos = await Promise.all(cursos.map(async (curso) => {
            const { data: tutorProfile } = await supabaseAdmin.from('UsersProfiles').select('Name').eq('ID', curso.TutorID).single();

            const { data: enrollments } = await supabaseAdmin
                .from('Enrollments')
                .select('StudentID, FinalGrade, FinalTutorComments')
                .eq('CourseID', curso.CourseID);

            if (!enrollments || enrollments.length === 0) return { ...curso, tutorName: tutorProfile?.Name, alumnos: [] };

            const studentIds = enrollments.map(e => e.StudentID);
            const { data: profiles } = await supabaseAdmin.from('UsersProfiles').select('ID, Name').in('ID', studentIds);
            const { data: studentsData } = await supabaseAdmin.from('Students').select('ID, CurrentLevel').in('ID', studentIds);

            const alumnos = enrollments.map(enr => {
                const prof = profiles.find(p => p.ID === enr.StudentID);
                const stu = studentsData.find(s => s.ID === enr.StudentID);
                return {
                    StudentID: enr.StudentID,
                    Name: prof?.Name || 'Desconocido',
                    CurrentLevel: stu?.CurrentLevel || 'N/A',
                    FinalGrade: enr.FinalGrade,
                    FinalTutorComments: enr.FinalTutorComments
                };
            });
            return { ...curso, tutorName: tutorProfile?.Name || 'Sin asignar', alumnos };
        }));

        res.status(200).json({ success: true, cursos: cursosConAlumnos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/rechazar-evaluacion', async (req, res) => {
    const { courseId, adminComments } = req.body;
    try {
        const { error } = await supabaseAdmin
            .from('Courses')
            .update({ GradingStatus: 'Pending_Grades', AdminComments: adminComments })
            .eq('CourseID', courseId);
            
        if (error) throw error;

        const { data: curso } = await supabaseAdmin.from('Courses').select('TutorID, Name').eq('CourseID', courseId).single();
        if (curso && curso.TutorID) {
            await supabaseAdmin.from('Notifications').insert([{
                ReceiverID: curso.TutorID, Type: 'AlertaAdmin', Title: 'Evaluación Rechazada',
                Message: `El administrador devolvió la evaluación de "${curso.Name}" con correcciones necesarias.`, RelatedEntityID: courseId
            }]);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const cron = require('node-cron');


router.post('/eventos', async (req, res) => {
    const { AdminID, Title, Date, Time, Description } = req.body; 
    try {
        const { error } = await supabaseAdmin
            .from('AdminEvents')
            .insert([{ AdminID, Title, Date, Time, Description }]);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Evento agendado con éxito.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/eventos/:adminId', async (req, res) => {
    const { adminId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('AdminEvents')
            .select('*')
            .eq('AdminID', adminId)
            .order('Time', { ascending: true });

        if (error) throw error;
        res.status(200).json({ success: true, eventos: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/eventos/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { Title, Date, Time, Description } = req.body;
    try {
        const { error } = await supabaseAdmin
            .from('AdminEvents')
            .update({ Title, Date, Time, Description })
            .eq('EventID', eventId);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Evento actualizado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/eventos/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('AdminEvents')
            .delete()
            .eq('EventID', eventId);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Evento eliminado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

cron.schedule('* * * * *', async () => {
    try {
        const tzOptions = { timeZone: 'America/Mexico_City' };
        const now = new Date();
        
        const currentDate = now.toLocaleDateString('sv-SE', tzOptions); 
        
        const currentHourMin = now.toLocaleTimeString('es-MX', { 
            ...tzOptions, hour: '2-digit', minute: '2-digit', hour12: false 
        }).substring(0, 5);

        const inOneHour = new Date(now.getTime() + 60 * 60000);
        const inOneHourMin = inOneHour.toLocaleTimeString('es-MX', { 
            ...tzOptions, hour: '2-digit', minute: '2-digit', hour12: false 
        }).substring(0, 5);

        const { data: eventosHoy } = await supabaseAdmin
            .from('AdminEvents')
            .select('*')
            .eq('Date', currentDate);

        if (!eventosHoy || eventosHoy.length === 0) return;

        let notificacionesAInsertar = [];

        eventosHoy.forEach(evento => {
            if (!evento.Time) return;
            const eventTime = evento.Time.substring(0, 5); 

            if (eventTime === inOneHourMin) {
                notificacionesAInsertar.push({
                    ReceiverID: evento.AdminID,
                    SenderID: evento.AdminID,
                    Type: 'SessionAgendada',
                    Title: 'Evento próximo (1 hora)',
                    Message: `Tu evento "${evento.Title}" está programado para las ${eventTime}.`,
                    RelatedEntityID: evento.EventID
                });
            }
            
            if (eventTime === currentHourMin) {
                notificacionesAInsertar.push({
                    ReceiverID: evento.AdminID,
                    SenderID: evento.AdminID,
                    Type: 'AlertaAdmin',
                    Title: '¡Es hora de tu evento!',
                    Message: `Tu evento "${evento.Title}" está comenzando ahora.`,
                    RelatedEntityID: evento.EventID
                });
            }
        });

        if (notificacionesAInsertar.length > 0) {
            await supabaseAdmin.from('Notifications').insert(notificacionesAInsertar);
        }

    } catch (error) {
        console.error("Error en el Cron Job de eventos:", error.message);
    }
});
module.exports = router;