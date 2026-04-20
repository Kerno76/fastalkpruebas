import { useState } from 'react';
import { Dialog, IconButton, Typography, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import '../../styles/Modals/Modales.css'; 
import toast from 'react-hot-toast';

export default function ModalOlvidoPassword({ open, onClose }) {
    const [step, setStep] = useState(1); // Estados del flujo: 1: Email, 2: Código, 3: Nueva Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');

    // Función que simula la llamada al servidor (fetch)
    const sendEmailRequest = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const exito = true; // Simulación de respuesta del server
                exito ? resolve() : reject();
            }, 2000);
        });
    };

    const handleChange = (e) => {
        const val = e.target.value;
        
        // Usamos una expresión regular para permitir SOLO números
        if (val === '' || /^[0-9\b]+$/.test(val)) {
            setOtp(val);
        }
    };

    const handleAction = async () => {
        if (step === 1) {
            // USANDO PROMISE: Maneja carga, éxito y error en una línea
            toast.promise(
                sendEmailRequest(),
                {
                    loading: 'Enviando código de seguridad...',
                    success: '¡Código enviado! Revisa tu bandeja.',
                    error: 'Error al enviar el correo. Reintenta.',
                }
            );

            // Solo avanzamos si la promesa es exitosa (aquí simulado)
            try {
                await sendEmailRequest();
                setStep(2);
            } catch (e) { }

        } else if (step === 2) {
            toast.success('Código verificado correctamente');
            setStep(3);
        } else {
            handleReset();
            toast.success('Contraseña restablecida con éxito', {icon: '🔒'});
        }
    };

    const handleReset = () => {
        onClose();
        setStep(1);
        setOtp("");
    };

    return (
        <Dialog open={open} onClose={handleReset} maxWidth="xs" fullWidth PaperProps={{ className: 'modal-container' }}>
        <IconButton onClick={handleReset} className="close-button">
            <CloseIcon />
        </IconButton>

        <div className="modal-content">
            <Typography className="modal-title">
            {step === 1 && "Recuperar Contraseña"}
            {step === 2 && "Verificar Código"}
            {step === 3 && "Nueva Contraseña"}
            </Typography>

            <form className="modal-form">
                {/* Ingresar Correo */}
                {step === 1 && (
                    <div className="form-group">
                    <label>Introduce tu correo institucional</label>
                    <TextField fullWidth placeholder="ejemplo@tec.mx" value={email} onChange={(e) => setEmail(e.target.value)}/>
                    <p className="modal-info-text">Te enviaremos un código de 6 dígitos.</p>
                    </div>
                )}

                {/* Ingresar OTP */}
                {step === 2 && (
                    <div className="form-group">
                    <label>Código de verificación</label>
                    <TextField onChange={handleChange} value={otp} fullWidth placeholder="000000" inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '10px', fontSize: '20px' } }} />
                    <p className="modal-info-text">Enviado a: {email}</p>
                    </div>
                )}

                {/* Nueva Contraseña */}
                {step === 3 && (
                    <>
                    <div className="form-group">
                        <label>Nueva Contraseña</label>
                        <TextField fullWidth type="password" placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <TextField fullWidth type="password" placeholder="••••••••" />
                    </div>
                    </>
                )}

                <div className="modal-actions">
                    {step < 3 ? (
                    <Button variant="contained" onClick={handleAction} className="btn-save" fullWidth>
                        {step === 1 ? "Enviar Código" : "Verificar Código"}
                    </Button>
                    ) : (
                    <Button variant="contained" onClick={handleAction} className="btn-save" fullWidth>
                        Restablecer Contraseña
                    </Button>
                    )}
                </div>
            </form>
        </div>
        </Dialog>
    );
}