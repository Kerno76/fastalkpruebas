const cron = require('node-cron');
const { supabaseAdmin } = require('./config/supabase');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const startCourseMonitor = () => {
    cron.schedule('*/2 * * * *', async () => {
        try {
            const ahora = new Date();

            const { data: cursos, error } = await supabaseAdmin
                .from('Courses')
                .select('CourseID, Name, StartDate, EndDate, TutorID, Status, GradingStatus');

            if (error || !cursos) return;

            for (const curso of cursos) {
                if (!curso.StartDate || !curso.EndDate) continue;

                const start = new Date(curso.StartDate);
                const end = new Date(curso.EndDate);

                let statusReal = 'Active';
                if (ahora < start) statusReal = 'Upcoming';
                else if (ahora > end) statusReal = 'Past';

                if (curso.Status !== statusReal && curso.Status !== 'Canceled') {
                    await supabaseAdmin.from('Courses').update({ Status: statusReal }).eq('CourseID', curso.CourseID);
                }

                if (curso.GradingStatus === 'Active' && curso.TutorID && statusReal !== 'Canceled') {
                    
                    const { data: tutor } = await supabaseAdmin.from('UsersProfiles').select('Email, Name').eq('ID', curso.TutorID).single();
                    if (!tutor) continue;

                    if (statusReal === 'Past') {
                        await supabaseAdmin.from('Courses').update({ GradingStatus: 'Pending_Grades' }).eq('CourseID', curso.CourseID);

                        const titulo = 'Tu curso ha finalizado - Requiere Cierre';
                        const mensaje = `El curso "${curso.Name}" ha concluido su tiempo estimado. Por favor, ingresa las calificaciones y comentarios finales de tus alumnos para poder cerrar el curso.`;

                        await supabaseAdmin.from('Notifications').insert([{
                            ReceiverID: curso.TutorID, Type: 'AlertaAdmin', Title: titulo, Message: mensaje, IsRead: false, RelatedEntityID: curso.CourseID
                        }]);

                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: tutor.Email, subject: titulo,
                            html: `<p>Hola ${tutor.Name},</p><p>${mensaje}</p><p>Accede a tu panel de FasTalk para realizar la evaluación final.</p>`
                        });

                        console.log(`[CRON] Notificación FINAL enviada al tutor del curso ${curso.CourseID}`);
                    } 
                    
                    else if (statusReal === 'Active') {
                        const duracionTotalMs = end.getTime() - start.getTime();
                        const tiempoRestanteMs = end.getTime() - ahora.getTime();
                        
                        const duracionHoras = duracionTotalMs / (1000 * 60 * 60);
                        const horasRestantes = tiempoRestanteMs / (1000 * 60 * 60);

                        let debeAlertar = false;

                        if (duracionHoras > 720) { 
                            if (horasRestantes <= 72 && horasRestantes > 0) debeAlertar = true; 
                        } else if (duracionHoras > 168) { 
                            if (horasRestantes <= 24 && horasRestantes > 0) debeAlertar = true; 
                        } else { 
                            if (horasRestantes <= (duracionHoras / 2) && horasRestantes > 0) debeAlertar = true; 
                        }

                        if (debeAlertar) {
                            const tituloAdvertencia = 'Tu curso está por terminar';
                            const { data: alertasPrevias } = await supabaseAdmin
                                .from('Notifications')
                                .select('NotificationID')
                                .eq('RelatedEntityID', curso.CourseID)
                                .eq('Title', tituloAdvertencia);

                            if (!alertasPrevias || alertasPrevias.length === 0) {
                                const mensaje = `El curso "${curso.Name}" está próximo a finalizar. Ve preparando las calificaciones y comentarios finales de tus alumnos.`;

                                // Guardamos la notificación en BD (esto servirá como bandera para no volverla a enviar)
                                await supabaseAdmin.from('Notifications').insert([{
                                    ReceiverID: curso.TutorID, Type: 'AlertaAdmin', Title: tituloAdvertencia, Message: mensaje, IsRead: false, RelatedEntityID: curso.CourseID
                                }]);

                                await transporter.sendMail({
                                    from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                                    to: tutor.Email, subject: tituloAdvertencia,
                                    html: `<p>Hola ${tutor.Name},</p><p>${mensaje}</p>`
                                });

                                console.log(`[CRON] Advertencia PREVIA enviada al tutor del curso ${curso.CourseID}`);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[CRON CURSOS] Error:', err.message);
        }
    }, { recoverMissedExecutions: false });
};

module.exports = startCourseMonitor;