import { useState, useEffect } from 'react';
import { Typography, Avatar, Paper, LinearProgress, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import toast from 'react-hot-toast'; 
import ModalTutor from '../../components/Modals/ModalTutor';
import ModalAsignarRevisor from '../../components/Modals/ModalAsignarRevisor';

import '../../styles/App.css';
import '../../styles/Organizador/Tutores.css';

export default function ControlTutores() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';

    const [tutores, setTutores] = useState([]);
    const [openModalTutor, setOpenModalTutor] = useState(false);
    
    // Estados para el Modal de Asignación
    const [openModalRevisor, setOpenModalRevisor] = useState(false);
    const [tutorSeleccionado, setTutorSeleccionado] = useState(null);

    const metaTutores = 20;

    const fetchTutores = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/tutores");
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setTutores(data);
            }
        } catch (error) {
            console.error("Error al obtener tutores:", error);
        }
    };

    useEffect(() => { 
        fetchTutores(); 
    }, []);

    const handleOpenRevisorModal = (tutor) => {
        setTutorSeleccionado(tutor);
        setOpenModalRevisor(true);
    };

    const handleToggleEstado = async (id, estadoActual, tieneRevisor, numEstudiantes) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive') {
            if (tieneRevisor) {
                toast.error("No se puede desactivar: El tutor tiene un revisor asignado.", { icon: '⚠️' });
                return;
            }
            if (parseInt(numEstudiantes) > 0) {
                toast.error("No se puede desactivar: El tutor tiene estudiantes enrolados.", { icon: '⚠️' });
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
                toast.success(`Tutor marcado como ${nuevoEstado}`, { id: loadingToast });
                fetchTutores();
            } else {
                toast.error(data.message || "Error al cambiar estado", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Error de conexión al servidor", { id: loadingToast });
        }
    };

    const progreso = (tutores.length / metaTutores) * 100;

    const courseColors = {
        'Inglés': 'bg-ingles',
        'Francés': 'bg-frances'
    };

    return (
        <div className='mainContent'>
            <div className="header-container">
                <h2 className="dashboard-title">Gestión de Tutores</h2>
                <div className="header-actions">
                    {isAdmin && (
                        <Button onClick={() => setOpenModalTutor(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary"> 
                            Registrar nuevo tutor 
                        </Button>
                    )}

                    <ModalTutor open={openModalTutor} onClose={() => { setOpenModalTutor(false); fetchTutores(); }} />
                    
                    <ModalAsignarRevisor 
                        open={openModalRevisor} 
                        onClose={() => setOpenModalRevisor(false)} 
                        tutorData={tutorSeleccionado}
                        onSuccess={fetchTutores}
                    />

                    <IconButton className="btn-secondary"> 
                        <UploadFileIcon style={{ fontSize: '40px' }} /> 
                    </IconButton>

                    <div className='progress-stat'>
                        <div className='progress-label'>
                            <span>Tutores Activos </span>
                            <span className='progress-count'>{tutores.filter(t => t.State === 'Active').length} / {metaTutores}</span>
                        </div>
                        <div className='progress-container'>
                            <LinearProgress variant="determinate" value={progreso} className='progress-bar'/>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="divisor"/>

            <div className='cards-grid'>
                {tutores.map((item) => {
                    const rawTutor = item.Tutors || item.tutors;
                    const tutorData = Array.isArray(rawTutor) ? rawTutor[0] : (rawTutor || {}); 
                    
                    const idioma = tutorData.Language || tutorData.language || 'N/A';
                    const carrera = tutorData.Career || tutorData.career || 'N/A';
                    const horas = tutorData.TotalHours || tutorData.totalhours || '0';
                    const estudiantes = tutorData.StudentsN || tutorData.studentsn || '0'; 
                    const estado = item.State || 'Active';

                    const tieneRevisor = item.Enrollments_Reviewers && item.Enrollments_Reviewers.length > 0;
                    const textoBotonRevisor = tieneRevisor ? "Ver Revisor" : "Asignar Revisor";
                    const estiloBotonRevisor = tieneRevisor ? { backgroundColor: '#f9fafb', color: '#4f566b', border: '1px solid #e0e4e8' } : {};

                    return (
                        <Paper key={item.ID} className="tutor-card" elevation={0}>
                            <div className="card-top" style={{ alignItems: 'flex-start' }}>
                                <Avatar className="tutor-avatar">
                                    <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                </Avatar>

                                <div className="tutor-data">
                                    
                                    <div className='header-container-card'>
                                        <Typography className="tutor-name-title">{item.Name}</Typography>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>
                                                {estado}
                                            </span>
                                            
                                            {isAdmin && (
                                                <IconButton 
                                                    size="small" 
                                                    style={{ color: estado === 'Active' ? '#ef4444' : '#10b981', padding: '2px' }} 
                                                    title={estado === 'Active' ? "Deshabilitar Tutor" : "Activar Tutor"}
                                                    onClick={() => handleToggleEstado(item.ID, estado, tieneRevisor, estudiantes)}
                                                >
                                                    {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                </IconButton>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="info-grid">
                                        
                                        <div className="info-row">
                                            <div className="info-item">
                                                <span className="label">Curso</span>
                                                <span className={`cont-course ${courseColors[idioma] || 'bg-default'}`}>{idioma}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Carrera</span>
                                                <span className="cont-career">{carrera}</span>
                                            </div>
                                        </div>

                                        <div className="info-row">
                                            <div className="info-item">
                                                <span className="label">Horas Acreditadas</span>
                                                <span className="cont-horasV">{horas} hrs</span>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="tutor-row">
                                        <Typography variant="body1" style={{ color: '#4f566b', fontSize: '1rem' }}>
                                            <strong>{estudiantes}</strong> Estudiantes asignados 
                                        </Typography>
                                    </div>

                                </div>
                            </div>

                            <div className="bottom-actions" style={{ flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Ver Detalles</button>
                                    
                                    <button 
                                        className="assign" 
                                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem', ...estiloBotonRevisor }}
                                        onClick={() => handleOpenRevisorModal(item)}
                                    >
                                        {textoBotonRevisor}
                                    </button>
                                    
                                    <button className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Asignar Estudiantes</button>
                                </div>
                                <button className="assign" style={{ width: '100%', padding: '10px' }}>Revisar Bitacoras</button>
                            </div>
                        </Paper>
                    );
                })}
            </div>
        </div>
    );
}