    import { useState, useEffect } from 'react';
    import { Dialog, IconButton, Typography, Button, MenuItem, Select, FormControl } from '@mui/material';
    import CloseIcon from '@mui/icons-material/Close';
    import toast from 'react-hot-toast';
    import '../../styles/Modals/Modales.css'; 

    export default function ModalAsignarRevisor({ open, onClose, tutorData, onSuccess }) {
    const [revisoresDisponibles, setRevisoresDisponibles] = useState([]);
    const [selectedRevisor, setSelectedRevisor] = useState('');
    const [revisorActualNombre, setRevisorActualNombre] = useState(null);

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
            <Typography variant="body2" className='textSecondary'>
                Tutor seleccionado: <strong>{tutorData?.Name}</strong>
            </Typography>

            {tieneRevisor ? (
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="body1">
                    El revisor de este tutor es:
                </Typography>
                <Typography variant="h6" style={{ color: '#1e40af', marginTop: '5px' }}>
                    {revisorActualNombre || 'Cargando...'}
                </Typography>
                </div>
            ) : (
                <FormControl fullWidth>
                <label className='seleccionRevisor'>Selecciona un Revisor</label>
                <Select
                    displayEmpty
                    value={selectedRevisor}
                    onChange={(e) => setSelectedRevisor(e.target.value)}
                >
                    <MenuItem value="" disabled className="selectRevisor" style={{ display: 'none' }}>Elige un revisor...</MenuItem>
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