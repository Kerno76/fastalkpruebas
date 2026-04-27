import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import toast from 'react-hot-toast'; 
import ModalEstudiante from '../../components/Modals/ModalEstudiante';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css';

export default function ControlEstudiantes() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';

    const [estudiantes, setEstudiantes] = useState([]);
    const [openModal, setOpenModal] = useState(false);

    const fetchEstudiantes = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/estudiantes");
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setEstudiantes(data);
            }
        } catch (error) {
            console.error("Error al obtener estudiantes:", error);
        }
    };

    useEffect(() => { 
        fetchEstudiantes(); 
    }, []);

    const handleToggleEstado = async (id, estadoActual, tutorAsignado) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive') {
            if (tutorAsignado && tutorAsignado !== 'Sin asignar') {
                toast.error("No se puede desactivar: El estudiante tiene un tutor asignado.", { icon: '⚠️' });
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
                toast.success(`Estudiante marcado como ${nuevoEstado}`, { id: loadingToast });
                fetchEstudiantes(); 
            } else {
                toast.error(data.message || "Error al cambiar estado", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Error de conexión al servidor", { id: loadingToast });
        }
    };

    const courseColors = {
        'Inglés': 'bg-ingles',
        'Francés': 'bg-frances'
    };
    
    return (
        <div className='mainContent'>
            <div className="header-container">
                <h2 className="dashboard-title">Gestión de Estudiantes</h2>
                
                <div className="header-actions">
                    {isAdmin && (
                        <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary"> 
                            Registrar nuevo estudiante 
                        </Button>
                    )}

                    <ModalEstudiante open={openModal} onClose={() => { setOpenModal(false); fetchEstudiantes(); }} />
                    
                    <IconButton className="btn-secondary"> <UploadFileIcon style={{ fontSize: '40px' }} /> </IconButton>
                </div>
            </div>

            <hr className="divisor"/>

            <div className='actions'></div>

            <div className='cards-grid'>
                {estudiantes.map((item) => {
                    const rawStudent = item.Students || item.students;
                    const studentData = Array.isArray(rawStudent) ? rawStudent[0] : (rawStudent || {}); 
                    
                    const idioma = studentData.Language || 'N/A';
                    const nivel = studentData.CurrentLevel || 'N/A';
                    const tutorAsignado = studentData.AssignedTutor || 'Sin asignar'; 
                    const estado = item.State || 'Active'; 

                    return (
                        <Paper key={item.ID} className="student-card" elevation={0}>
                            <div className="card-top" style={{ alignItems: 'flex-start' }}>
                                <Avatar className="student-avatar">
                                    <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                </Avatar>

                                <div className="student-data">
                                    
                                    <div className='header-container-card'>
                                        <Typography className="student-name-title">{item.Name}</Typography>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>
                                                {estado}
                                            </span>
                                            
                                            {isAdmin && (
                                                <IconButton 
                                                    size="small" 
                                                    style={{ color: estado === 'Active' ? '#ef4444' : '#10b981', padding: '2px' }} 
                                                    title={estado === 'Active' ? "Deshabilitar Estudiante" : "Activar Estudiante"}
                                                    onClick={() => handleToggleEstado(item.ID, estado, tutorAsignado)}
                                                >
                                                    {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                </IconButton>
                                            )}
                                        </div>
                                    </div>

                                    <div className="info-grid">
                                        <div className="info-row-card">
                                            <div className="info-item">
                                                <span className="label">Nivel</span>
                                                <span className="cont-level">{nivel}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Curso</span>
                                                <span className={`cont-course ${courseColors[idioma] || 'bg-default'}`}>{idioma}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tutor Asignado */}
                                    <div className="tutor-row" style={{ marginTop: '0' }}>
                                        <Typography variant="body2" style={{ color: '#4f566b' }}>
                                            Tutor Asignado: <strong>{tutorAsignado}</strong>
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-actions" style={{ flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Ver Detalles</button>
                                    <button className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Asignar Tutor</button>
                                </div>
                                <button className="assign" style={{ width: '100%', padding: '10px' }}>Asignar Calificación</button>
                            </div>
                        </Paper>
                    );
                })}
            </div>
        </div>
    );
}