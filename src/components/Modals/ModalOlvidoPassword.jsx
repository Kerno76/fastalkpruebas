import { useState } from 'react';
import { Dialog, IconButton, Typography, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import '../../styles/Modals/Modales.css'; 
import toast from 'react-hot-toast';

export default function ModalOlvidoPassword({ open, onClose }) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAction = async () => {
        const cleanEmail = email.trim().toLowerCase();

        if (step === 1) {
            if (!email) return toast.error("Por favor, ingresa tu correo electrónico.");
            
            const loading = toast.loading('Buscando cuenta y enviando código...');
            try {
                const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cleanEmail })
                });
                const data = await res.json();
                
                if (data.success) {
                    toast.success('¡Código enviado a tu correo!', { id: loading, icon: '📩' });
                    setStep(2);
                } else {
                    throw new Error(data.message || "Error al enviar código.");
                }
            } catch (err) {
                toast.error(err.message, { id: loading, icon: '⚠️', duration: 5000 });
            }
            return; 
        }

        if (step === 2) {
            if (otp.length < 6) return toast.error("Ingresa el código completo de 6 dígitos.");

            const loading = toast.loading('Verificando código...');
            try {
                const res = await fetch("http://localhost:8000/api/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cleanEmail, token: otp })
                });
                const data = await res.json();

                if (data.success) {
                    toast.success('Código verificado correctamente', { id: loading, icon: '✅' });
                    setStep(3);
                } else {
                    throw new Error(data.message || "Código incorrecto");
                }
            } catch (err) {
                toast.error(err.message, { id: loading });
            }
            return; 
        }

        if (step === 3) {
            if (newPassword.length < 6) {
                return toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
            }
            if (newPassword !== confirmPassword) {
                return toast.error("Las contraseñas no coinciden. Intenta de nuevo.");
            }

            const loading = toast.loading('Actualizando contraseña...');
            try {
                const res = await fetch("http://localhost:8000/api/auth/update-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cleanEmail, password: newPassword })
                });
                const data = await res.json();

                if (data.success) {
                    toast.success('¡Contraseña restablecida con éxito!', { id: loading, icon: '🔒' });
                    handleReset(); 
                } else {
                    throw new Error(data.message);
                }
            } catch (err) {
                toast.error(err.message, { id: loading });
            }
        }
    };

    const handleReset = () => {
        onClose();
        setStep(1);
        setOtp("");
        setEmail("");
        setNewPassword("");
        setConfirmPassword("");
    };

    return (
        <Dialog open={open} onClose={handleReset} maxWidth="xs" fullWidth PaperProps={{ className: 'modal-container' }}>
            <IconButton onClick={handleReset} className="close-button"><CloseIcon /></IconButton>

            <div className="modal-content">
                <Typography className="modal-title">
                    {step === 1 && "Recuperar Contraseña"}
                    {step === 2 && "Verificar Código"}
                    {step === 3 && "Nueva Contraseña"}
                </Typography>

                <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
                    {step === 1 && (
                        <div className="form-group">
                            <label>Introduce tu correo institucional</label>
                            <TextField 
                                fullWidth 
                                placeholder="ejemplo@tec.mx" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="modal-info-text" style={{ marginTop: '10px' }}>Te enviaremos un código de seguridad para verificar tu identidad.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-group">
                            <label>Código de verificación</label>
                            <TextField 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                                fullWidth 
                                placeholder="000000" 
                                inputProps={{ 
                                    maxLength: 6, 
                                    style: { textAlign: 'center', letterSpacing: '10px', fontSize: '20px' } 
                                }} 
                            />
                            <p className="modal-info-text" style={{ marginTop: '10px' }}>Enviado a: <strong>{email.toLowerCase()}</strong></p>
                        </div>
                    )}

                    {step === 3 && (
                        <>
                            <div className="form-group">
                                <label>Nueva Contraseña</label>
                                <TextField fullWidth type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                            </div>
                            <div className="form-group">
                                <label>Confirmar Contraseña</label>
                                <TextField fullWidth type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                            </div>
                        </>
                    )}

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <Button variant="contained" onClick={handleAction} className="btn-save" fullWidth>
                            {step === 1 ? "Enviar Código" : step === 2 ? "Verificar Código" : "Guardar Contraseña"}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
}