const cron = require('node-cron');
const { supabaseAdmin } = require('./config/supabase');
const nodemailer = require('nodemailer');
const { sendSSEEvent } = require('./routes/sse.routes'); // función para enviar eventos SSE a usuarios conectados

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

                const fechaExpiracion = new Date(fechaCreacion);
                fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 5);

                const diferenciaMs = fechaExpiracion.getTime() - ahora.getTime();
                const minutosRestantes = Math.floor(diferenciaMs / 60000);

                if (minutosRestantes <= 0) {
                    // Avisar al usuario via SSE antes de eliminar (si está conectado)
                    sendSSEEvent(usuario.ID, 'logout', { reason: 'account_expired' });
                    // Pequeña pausa para que el evento llegue antes de que la conexión muera
                    await new Promise(resolve => setTimeout(resolve, 300));

                    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(usuario.ID);


                    if (!deleteError) {
                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: usuario.Email,
                            subject: 'Cuenta eliminada permanentemente',
                            html: '<p>Tu cuenta ha cumplido 5 años en el sistema y ha sido eliminada por políticas de retención de datos.</p>'
                        });
                        console.log(`[CRON] Cuenta eliminada definitivamente: ${usuario.Email}`);
                    }
                    continue;
                }

                let enviarNotificacion = false;
                let mensajeTiempo = '';

                if (minutosRestantes <= 60) {
                    enviarNotificacion = true;
                    mensajeTiempo = `${minutosRestantes} minuto(s)`;
                } else if (minutosRestantes <= 1440) {
                    if (minutosRestantes % 60 === 0) {
                        enviarNotificacion = true;
                        mensajeTiempo = `${minutosRestantes / 60} hora(s)`;
                    }
                } else if (minutosRestantes <= 43200) {
                    if (minutosRestantes % 1440 === 0) {
                        enviarNotificacion = true;
                        mensajeTiempo = `${minutosRestantes / 1440} día(s)`;
                    }
                } else if (minutosRestantes <= 525600) {
                    if (minutosRestantes % 43200 === 0) {
                        enviarNotificacion = true;
                        mensajeTiempo = `${minutosRestantes / 43200} mes(es)`;
                    }
                }

                if (enviarNotificacion) {
                    const { error: notifError } = await supabaseAdmin.from('Notifications').insert([{
                        ReceiverID: usuario.ID,
                        Type: 'AlertaAdmin',
                        Title: 'Aviso de expiración de cuenta',
                        Message: `Tu cuenta cumplirá 5 años de antigüedad y se eliminará en ${mensajeTiempo}.`,
                        IsRead: false
                    }]);

                    if (!notifError) {
                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: usuario.Email,
                            subject: `Aviso: Tu cuenta expira en ${mensajeTiempo}`,
                            html: `<p>Tu cuenta está por cumplir el límite de 5 años. Se eliminará automáticamente en ${mensajeTiempo}.</p>`
                        });
                        console.log(`[CRON] Aviso de ${mensajeTiempo} enviado a: ${usuario.Email}`);
                    }
                }
            }
        } catch (err) {
            console.error('[CRON] Error:', err.message);
        }
    });
};

module.exports = startAccountCleaner;