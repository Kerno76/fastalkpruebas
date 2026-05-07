import { useState, useEffect } from 'react';
import { Typography, Avatar, Paper, LinearProgress, Button, IconButton, Dialog, Chip, List, ListItem, ListItemText, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import ClassIcon from '@mui/icons-material/Class';
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
    const [openModalRevisor, setOpenModalRevisor] = useState(false);
    
    const [openDetalles, setOpenDetalles] = useState(false);
    const [openCursos, setOpenCursos] = useState(false);
    const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
    const [cursosDelTutor, setCursosDelTutor] = useState([]);

    const metaTutores = 20;

    const fetchTutores = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/tutores");
            const data = await response.json();
            if (Array.isArray(data)) setTutores(data);
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

    const handleAbrirDetalles = (tutor) => {
        setTutorSeleccionado(tutor);
        setOpenDetalles(true);
    };

    const handleAbrirCursos = async (tutor) => {
        setTutorSeleccionado(tutor);
        try {
            const response = await fetch(`http://localhost:8000/api/admin/tutor-cursos/${tutor.ID}`);
            const data = await response.json();
            if (data.success) {
                setCursosDelTutor(data.cursos);
            } else {
                setCursosDelTutor([]);
            }
        } catch (error) {
            setCursosDelTutor([]);
        }
        setOpenCursos(true);
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
    const courseColors = { 'Inglés': 'bg-ingles', 'Francés': 'bg-frances' };

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
                    <ModalAsignarRevisor open={openModalRevisor} onClose={() => setOpenModalRevisor(false)} tutorData={tutorSeleccionado} onSuccess={fetchTutores} />

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
                    const rawTutor = item.Tutors || {};
                    const tutorData = Array.isArray(rawTutor) ? rawTutor[0] : rawTutor; 
                    
                    const idioma = tutorData.Language || 'N/A';
                    const carrera = tutorData.Career || 'N/A';
                    const horas = tutorData.TotalHours || '0';
                    const estudiantes = tutorData.StudentsN || '0'; 
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
                                                <IconButton size="small" style={{ color: estado === 'Active' ? '#ef4444' : '#10b981', padding: '2px' }} onClick={() => handleToggleEstado(item.ID, estado, tieneRevisor, estudiantes)}>
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
                                    <button onClick={() => handleAbrirDetalles(item)} className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Ver Detalles</button>
                                    <button onClick={() => handleOpenRevisorModal(item)} className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', ...estiloBotonRevisor }}>{textoBotonRevisor}</button>
                                    <button onClick={() => handleAbrirCursos(item)} className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Ver Cursos</button>
                                </div>
                                <button className="assign" style={{ width: '100%', padding: '10px' }}>Revisar Bitacoras</button>
                            </div>
                        </Paper>
                    );
                })}
            </div>

            <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenDetalles(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Perfil del Tutor</Typography>
                    
                    {tutorSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Avatar sx={{ width: 64, height: 64, bgcolor: '#68899D' }}><AccountCircleIcon sx={{ fontSize: 40 }} /></Avatar>
                                <div>
                                    <Typography variant="h5" style={{ fontWeight: 800, color: '#1e293b' }}>{tutorSeleccionado.Name}</Typography>
                                    <Typography variant="body2" style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{tutorSeleccionado.Email}</Typography>
                                    <Chip label={tutorSeleccionado.State} size="small" style={{ backgroundColor: tutorSeleccionado.State === 'Active' ? '#dcfce7' : '#fee2e2', color: tutorSeleccionado.State === 'Active' ? '#166534' : '#991b1b', fontWeight: 700 }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Teléfono</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{(Array.isArray(tutorSeleccionado.Tutors) ? tutorSeleccionado.Tutors[0]?.Phone : tutorSeleccionado.Tutors?.Phone) || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Fecha de Nacimiento</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{tutorSeleccionado.BirthDate || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Idioma de Especialidad</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{(Array.isArray(tutorSeleccionado.Tutors) ? tutorSeleccionado.Tutors[0]?.Language : tutorSeleccionado.Tutors?.Language) || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Carrera</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{(Array.isArray(tutorSeleccionado.Tutors) ? tutorSeleccionado.Tutors[0]?.Career : tutorSeleccionado.Tutors?.Career) || 'N/A'}</Typography>
                                </Paper>
                            </div>

                            <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Hobbies y Tags</Typography>
                                <Typography variant="body1" style={{ fontWeight: 700, color: '#334155', marginTop: '5px' }}>
                                    {(Array.isArray(tutorSeleccionado.Tutors) ? tutorSeleccionado.Tutors[0]?.Hobbies : tutorSeleccionado.Tutors?.Hobbies) || 'Sin registrar'}
                                </Typography>
                            </Paper>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog open={openCursos} onClose={() => setOpenCursos(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenCursos(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Cursos Asignados</Typography>
                    
                    {tutorSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <div>
                                    <Typography variant="caption" style={{ color: '#0369a1', fontWeight: 800 }}>TUTOR: {tutorSeleccionado.Name}</Typography>
                                    <Typography variant="h6" style={{ color: '#0c4a6e', fontWeight: 800 }}>{cursosDelTutor.length} Cursos Activos</Typography>
                                </div>
                                <ClassIcon style={{ color: '#0ea5e9', fontSize: '40px' }} />
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                <List dense>
                                    {cursosDelTutor.map((curso) => (
                                        <div key={curso.CourseID}>
                                            <ListItem style={{ padding: '15px' }}>
                                                <ListItemText 
                                                    primary={`${curso.Name} (${curso.Level})`} 
                                                    secondary={`Periodo: ${curso.Period || 'N/A'} | Estado: ${curso.Status}`} 
                                                    primaryTypographyProps={{ style: { fontWeight: 800, color: '#1e293b', fontSize: '1rem' } }}
                                                    secondaryTypographyProps={{ style: { fontWeight: 600, color: '#64748b', marginTop: '4px' } }}
                                                />
                                                <Chip label={curso.Language} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />
                                            </ListItem>
                                            <Divider />
                                        </div>
                                    ))}
                                    {cursosDelTutor.length === 0 && (
                                        <Typography variant="body2" align="center" style={{ padding: '20px', color: '#94a3b8', fontWeight: 600 }}>
                                            Este tutor no tiene cursos asignados en este momento.
                                        </Typography>
                                    )}
                                </List>
                            </div>

                            <div className="modal-actions">
                                <Button onClick={() => setOpenCursos(false)} className="btn-cancel">Cerrar</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

        </div>
    );
}