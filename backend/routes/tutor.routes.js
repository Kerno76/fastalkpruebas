const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

router.get('/dashboard/:tutorId', async (req, res) => {
    const { tutorId } = req.params;

    try {
        const { data: profile, error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('Name')
            .eq('ID', tutorId)
            .single();
        if (profErr) throw profErr;

        const { data: tutorInfo, error: tutErr } = await supabaseAdmin
            .from('Tutors')
            .select('TotalHours')
            .eq('ID', tutorId)
            .single();
        const totalHours = tutorInfo?.TotalHours || 0;

        const { data: courses, error: courErr } = await supabaseAdmin
            .from('Courses')
            .select('CourseID, Level')
            .eq('TutorID', tutorId);
        if (courErr) throw courErr;

        let totalEstudiantes = 0;
        let niveles = new Set(); 

        if (courses && courses.length > 0) {
            courses.forEach(c => {
                if (c.Level) niveles.add(c.Level);
            });

            const courseIds = courses.map(c => c.CourseID);

            const { data: enrollments, error: enrErr } = await supabaseAdmin
                .from('Enrollments')
                .select('StudentID')
                .in('CourseID', courseIds);
            
            if (enrErr) throw enrErr;

            totalEstudiantes = enrollments ? enrollments.length : 0;
        }

        res.status(200).json({
            success: true,
            data: {
                name: profile.Name,
                totalHours: totalHours,
                totalStudents: totalEstudiantes,
                nivelesAsignados: Array.from(niveles).join(' y ') || 'Ninguno'
            }
        });

    } catch (error) {
        console.error("Error al cargar dashboard de tutor:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/mis-estudiantes/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: courses, error: courErr } = await supabaseAdmin
            .from('Courses')
            .select('CourseID, Name, Language, Level')
            .eq('TutorID', tutorId);
        if (courErr) throw courErr;

        if (!courses || courses.length === 0) {
            return res.status(200).json({ success: true, estudiantes: [] });
        }

        const courseIds = courses.map(c => c.CourseID);

        const { data: enrollments, error: enrErr } = await supabaseAdmin
            .from('Enrollments')
            .select('StudentID, CourseID')
            .in('CourseID', courseIds);
        if (enrErr) throw enrErr;

        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({ success: true, estudiantes: [] });
        }

        const studentIds = enrollments.map(e => e.StudentID);

        const { data: profiles, error: profErr } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Name, Email')
            .in('ID', studentIds);
        if (profErr) throw profErr;

        const estudiantes = profiles.map(profile => {
            const studentEnrollments = enrollments.filter(e => e.StudentID === profile.ID);
            const primaryCourse = courses.find(c => c.CourseID === studentEnrollments[0].CourseID);

            return {
                id: profile.ID,
                name: profile.Name,
                email: profile.Email,
                courseName: primaryCourse ? primaryCourse.Name : 'N/A',
                language: primaryCourse ? primaryCourse.Language : 'N/A',
                level: primaryCourse ? primaryCourse.Level : 'N/A',
                horasTotales: '0 hrs',
                ultimaSesion: 'Sin registro'
            };
        });

        res.status(200).json({ success: true, estudiantes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;