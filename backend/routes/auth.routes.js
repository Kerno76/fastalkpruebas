const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            return res.status(401).json({ success: false, message: "Correo o contraseña incorrectos" });
        }

        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('*')
            .ilike('Email', email)
            .maybeSingle();

        if (profileError || !profileData) {
            return res.status(404).json({ success: false, message: "Perfil no encontrado en la base de datos" });
        }

        let phone = "";
        let roleTable = "";
        if (profileData.Rol === 'Admin') roleTable = 'Admin';
        else if (profileData.Rol === 'Tutor') roleTable = 'Tutors';
        else if (profileData.Rol === 'Student') roleTable = 'Students';
        else if (profileData.Rol === 'Reviewer') roleTable = 'Reviewer';

        if (roleTable) {
            const { data: roleData } = await supabaseAdmin
                .from(roleTable)
                .select('Phone')
                .eq('ID', profileData.ID)
                .maybeSingle();
                
            if (roleData && roleData.Phone) {
                phone = roleData.Phone;
            }
        }

        const completeUser = { ...profileData, Phone: phone };
        res.json({ success: true, message: "¡Sesión iniciada!", user: completeUser });

    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

router.put('/update-profile', async (req, res) => {
    const { id, rol, name, phone } = req.body;

    try {
        await supabaseAdmin
            .from('UsersProfiles')
            .update({ Name: name })
            .eq('ID', id);

        let roleTable = "";
        if (rol === 'Admin') roleTable = 'Admin';
        else if (rol === 'Tutor') roleTable = 'Tutors';
        else if (rol === 'Student') roleTable = 'Students';
        else if (rol === 'Reviewer') roleTable = 'Reviewer';

        if (roleTable) {
            await supabaseAdmin
                .from(roleTable)
                .update({ Phone: phone })
                .eq('ID', id);
        }

        res.json({ success: true, message: "Perfil actualizado correctamente" });
    } catch (error) {
        console.error("Error actualizando perfil:", error);
        res.status(500).json({ success: false, message: "Error al actualizar perfil" });
    }
});

router.post('/upload-avatar', async (req, res) => {
    const { id, base64Image } = req.body;

    try {
        const mimeType = base64Image.substring(base64Image.indexOf(":")+1, base64Image.indexOf(";"));
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        const extension = mimeType.split('/')[1] || 'jpg';
        const filename = `avatar_${id}_${Date.now()}.${extension}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(filename, buffer, { 
                contentType: mimeType, 
                upsert: true 
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(filename);

        const publicUrl = publicUrlData.publicUrl;

        await supabaseAdmin
            .from('UsersProfiles')
            .update({ AvatarUrl: publicUrl })
            .eq('ID', id);

        res.json({ success: true, message: "Foto actualizada", url: publicUrl });
    } catch (error) {
        console.error("Error subiendo avatar:", error);
        res.status(500).json({ success: false, message: "Error al subir la foto" });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const { data: userExist, error: searchError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID, Email')
            .ilike('Email', email)
            .maybeSingle();

        if (searchError) throw searchError;

        if (!userExist) {
            return res.status(404).json({ 
                success: false, 
                message: "Este correo no está registrado en FasTalk. Verifica que esté bien escrito." 
            });
        }

        const { error: dbError } = await supabaseAdmin
            .from('PasswordResets')
            .insert([{ 
                ID: userExist.ID, 
                Email: userExist.Email, 
                Token: otp 
            }]);

        if (dbError) throw dbError;

        const mailOptions = {
            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
            to: userExist.Email,
            subject: 'Código de recuperación - FasTalk',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #1e293b;">Recuperación de Contraseña</h2>
                    <p>Hola, hemos recibido una solicitud para restablecer tu contraseña.</p>
                    <p>Tu código de seguridad es:</p>
                    <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px;">
                        <h1 style="color: #68899D; letter-spacing: 8px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="font-size: 0.85rem; color: #64748b; margin-top: 20px;">Este código expirará en breve. Si no solicitaste esto, ignora este correo.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Código enviado" });

    } catch (error) {
        console.error("Error en forgot-password:", error); 
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, token } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('PasswordResets')
            .select('*')
            .ilike('Email', email)
            .eq('Token', token)
            .order('CreatedAt', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "El código es incorrecto o ha expirado" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al verificar el código" });
    }
});

router.post('/update-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: user, error: userError } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID')
            .ilike('Email', email)
            .maybeSingle();
        
        if (!user || userError) {
            return res.status(404).json({ success: false, message: "No se encontró el perfil del usuario para actualizar la contraseña." });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            user.ID, 
            { password: password }
        );

        if (authError) throw authError;
        
        await supabaseAdmin.from('PasswordResets').delete().ilike('Email', email);

        res.json({ success: true, message: "Contraseña actualizada con éxito" });

    } catch (error) {
        console.error("Error en update-password:", error);
        res.status(500).json({ success: false, message: "No se pudo actualizar la contraseña" });
    }
});

module.exports = router;