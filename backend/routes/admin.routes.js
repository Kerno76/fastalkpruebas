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
    const { nombre, email, rol, hobbies, language, Phone, career, BirthDate, CurrentLevel, assignedTutors, notes } = req.body; 
    
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

        if (rol === 'Tutor') {
            const { error: tutorError } = await supabaseAdmin
                .from('Tutors')
                .insert([{
                    ID: userId,
                    Phone: Phone,
                    Language: language,
                    Hobbies: hobbies,
                    Career: career 
                }]);
            if (tutorError) throw tutorError;
        } else if (rol === 'Student') {
            const { error: studentError } = await supabaseAdmin
                .from('Students')
                .insert([{ 
                    ID: userId, 
                    Phone: Phone,
                    Language: language,
                    CurrentLevel: CurrentLevel
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
                    Notes: notes
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
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/tutores', async (req, res) => {
    try {
        const { data: tutores, error } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`
                ID, Name, Email, Rol, State, BirthDate,
                Tutors ( Phone, Language, Hobbies, Career, TotalHours ) 
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
        console.error("Error al obtener tutores:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/estudiantes', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`
                ID, Name, Email, Rol, State, BirthDate,
                Students ( Phone, Language, CurrentLevel ) 
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
                Reviewer ( Phone, Career, AsignedTutors, ValidationsCompleted ) 
            `) 
            .eq('Rol', 'Reviewer');

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al jalar revisores:", error.message);
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
        console.error("Error al cambiar estado:", error.message);
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
        console.error("Error al asignar revisor:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/estudiantes-disponibles', async (req, res) => {
    try {
        const { data: estudiantes, error: estError } = await supabaseAdmin
            .from('UsersProfiles')
            .select(`
                ID, Name,
                Students ( Language, CurrentLevel )
            `)
            .eq('Rol', 'Student');

        if (estError) throw estError;

        const { data: enrollments, error: enrError } = await supabaseAdmin
            .from('Enrollments')
            .select('StudentID');

        if (enrError) throw enrError;

        const enrolledIds = enrollments.map(e => e.StudentID);
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
        console.error("Error al obtener estudiantes:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/cursos', async (req, res) => {
    const { Name, Language, Level, Period, TutorID, StartDate, EndDate, StudentIDs } = req.body;

    try {
        const { data: nuevoCurso, error: cursoError } = await supabaseAdmin
            .from('Courses')
            .insert([{ Name, Language, Level, Period, TutorID: TutorID || null, StartDate, EndDate, Status: 'Active' }])
            .select()
            .single();

        if (cursoError) throw cursoError;

        if (StudentIDs && StudentIDs.length > 0) {
            const enrollments = StudentIDs.map(studentId => ({
                CourseID: nuevoCurso.CourseID,
                StudentID: studentId
            }));

            const { error: enrollError } = await supabaseAdmin
                .from('Enrollments')
                .insert(enrollments);

            if (enrollError) throw enrollError;
        }

        res.status(200).json({ success: true, message: 'Curso creado y alumnos enrolados.' });
    } catch (error) {
        console.error("Error al crear curso:", error.message);
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
        console.error("Error en cursos-list:", error.message);
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
        console.error("Error al enrolar alumnos extras:", error.message);
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
        console.error("Error en curso-alumnos:", error.message);
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

router.get('/estudiantes-list', async (req, res) => {
    try {
        const { data: students, error: studErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name, Email, State, BirthDate, Students (Phone, Language, CurrentLevel)')
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
            const enrollment = enrollments.find(e => e.StudentID === st.ID);
            let cursoData = null;
            let tutorName = 'Sin asignar';
            
            if (enrollment) {
                const curso = courses.find(c => c.CourseID === enrollment.CourseID);
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
        console.error("Error en estudiantes-list:", error.message);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;