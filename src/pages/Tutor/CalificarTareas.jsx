import { useState } from 'react';
import { Typography, Avatar, Paper, Button, IconButton, LinearProgress, Dialog, Chip, TextField } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import '../../styles/App.css';
import '../../styles/Tutor/Calificar.css';

const mockData = [
    {
        id: 1,
        name: 'Ana García',
        status: 'Active',
        course: 'Inglés B1',
        tasks: [
            { id: 101, title: 'Vocabulario B1 - Sesión 3', date: '12 Mayo', isLate: false, status: 'Pendiente por Calificar' },
            { id: 102, title: 'Gramática B1 - Sesión 3', date: '14 Mayo', isLate: true, status: 'Pendiente por Calificar' }
        ]
    },
    {
        id: 2,
        name: 'Luis Pérez',
        status: 'Active',
        course: 'Francés A2',
        tasks: [] // Cuando no hay tareas ponemos una "tarjeta fantasma" 
    },
    {
        id: 3,
        name: 'Sofía Martínez',
        status: '',
        course: 'Inglés B1',
        tasks: [
            { id: 103, title: 'Lectura Comprensiva B1 - Sesión 2', date: '10 Mayo', isLate: false, status: 'Calificada', grade: '9/10' },
            { id: 104, title: 'Pronunciación B1 - Sesión 3', date: '15 Mayo', isLate: false, status: 'Pendiente por Calificar' }
        ]
    }
];

export default function CalificarTareas() {
    const tareasTotales = 10;
    const tareasPendientes = 4;
    const progreso = ((tareasTotales - tareasPendientes) / tareasTotales) * 100;
    const [openExpediente, setOpenExpediente] = useState(false);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

    // Estados para el modal de detalles de la tarea
    const [openTarea, setOpenTarea] = useState(false);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

    // Estados para el modal de Calificar
    const [openCalificar, setOpenCalificar] = useState(false);
    const [tareaACalificar, setTareaACalificar] = useState(null);
    const [calificacion, setCalificacion] = useState('');

    const getStatusColor = (status) => {
        if (status === 'Pendiente por Calificar') return 'status-warning';
        if (status === 'Calificada') return 'status-success';
        return 'status-default';
    };

    const handleAbrirExpediente = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setOpenExpediente(true);
    };

    const handleAbrirTarea = (task) => {
        setTareaSeleccionada(task);
        setOpenTarea(true);
    };

    const handleAbrirCalificar = (task) => {
        setTareaACalificar(task);
        setCalificacion('');
        setOpenCalificar(true);
    };

    return (
        <div className='mainContent'>
            <div className="header-container">
                <h2 className="dashboard-title">Calificar Tareas</h2>
                
                <div className="students-stats" style={{ minWidth: '200px' }}>
                    <Typography variant="caption" className="students-text">
                        Tareas Pendientes: {tareasPendientes}
                    </Typography>
                    <LinearProgress variant="determinate" value={progreso} className="students-progress" />
                </div>
            </div>

            <hr className="divisor divisor-spaced" />

            <div className="students-tasks-grid">
                {mockData.map((student) => (
                    <div key={student.id} className="student-task-section">
                        
                        <Paper className="student-header-pill" elevation={0}>
                            <div className="shp-left">
                                <Avatar className="shp-avatar">
                                    <AccountCircleIcon sx={{ fontSize: 40, color: '#697386' }} />
                                </Avatar>
                                <Typography className="shp-name">{student.name}</Typography>
                                
                                {student.status && (
                                    <span className="curso-status-pill status-active-light">
                                        {student.status}
                                    </span>
                                )}
                                
                                <span className={`curso-tag tag-${student.course.split(' ')[0].toLowerCase()}`}>
                                    Curso: {student.course}
                                </span>
                            </div>
                            <button className="btn-shp-perfil" onClick={() => handleAbrirExpediente(student)}>
                                Ver Perfil
                            </button>
                        </Paper>

                        <div className="tasks-container">
                            {student.tasks.map(task => (
                                <Paper key={task.id} className="task-card" elevation={0}>
                                    <div className="task-card-left">
                                        <div className="task-icon-wrapper">
                                            {task.status === 'Calificada' ? 
                                                <AssignmentTurnedInIcon sx={{ color: '#4b5563' }} /> : 
                                                <AssignmentIcon sx={{ color: '#4b5563' }} />
                                            }
                                        </div>

                                        <div className="task-info">
                                            <Typography className="task-title">{task.title}</Typography>
                                            <div className="task-meta">
                                                <span>Entregado: {task.date} </span>
                                                {task.isLate && <span className="late-tag">(Late)</span>}
                                                <span className="meta-divider">|</span>
                                                <span>Status: </span>
                                                <span className={`task-status-pill ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                                {task.grade && <span className="task-grade">Grade: {task.grade}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="task-card-right">
                                        {task.status === 'Pendiente por Calificar' ? (
                                            <>
                                                <button className="btn-task-action btn-main" onClick={() => handleAbrirCalificar(task)}>
                                                    Calificar
                                                </button>

                                                <button className="btn-task-action btn-secondary" onClick={() => handleAbrirTarea(task)}>
                                                    Ver Detalles
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn-task-action btn-secondary">Ver Comentarios</button>
                                                <button className="btn-task-action btn-secondary" onClick={() => handleAbrirTarea(task)}>
                                                    Ver Detalles
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </Paper>
                            ))}

                            <div className="ghost-task-card">
                                <span>Asignar Tarea</span>
                                <AddIcon />
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            <Dialog open={openExpediente} onClose={() => setOpenExpediente(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenExpediente(false)} className="close-button">
                    <CloseIcon />
                </IconButton>

                <div className="modal-content">
                    <Typography className="modal-title">Expediente del Estudiante</Typography>
                    
                    {estudianteSeleccionado && (
                        <div className="modal-body-container">
                            <div className="modal-header-card">
                                <Avatar className="modal-avatar-large">
                                    <AccountCircleIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                                <div>
                                    <Typography variant="h5" className="modal-student-name">
                                        {estudianteSeleccionado.name}
                                    </Typography>
                                    <Typography variant="body2" className="modal-student-email">
                                        {estudianteSeleccionado.email || 'Sin correo registrado'}
                                    </Typography>
                                    <Chip label="Estudiante Activo" size="small" className="chip-active-student" />
                                </div>
                            </div>

                            <div className="modal-course-info">
                                <Typography variant="caption" className="modal-course-title">Información del Curso</Typography>
                                <div className="modal-course-details">
                                    <div>
                                        <Typography variant="body2" className="detail-label">Curso Inscrito</Typography>
                                        <Typography variant="body1" className="detail-value">{estudianteSeleccionado.course}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="body2" className="detail-label">Nivel</Typography>
                                        <Typography variant="body1" className="detail-value">{estudianteSeleccionado.level || 'N/A'}</Typography>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-stats-grid">
                                <Paper elevation={0} className="modal-stat-paper">
                                    <Typography variant="caption" className="modal-stat-label">Última Sesión</Typography>
                                    <Typography variant="body1" className="modal-stat-value">{estudianteSeleccionado.ultimaSesion || 'Sin registro'}</Typography>
                                </Paper>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>



            {/* Modal de detalles de la tarea */}
            <Dialog open={openTarea} onClose={() => setOpenTarea(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenTarea(false)} className="close-button">
                    <CloseIcon />
                </IconButton>

                <div className="modal-content">
                    <Typography className="modal-title">Detalles de la Tarea</Typography>
                    
                    {tareaSeleccionada && (
                        <div className="modal-body-container">
                            
                            <div className="modal-header-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Typography variant="h5" className="modal-student-name">
                                    {tareaSeleccionada.title}
                                </Typography>
                                <span className={`task-status-pill ${getStatusColor(tareaSeleccionada.status)}`} style={{ marginTop: '10px' }}>
                                    {tareaSeleccionada.status}
                                </span>
                            </div>

                            {/* El grid de la información de la tarea */}
                            <div className="modal-course-info">
                                <Typography variant="caption" className="modal-course-title">Información General</Typography>
                                <div className="modal-course-details">
                                    <div>
                                        <Typography variant="body2" className="detail-label">Fecha de Entrega</Typography>
                                        <Typography variant="body1" className="detail-value">
                                            {tareaSeleccionada.date} 
                                            {tareaSeleccionada.isLate && <span className="late-tag" style={{ marginLeft: '5px' }}>(Late)</span>}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography variant="body2" className="detail-label">Calificación</Typography>
                                        <Typography variant="body1" className="detail-value">
                                            {tareaSeleccionada.grade || 'Pendiente'}
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción de la tarea */}
                            <div className="modal-course-info" style={{ marginTop: '15px' }}>
                                <Typography variant="caption" className="modal-course-title">Descripción / Instrucciones</Typography>
                                <Typography variant="body2" style={{ marginTop: '8px', color: '#475569', lineHeight: '1.5' }}>
                                    {tareaSeleccionada.descripcion || 'No hay descripción disponible para esta tarea.'}
                                </Typography>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* Modal para calificar tarea */}
            <Dialog open={openCalificar} onClose={() => setOpenCalificar(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenCalificar(false)} className="close-button">
                    <CloseIcon />
                </IconButton>
                
                <div className="modal-content">
                    <Typography className="modal-title">Calificar Tarea</Typography>
                    
                    {tareaACalificar && (
                        <div className="modal-body-container">
                            
                            {/* Cabecera con el título de la tarea */}
                            <div className="modal-header-card" style={{ marginBottom: '20px', padding: '15px' }}>
                                <Typography variant="h6" className="modal-student-name" style={{ margin: 0 }}>
                                    {tareaACalificar.title}
                                </Typography>
                            </div>

                            {/* Sección del Archivo */}
                            <div className="modal-course-info" style={{ marginBottom: '25px' }}>
                                <Typography variant="caption" className="modal-course-title">Archivo del Estudiante</Typography>
                                
                                {tareaACalificar.archivo ? (
                                    <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                        <AssignmentTurnedInIcon sx={{ color: '#4b6478' }} />
                                        <Typography variant="body2" style={{ fontWeight: '700', color: '#1e293b' }}>
                                            {tareaACalificar.archivo}
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <div className="ghost-task-card" style={{ marginTop: '10px', padding: '15px', minHeight: 'auto' }}>
                                        <span>Sin archivo subido</span>
                                    </div>
                                )}
                            </div>

                            {/* Sección de Calificación */}
                            <div className="modal-course-info">
                                <Typography variant="caption" className="modal-course-title">Asignar Calificación</Typography>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                                    <TextField 
                                        type="number"
                                        variant="outlined"
                                        size="small"
                                        placeholder="0 - 100"
                                        value={calificacion}
                                        onChange={(e) => setCalificacion(e.target.value)}
                                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                                        style={{ width: '130px', backgroundColor: '#f8fafc', borderRadius: '8px' }}
                                    />
                                    
                                    <button className="btn-task-action btn-main" style={{ padding: '8px 20px' }}>
                                        Guardar Calificación
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </Dialog>

        </div>
    );
}