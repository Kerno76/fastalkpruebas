const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const nodemailer = require('nodemailer');

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
            .eq('Email', email)
            .single();

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
                .single();
                
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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Ruta para enviar el código
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const { error: dbError } = await supabaseAdmin
            .from('PasswordResets')
            .insert([{ Email: email, Token: otp }]);

        if (dbError) throw dbError;

        const mailOptions = {
            from: `"FasTalk Portal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Código de recuperación - FasTalk',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Recuperación de Contraseña</h2>
                    <p>Tu código de seguridad es:</p>
                    <h1 style="color: #c89f70; letter-spacing: 5px;">${otp}</h1>
                    <p>Este código expira en 10 minutos.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });

    } catch (error) {
        console.error("Error completo:", error); 
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. VERIFICAR CÓDIGO MANUALMENTE
router.post('/verify-otp', async (req, res) => {
    const { email, token } = req.body;

    const { data, error } = await supabaseAdmin
        .from('PasswordResets')
        .select('*')
        .eq('Email', email)
        .eq('Token', token)
        .order('CreatedAt', { ascending: false })
        .limit(1);

    if (data && data.length > 0) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: "Código incorrecto" });
    }
});

// 3. CAMBIAR CONTRASEÑA (MANUAL)
router.post('/update-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        
        const { data: user } = await supabaseAdmin.from('UsersProfiles').select('ID').eq('Email', email).single();
        
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.ID, { password: password });

        if (error) throw error;
        
        await supabaseAdmin.from('PasswordResets').delete().eq('Email', email);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;