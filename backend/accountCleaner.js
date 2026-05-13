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

const startAccountCleaner = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const ahora = new Date();

            const { data: usuarios, error } = await supabaseAdmin
                .from('UsersProfiles')
                .select('ID, Email, CreatedAt')
                .neq('Rol', 'Admin');

            if (error || !usuarios) return;

            for (const usuario of usuarios) {
                const fechaCreacion = new Date(usuario.CreatedAt);
                const diferenciaMs = ahora.getTime() - fechaCreacion.getTime();
                const minutosTranscurridos = Math.floor(diferenciaMs / 60000);

                if (minutosTranscurridos > 10) continue;

                const minutosRestantes = 2628000 - minutosTranscurridos;

                if (minutosRestantes > 0 && minutosRestantes < 5) {
                    const { error: notifError } = await supabaseAdmin.from('Notifications').insert([{
                        ReceiverID: usuario.ID, 
                        Type: 'AlertaAdmin', 
                        Title: 'Aviso de prueba',
                        Message: `Tu cuenta se eliminará en ${minutosRestantes} minuto(s).`,
                        IsRead: false
                    }]);

                    if (!notifError) {
                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: usuario.Email,
                            subject: `Aviso de prueba: ${minutosRestantes} minuto(s) restante(s)`,
                            html: `<p>Tu cuenta se eliminará en ${minutosRestantes} minuto(s).</p>`
                        });
                        console.log(`Notificación y correo enviados a: ${usuario.Email}`);
                    }
                
                } else if (minutosRestantes === 0) {
                    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(usuario.ID);

                    if (!deleteError) {
                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: usuario.Email,
                            subject: 'Cuenta eliminada',
                            html: '<p>El tiempo de prueba finalizó y tu cuenta fue eliminada del sistema.</p>'
                        });
                        console.log(`Cuenta eliminada definitivamente: ${usuario.Email}`);
                    }
                }
            }
        } catch (err) {
            console.error(err.message);
        }
    });
};

module.exports = startAccountCleaner;