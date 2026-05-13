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
    // Se ejecuta TODOS LOS DÍAS a las 2:00 AM ('0 2 * * *')
    cron.schedule('0 2 * * *', async () => {
        try {
            const ahora = new Date();

            const { data: usuarios, error } = await supabaseAdmin
                .from('UsersProfiles')
                .select('ID, Email, CreatedAt')
                .neq('Rol', 'Admin');

            if (error || !usuarios) return;

            for (const usuario of usuarios) {
                const fechaCreacion = new Date(usuario.CreatedAt);
                
                // 1. Calculamos la fecha exacta en la que cumple 5 años
                const fechaExpiracion = new Date(fechaCreacion);
                fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 5);

                // 2. Calculamos la diferencia en milisegundos y la convertimos a DÍAS
                const diferenciaMs = fechaExpiracion.getTime() - ahora.getTime();
                const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

                // 3. Avisamos diariamente cuando falten 5 días o menos
                if (diasRestantes > 0 && diasRestantes <= 5) {
                    const { error: notifError } = await supabaseAdmin.from('Notifications').insert([{
                        ReceiverID: usuario.ID, 
                        Type: 'AlertaAdmin', 
                        Title: 'Aviso de expiración de cuenta',
                        Message: `Tu cuenta cumplirá 5 años en el sistema y se eliminará en ${diasRestantes} día(s).`,
                        IsRead: false
                    }]);

                    if (!notifError) {
                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: usuario.Email,
                            subject: `Aviso: Tu cuenta expira en ${diasRestantes} día(s)`,
                            html: `<p>Tu cuenta cumplirá el límite de 5 años y se eliminará automáticamente en ${diasRestantes} día(s).</p>`
                        });
                        console.log(`[CRON] Aviso de ${diasRestantes} días enviado a: ${usuario.Email}`);
                    }
                
                // 4. Si ya pasaron los 5 años (0 días restantes)
                } else if (diasRestantes <= 0) {
                    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(usuario.ID);

                    if (!deleteError) {
                        await transporter.sendMail({
                            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
                            to: usuario.Email,
                            subject: 'Cuenta eliminada permanentemente',
                            html: '<p>Tu cuenta ha cumplido 5 años en el sistema y ha sido eliminada por políticas de retención de datos.</p>'
                        });
                        console.log(`[CRON] Cuenta de 5 años eliminada definitivamente: ${usuario.Email}`);
                    }
                }
            }
        } catch (err) {
            console.error('[CRON] Error:', err.message);
        }
    });
};

module.exports = startAccountCleaner;