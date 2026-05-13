import { useState, useEffect } from 'react';
import { Typography, Avatar, Paper, Button, IconButton, Dialog, Chip, List, ListItem, ListItemText, Divider, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import ClassIcon from '@mui/icons-material/Class';
import SearchIcon from '@mui/icons-material/Search'; 
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
    
    const [searchTerm, setSearchTerm] = useState('');

    const [openDetalles, setOpenDetalles] = useState(false);
    const [openCursos, setOpenCursos] = useState(false);
    const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
    const [cursosDelTutor, setCursosDelTutor] = useState([]);

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

    const courseColors = { 'Inglés': 'bg-ingles', 'Francés': 'bg-frances' };

    const tutoresFiltrados = tutores.filter((item) => {
        const busqueda = searchTerm.toLowerCase();
        return (
            item.Name?.toLowerCase().includes(busqueda) || 
            item.Email?.toLowerCase().includes(busqueda)
        );
    }).sort((a, b) => {
        const estadoA = a.State || 'Active';
        const estadoB = b.State || 'Active';
        
        if (estadoA === 'Active' && estadoB === 'Inactive') return -1;
        if (estadoA === 'Inactive' && estadoB === 'Active') return 1;
        
        return (a.Name || '').localeCompare(b.Name || '');
    });

    const totalTutores = tutores.length;
    const activosCount = tutores.filter(t => (t.State || 'Active') === 'Active').length;
    const inactivosCount = totalTutores - activosCount;

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ margin: '0 0 20px 0', alignItems: 'center', width: '100%', display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
                    <h2 className="dashboard-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', lineHeight: 1, margin: 0 }}>
                        Gestión de Tutores
                    </h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px', height: '35px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{totalTutores}</Typography>
                            </div>
                            <Typography style={{ fontWeight: 800, color: '#64748b', fontSize: '0.85rem', letterSpacing: '0.5px' }}>TOTAL</Typography>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803d' }}>{activosCount}</Typography>
                            </div>
                            <Typography style={{ fontWeight: 800, color: '#166534', fontSize: '0.85rem', letterSpacing: '0.5px' }}>ACTIVOS</Typography>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography style={{ fontWeight: 800, fontSize: '0.95rem', color: '#b91c1c' }}>{inactivosCount}</Typography>
                            </div>
                            <Typography style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.85rem', letterSpacing: '0.5px' }}>INACTIVOS</Typography>
                        </div>
                    </div>
                </div>

                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isAdmin && (
                        <Button 
                            onClick={() => setOpenModalTutor(true)} 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            style={{ backgroundColor: '#68899D', textTransform: 'none', borderRadius: '8px', fontWeight: 600, padding: '8px 16px', boxShadow: 'none', whiteSpace: 'nowrap' }}
                        > 
                            Registrar nuevo tutor 
                        </Button>
                    )}
                    <ModalTutor open={openModalTutor} onClose={() => { setOpenModalTutor(false); fetchTutores(); }} />
                    <ModalAsignarRevisor open={openModalRevisor} onClose={() => setOpenModalRevisor(false)} tutorData={tutorSeleccionado} onSuccess={fetchTutores} />
                </div>
            </div>

            <hr className="divisor" style={{ marginBottom: '20px', border: 'none', borderTop: '1px solid #e2e8f0' }}/>

            <div className='actions' style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '25px' }}>
                <TextField 
                    placeholder="Buscar tutor por nombre o correo..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon style={{ color: '#64748b' }} />
                            </InputAdornment>
                        ),
                        style: { borderRadius: '12px', backgroundColor: '#fff', width: '350px' }
                    }}
                />
            </div>

            <div className='cards-grid'>
                {tutoresFiltrados.length > 0 ? (
                    tutoresFiltrados.map((item) => {
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
                            <Paper 
                                key={item.ID} 
                                className="tutor-card" 
                                elevation={0}
                                style={{ 
                                    backgroundColor: estado === 'Inactive' ? '#f8fafc' : '#ffffff',
                                    border: estado === 'Inactive' ? '1px solid #e2e8f0' : '1px solid #e0e4e8',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div className="card-top" style={{ alignItems: 'flex-start' }}>
                                    
                                    <Avatar className="tutor-avatar" style={{ opacity: estado === 'Inactive' ? 0.4 : 1, filter: estado === 'Inactive' ? 'grayscale(100%)' : 'none' }}>
                                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                    </Avatar>

                                    <div className="tutor-data">
                                        <div className='header-container-card'>
                                            <Typography className="tutor-name-title" style={{ 
                                                textDecoration: estado === 'Inactive' ? 'line-through' : 'none', 
                                                color: estado === 'Inactive' ? '#94a3b8' : '#1e293b' 
                                            }}>
                                                {item.Name}
                                            </Typography>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>
                                                    {estado}
                                                </span>
                                                {isAdmin && (
                                                    <IconButton 
                                                        size="small" 
                                                        style={{ 
                                                            color: estado === 'Active' ? '#ef4444' : '#10b981', 
                                                            backgroundColor: estado === 'Active' ? 'transparent' : '#dcfce7',
                                                            padding: '4px' 
                                                        }} 
                                                        onClick={() => handleToggleEstado(item.ID, estado, tieneRevisor, estudiantes)}
                                                    >
                                                        {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                    </IconButton>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div style={{ opacity: estado === 'Inactive' ? 0.5 : 1, filter: estado === 'Inactive' ? 'grayscale(100%)' : 'none' }}>
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
                                </div>

                                <div className="bottom-actions" style={{ flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <button onClick={() => handleAbrirDetalles(item)} className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>Ver Detalles</button>
                                        <button onClick={() => handleOpenRevisorModal(item)} className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', ...estiloBotonRevisor, opacity: estado === 'Inactive' ? 0.5 : 1 }} disabled={estado === 'Inactive'}>{textoBotonRevisor}</button>
                                        <button onClick={() => handleAbrirCursos(item)} className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', opacity: estado === 'Inactive' ? 0.5 : 1 }} disabled={estado === 'Inactive'}>Ver Cursos</button>
                                    </div>
                                    <button className="assign" style={{ width: '100%', padding: '10px', opacity: estado === 'Inactive' ? 0.5 : 1 }} disabled={estado === 'Inactive'}>Revisar Bitacoras</button>
                                </div>
                            </Paper>
                        );
                    })
                ) : (
                    <Typography style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px', color: '#64748b', fontStyle: 'italic' }}>
                        No se encontraron tutores con ese nombre o correo.
                    </Typography>
                )}
            </div>

            {/* Modales - Se mantienen intactos */}
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