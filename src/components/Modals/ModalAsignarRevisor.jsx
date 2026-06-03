import { useState, useEffect } from 'react';
import { Dialog, IconButton, Typography, Button, MenuItem, Select, FormControl, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import toast from 'react-hot-toast';
import '../../styles/Modals/Modales.css'; 

export default function ModalAsignarRevisor({ open, onClose, tutorData, onSuccess }) {
    const [revisoresDisponibles, setRevisoresDisponibles] = useState([]);
    const [selectedRevisor, setSelectedRevisor] = useState('');
    
    const [revisorActualNombre, setRevisorActualNombre] = useState(null);
    const [revisorActualAvatar, setRevisorActualAvatar] = useState(null);

    const tieneRevisor = tutorData?.Enrollments_Reviewers?.length > 0;
    const revisorIDActual = tieneRevisor ? tutorData.Enrollments_Reviewers[0].ReviewerID : null;

    useEffect(() => {
        if (open) {
        const fetchRevisores = async () => {
            try {
            const response = await fetch("http://localhost:8000/api/admin/revisores");
            const data = await response.json();
            if (Array.isArray(data)) {
                setRevisoresDisponibles(data);
                
                if (revisorIDActual) {
                const revisorActual = data.find(rev => rev.ID === revisorIDActual);
                if (revisorActual) {
                    setRevisorActualNombre(revisorActual.Name);
                    // Extraemos el AvatarUrl que ya manda el backend
                    setRevisorActualAvatar(revisorActual.AvatarUrl); 
                }
                }
            }
            } catch (error) {
            console.error("Error al obtener revisores:", error);
            }
        };
        fetchRevisores();
        }
    }, [open, revisorIDActual]);

    const handleAsignar = async () => {
        if (!selectedRevisor) {
        toast.error("Selecciona un revisor primero.");
        return;
        }

        const loadingToast = toast.loading('Asignando revisor en la base de datos...');

        try {
        const response = await fetch("http://localhost:8000/api/admin/asignar-revisor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tutorId: tutorData.ID, reviewerId: selectedRevisor })
        });
        
        const data = await response.json();
        
        if (data.success) {
            toast.success('¡Revisor asignado con éxito!', { id: loadingToast });
            setSelectedRevisor(''); 
            onSuccess();            
            onClose();             
        } else {
            toast.error(data.message || "Hubo un error al asignar.", { id: loadingToast });
        }

        } catch (error) {
        console.error(error);
        toast.error('Error al conectar con el servidor', { id: loadingToast });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ className: 'modal-container' }}>
        <IconButton onClick={onClose} className="close-button"><CloseIcon /></IconButton>
        
        <div className="modal-content">
            <Typography className="modal-title">
            {tieneRevisor ? 'Revisor Asignado' : 'Asignar Revisor'}
            </Typography>

            <div style={{ marginBottom: '20px' }}>
            <Typography variant="body2" style={{ color: '#64748b', marginBottom: '15px' }}>
                Tutor seleccionado: <strong style={{ color: '#1e293b' }}>{tutorData?.Name}</strong>
            </Typography>

            {tieneRevisor ? (
                <div style={{ 
                padding: '20px', 
                backgroundColor: '#fdf4ff', 
                borderRadius: '16px', 
                border: '1px solid #fbcfe8', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '12px' 
                }}>
                <Typography variant="caption" style={{ color: '#c026d3', fontWeight: 800, letterSpacing: '1px' }}>
                    REVISOR TITULAR
                </Typography>
                
                <Avatar 
                    src={revisorActualAvatar || undefined}
                    sx={{ width: 75, height: 75, bgcolor: '#8a045d', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                >
                    {!revisorActualAvatar && <AccountCircleIcon sx={{ fontSize: 50 }} />}
                </Avatar>

                <Typography variant="h5" style={{ color: '#701a75', fontWeight: 800, lineHeight: 1.2 }}>
                    {revisorActualNombre || 'Cargando...'}
                </Typography>
                </div>
            ) : (
                <FormControl fullWidth>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                    Selecciona un Revisor
                </label>
                <Select
                    displayEmpty
                    value={selectedRevisor}
                    onChange={(e) => setSelectedRevisor(e.target.value)}
                    style={{ borderRadius: '12px' }}
                >
                    <MenuItem value="" disabled style={{ display: 'none' }}>Elige un revisor...</MenuItem>
                    {revisoresDisponibles.map((rev) => (
                    <MenuItem key={rev.ID} value={rev.ID}>
                        {rev.Name}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>
            )}
            </div>

            <div className="modal-actions">
            <Button onClick={onClose} className="btn-cancel">Cerrar</Button>
            {!tieneRevisor && (
                <Button onClick={handleAsignar} variant="contained" className="btn-save">Confirmar Asignación</Button>
            )}
            </div>
        </div>
        </Dialog>
    );
    }