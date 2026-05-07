import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Button, IconButton, Dialog, Chip, Select, MenuItem, OutlinedInput, FormControl } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import ClassIcon from '@mui/icons-material/Class';
import toast from 'react-hot-toast'; 
import ModalEstudiante from '../../components/Modals/ModalEstudiante';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css';

export default function ControlEstudiantes() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';

    const [estudiantes, setEstudiantes] = useState([]);
    const [cursosDisponibles, setCursosDisponibles] = useState([]);
    const [openModal, setOpenModal] = useState(false);

    const [openDetalles, setOpenDetalles] = useState(false);
    const [openAsignar, setOpenAsignar] = useState(false);
    const [openVerCurso, setOpenVerCurso] = useState(false);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
    const [cursoElegido, setCursoElegido] = useState('');

    const fetchEstudiantes = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/estudiantes-list");
            const data = await response.json();
            if (Array.isArray(data)) setEstudiantes(data);
        } catch (error) {
            console.error("Error al obtener estudiantes:", error);
        }
    };

    const fetchCursos = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/cursos-list");
            const data = await response.json();
            if (data.success) setCursosDisponibles(data.cursos);
        } catch (error) {
            console.error("Error al obtener cursos:", error);
        }
    };

    useEffect(() => { 
        fetchEstudiantes(); 
        fetchCursos();
    }, []);

    const handleToggleEstado = async (id, estadoActual, tutorAsignado) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive' && tutorAsignado && tutorAsignado !== 'Sin asignar') {
            toast.error("No se puede desactivar: El estudiante tiene un curso y tutor asignado.", { icon: '⚠️' });
            return;
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

    const handleAbrirDetalles = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setOpenDetalles(true);
    };

    const handleAbrirAsignar = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setCursoElegido('');
        setOpenAsignar(true);
    };

    const handleAbrirVerCurso = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setOpenVerCurso(true);
    };

    const handleGuardarAsignacion = async () => {
        if (!cursoElegido) return;
        const loadingToast = toast.loading('Asignando curso al estudiante...');

        try {
            const response = await fetch("http://localhost:8000/api/admin/enroll-students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: cursoElegido,
                    studentIds: [estudianteSeleccionado.ID]
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Curso asignado con éxito', { id: loadingToast });
                setOpenAsignar(false);
                fetchEstudiantes();
                fetchCursos();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Error de conexión', { id: loadingToast });
        }
    };

    const courseColors = { 'Inglés': 'bg-ingles', 'Francés': 'bg-frances' };

    const estudianteRaw = estudianteSeleccionado?.Students;
    const estData = Array.isArray(estudianteRaw) ? estudianteRaw[0] : (estudianteRaw || {});
    const estIdioma = estData.Language || '';
    const estNivel = estData.CurrentLevel || '';

    const cursosCompatibles = cursosDisponibles.filter(c => 
        c.Language?.toUpperCase() === estIdioma.toUpperCase() && c.Level === estNivel
    );

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
                    const rawStudent = item.Students || {};
                    const studentData = Array.isArray(rawStudent) ? rawStudent[0] : rawStudent; 
                    
                    const idioma = studentData.Language || 'N/A';
                    const nivel = studentData.CurrentLevel || 'N/A';
                    const tutorAsignado = item.tutorAsignado || 'Sin asignar'; 
                    const estado = item.State || 'Active'; 
                    const estaEnrolado = !!item.cursoData;

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
                                            <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>{estado}</span>
                                            {isAdmin && (
                                                <IconButton size="small" style={{ color: estado === 'Active' ? '#ef4444' : '#10b981', padding: '2px' }} onClick={() => handleToggleEstado(item.ID, estado, tutorAsignado)}>
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

                                    <div className="tutor-row" style={{ marginTop: '0' }}>
                                        <Typography variant="body2" style={{ color: '#4f566b' }}>
                                            Tutor Asignado: <strong>{tutorAsignado}</strong>
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-actions" style={{ flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleAbrirDetalles(item)}>Ver Detalles</button>
                                    
                                    {estaEnrolado ? (
                                        <button className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', backgroundColor: '#f9fafb', color: '#4f566b', border: '1px solid #e0e4e8' }} onClick={() => handleAbrirVerCurso(item)}>Ver Curso</button>
                                    ) : (
                                        <button className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleAbrirAsignar(item)}>Asignar Curso</button>
                                    )}
                                </div>
                                <button className="assign" style={{ width: '100%', padding: '10px' }}>Asignar Calificación</button>
                            </div>
                        </Paper>
                    );
                })}
            </div>

            <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenDetalles(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Perfil del Estudiante</Typography>
                    
                    {estudianteSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Avatar sx={{ width: 64, height: 64, bgcolor: '#048A81' }}><AccountCircleIcon sx={{ fontSize: 40 }} /></Avatar>
                                <div>
                                    <Typography variant="h5" style={{ fontWeight: 800, color: '#1e293b' }}>{estudianteSeleccionado.Name}</Typography>
                                    <Typography variant="body2" style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{estudianteSeleccionado.Email}</Typography>
                                    <Chip label={estudianteSeleccionado.State} size="small" style={{ backgroundColor: estudianteSeleccionado.State === 'Active' ? '#dcfce7' : '#fee2e2', color: estudianteSeleccionado.State === 'Active' ? '#166534' : '#991b1b', fontWeight: 700 }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Teléfono</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estData.Phone || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Fecha de Nacimiento</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estudianteSeleccionado.BirthDate || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Idioma Inscrito</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estIdioma || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Nivel Actual</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estNivel || 'N/A'}</Typography>
                                </Paper>
                            </div>

                            <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Estatus de Enrolamiento</Typography>
                                <Typography variant="body1" style={{ fontWeight: 700, color: estudianteSeleccionado.cursoData ? '#15803d' : '#b45309', marginTop: '5px' }}>
                                    {estudianteSeleccionado.cursoData ? `Asignado al curso: ${estudianteSeleccionado.cursoData.Name}` : 'Aún no tiene curso asignado'}
                                </Typography>
                            </Paper>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog open={openAsignar} onClose={() => setOpenAsignar(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenAsignar(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Asignar Curso</Typography>
                    
                    {estudianteSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <Typography variant="body2" style={{ color: '#0369a1', fontWeight: 700 }}>Asignando a:</Typography>
                                <Typography variant="h6" style={{ color: '#0c4a6e', fontWeight: 800 }}>{estudianteSeleccionado.Name}</Typography>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <Chip label={estIdioma} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 600 }} />
                                    <Chip label={`Nivel ${estNivel}`} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 600 }} />
                                </div>
                            </div>

                            <div className="form-group" style={{ width: '100%' }}>
                                <label>Cursos Compatibles Disponibles</label>
                                <FormControl fullWidth>
                                    <Select displayEmpty value={cursoElegido} onChange={(e) => setCursoElegido(e.target.value)} input={<OutlinedInput sx={{ borderRadius: '12px' }} />}>
                                        <MenuItem value="" disabled>Selecciona un curso</MenuItem>
                                        {cursosCompatibles.map((c) => (
                                            <MenuItem key={c.CourseID} value={c.CourseID}>
                                                {c.Name} {c.Period ? `(${c.Period})` : ''} - Tutor: {c.tutorName}
                                            </MenuItem>
                                        ))}
                                        {cursosCompatibles.length === 0 && (
                                            <MenuItem disabled>No hay cursos de {estIdioma} Nivel {estNivel} disponibles.</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className="modal-actions">
                                <Button onClick={() => setOpenAsignar(false)} className="btn-cancel">Cancelar</Button>
                                <Button onClick={handleGuardarAsignacion} variant="contained" className="btn-save" disabled={!cursoElegido}>Enrolar Estudiante</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog open={openVerCurso} onClose={() => setOpenVerCurso(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenVerCurso(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Curso Actual</Typography>
                    
                    {estudianteSeleccionado?.cursoData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                                <div>
                                    <Typography variant="body2" style={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inscrito en:</Typography>
                                    <Typography variant="h5" style={{ color: '#15803d', fontWeight: 800 }}>{estudianteSeleccionado.cursoData.Name}</Typography>
                                    <Typography variant="body2" style={{ color: '#166534', fontWeight: 600 }}>Periodo: {estudianteSeleccionado.cursoData.Period || 'N/A'}</Typography>
                                </div>
                                <ClassIcon style={{ color: '#22c55e', fontSize: '40px' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tutor Titular</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estudianteSeleccionado.cursoData.tutorName}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Estado del Curso</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estudianteSeleccionado.cursoData.Status}</Typography>
                                </Paper>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

        </div>
    );
}