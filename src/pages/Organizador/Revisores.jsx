import { useState, useEffect } from 'react';
import { Typography, Avatar, Paper, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import toast from 'react-hot-toast'; 
import ModalRevisor from '../../components/Modals/ModalRevisor';

import '../../styles/App.css';
import '../../styles/Organizador/Revisor.css';

export default function ControlRevisores() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';

    const [revisores, setRevisores] = useState([]);
    const [openModal, setOpenModal] = useState(false);

    const fetchRevisores = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/revisores");
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setRevisores(data);
            }
        } catch (error) {
            console.error("Error al obtener revisores:", error);
        }
    };

    useEffect(() => { 
        fetchRevisores(); 
    }, []);

    const handleToggleEstado = async (id, estadoActual, tutoresAsignados) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive') {
            if (parseInt(tutoresAsignados) > 0) {
                toast.error("No se puede desactivar: El revisor tiene tutores asignados a su cargo.", { icon: '⚠️' });
                return;
            }
        }

        const loadingToast = toast.loading(`Cambiando estado a ${nuevoEstado}...`);

        try {
            const response = await fetch("http://localhost:8000/api/admin/cambiar-estado", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, newState: nuevoEstado })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Revisor marcado como ${nuevoEstado}`, { id: loadingToast });
                fetchRevisores(); 
            } else {
                toast.error(data.message || "Error al cambiar estado", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Error de conexión al servidor", { id: loadingToast });
        }
    };

    return (
        <div className='mainContent'>
            
            <div className="header-container">
                <h2 className="dashboard-title">Gestión de Revisores</h2>
                
                <div className="header-actions">
                    {isAdmin && (
                        <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary"> 
                            Registrar nuevo revisor 
                        </Button>
                    )}

                    <ModalRevisor open={openModal} onClose={() => { setOpenModal(false); fetchRevisores(); }} />

                    <IconButton className="btn-secondary"> 
                        <UploadFileIcon style={{ fontSize: '40px' }} /> 
                    </IconButton>                
                </div>
            </div>

            <hr className="divisor"/>

            <div className='actions'></div>

            <div className='cards-grid'>
                {revisores.map((item) => {
                    const rawReviewer = item.Reviewer || item.reviewer;
                    const revData = Array.isArray(rawReviewer) ? rawReviewer[0] : (rawReviewer || {}); 
                    
                    const carrera = revData.Career || 'N/A';
                    const tutoresAsignados = revData.AsignedTutors || '0';
                    const validaciones = 'N/A'; 
                    const estado = item.State || 'Active'; 

                    return (
                        <Paper key={item.ID} className="revisor-card" elevation={0}>
                            <div className="card-top" style={{ alignItems: 'flex-start' }}>
                                <Avatar className="revisor-avatar">
                                    <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                </Avatar>

                                <div className="revisor-data">
                                    
                                    <div className='header-container-card'>
                                        <Typography className="revisor-name-title">{item.Name}</Typography>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>
                                                {estado}
                                            </span>

                                            {isAdmin && (
                                                <IconButton 
                                                    size="small" 
                                                    style={{ color: estado === 'Active' ? '#ef4444' : '#10b981', padding: '2px' }} 
                                                    title={estado === 'Active' ? "Deshabilitar Revisor" : "Activar Revisor"}
                                                    onClick={() => handleToggleEstado(item.ID, estado, tutoresAsignados)}
                                                >
                                                    {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                </IconButton>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="info-grid">
                                        <div className="info-row-card">
                                            <div className="info-item">
                                                <span className="label">Carrera</span>
                                                <span className="cont-career">{carrera}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Tutores Asignados</span>
                                                <span className="cont-horasA">{tutoresAsignados}</span>
                                            </div>
                                        </div>

                                        <div className="info-row-card">
                                            <div className="info-item">
                                                <span className="label">Validaciones Completadas</span>
                                                <span className="cont-completedV">{validaciones}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-actions" style={{ marginTop: '5px' }}>
                                <button className="details">Ver Detalles</button>
                                <button className="assign">Ver cola de trabajo</button>
                            </div>

                        </Paper>
                    );
                })}
            </div>
        </div>
    );
}