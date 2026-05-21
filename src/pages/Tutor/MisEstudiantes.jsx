import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Avatar, Paper, TextField, IconButton, Dialog, Chip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 
import '../../styles/Tutor/MisEstudiantes.css'; 

export default function MisEstudiantes() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    const navigate = useNavigate();
    const courseColors = { 'INGLÉS': 'bg-ingles', 'FRANCÉS': 'bg-frances' };

    const [busqueda, setBusqueda] = useState("");
    const [estudiantes, setEstudiantes] = useState([]);
    
    const [openExpediente, setOpenExpediente] = useState(false);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

    useEffect(() => {
        const fetchEstudiantes = async () => {
            try {
                if (isAdmin) {
                    const response = await fetch("http://localhost:8000/api/admin/estudiantes-list");
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        const adminData = data.filter(e => e.cursoData).map(e => ({
                            id: e.ID,
                            name: e.Name,
                            email: e.Email,
                            tutorAsignado: e.tutorAsignado,
                            courseId: e.cursoData.CourseID,
                            courseName: e.cursoData.Name,
                            language: e.cursoData.Language,
                            level: e.cursoData.Level,
                            courseStatus: e.cursoData.Status || 'Active',
                            horasTotales: '0 hrs',
                            ultimaSesion: 'Sin registro'
                        }));
                        setEstudiantes(adminData);
                    }
                } else {
                    if (!user?.ID) return;
                    const response = await fetch(`http://localhost:8000/api/tutor/mis-estudiantes/${user.ID}`);
                    const data = await response.json();
                    if (data.success && Array.isArray(data.estudiantes)) {
                        setEstudiantes(data.estudiantes);
                    }
                }
            } catch (error) {
                console.error("Error al obtener estudiantes:", error);
            }
        };
        fetchEstudiantes();
    }, [isAdmin, user?.ID]);

    const estudiantesFiltrados = estudiantes.filter((item) => {
        if (busqueda === "") return true;
        const matchName = item.name.toLowerCase().includes(busqueda.toLowerCase());
        const matchTutor = item.tutorAsignado ? item.tutorAsignado.toLowerCase().includes(busqueda.toLowerCase()) : false;
        return isAdmin ? (matchName || matchTutor) : matchName;
    });

    // Separamos a los estudiantes por el estatus de su curso
    const activos = estudiantesFiltrados.filter(e => e.courseStatus === 'Active');
    const proximos = estudiantesFiltrados.filter(e => e.courseStatus === 'Upcoming');

    const handleAbrirExpediente = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setOpenExpediente(true);
    };

    const renderTarjetas = (lista, esProximo) => {
        return (
            <div className='cards-grid' style={{ marginBottom: '40px' }}>
                {lista.map((item) => {
                    const colorClase = item.language ? courseColors[item.language.toUpperCase()] : 'bg-default';

                    return (
                        <Paper key={item.id} className="student-card student-card-tutor" elevation={0}>
                            <div className="card-top">
                                <Avatar className="student-avatar">
                                    <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                </Avatar>

                                <div className="student-data">
                                    {isAdmin && (
                                        <Typography className="admin-tutor-label">
                                            Tutor: {item.tutorAsignado || 'Sin asignar'}
                                        </Typography>
                                    )}
                                    <Typography className="student-name-title student-name-tutor">{item.name}</Typography>
                                    
                                    <div className="info-row">
                                        <span className="label">Nivel</span>
                                        <span className="cont-level">{item.level}</span>
                                        <span className="label course-label-margin">Curso</span>
                                        <span className={`cont-course ${colorClase}`}>{item.courseName}</span>
                                    </div>

                                    <div className="student-stats-container">
                                        <Typography className='myStudents-info myStudents-info-tutor' variant="body2">
                                            Horas dadas: <strong className='info-stud'>{item.horasTotales}</strong>
                                        </Typography>
                                        <Typography className='myStudents-info myStudents-info-tutor' variant="body2">
                                            Última sesión: <strong className='info-stud'>{item.ultimaSesion}</strong>
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-actions" style={{ marginTop: '5px' }}>
                                <button className="details" onClick={() => handleAbrirExpediente(item)}>Ver Expediente</button>
                                {!isAdmin && !esProximo && ( // Solo agendan tareas/clases a cursos activos
                                    <>
                                        <button className="assign btn-agendar" onClick={() => navigate('/agendar', { state: { courseId: item.courseId, studentId: item.id } })}>Agendar Clase</button>
                                        <button className="assign" onClick={() => navigate('/tareas', { state: { courseId: item.courseId, studentId: item.id } })}>Dejar Tarea</button>
                                    </>
                                )}
                            </div>
                        </Paper>
                    );
                })}
            </div>
        );
    };

    return (
        <div className='mainContent'>
            
            <div className="header-text-container">
                <h2 className="header-title-students">
                    {isAdmin ? "Directorio Global de Estudiantes" : "Mis Estudiantes"}
                </h2>
                <p className="header-subtitle-students">
                    {isAdmin ? "Modo Administrador: Supervisión de todos los alumnos enrolados a un curso." : "Aquí puedes ver el progreso y gestionar a los alumnos inscritos en tus cursos."}
                </p>
            </div>

            <div className="search-container">
                <SearchIcon className="search-icon" />
                <TextField 
                    fullWidth 
                    variant="outlined" 
                    size="small" 
                    placeholder={isAdmin ? "Buscar por nombre de alumno o tutor responsable..." : "Buscar alumno por nombre..."}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="search-input"
                />
            </div>

            {activos.length > 0 && (
                <>
                    <h3 style={{ marginTop: '30px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                        <FiberManualRecordIcon style={{ color: '#10b981', fontSize: '1rem' }} /> 
                        Alumnos en Cursos Activos
                    </h3>
                    <hr className="divisor" style={{ marginBottom: '20px' }} />
                    {renderTarjetas(activos, false)}
                </>
            )}

            {proximos.length > 0 && (
                <>
                    <h3 style={{ marginTop: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                        <FiberManualRecordIcon style={{ color: '#f59e0b', fontSize: '1rem' }} /> 
                        Alumnos en Cursos Próximos
                    </h3>
                    <hr className="divisor" style={{ marginBottom: '20px' }} />
                    {renderTarjetas(proximos, true)}
                </>
            )}

            {estudiantesFiltrados.length === 0 && (
                <Typography className="empty-state-text" style={{ marginTop: '40px' }}>
                    No se encontraron estudiantes con los criterios de búsqueda.
                </Typography>
            )}

            <Dialog open={openExpediente} onClose={() => setOpenExpediente(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenExpediente(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Expediente del Estudiante</Typography>
                    
                    {estudianteSeleccionado && (
                        <div className="modal-body-container">
                            
                            <div className="modal-header-card">
                                <Avatar className="modal-avatar-large">
                                    <AccountCircleIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                                <div>
                                    <Typography variant="h5" className="modal-student-name">{estudianteSeleccionado.name}</Typography>
                                    <Typography variant="body2" className="modal-student-email">{estudianteSeleccionado.email}</Typography>
                                    <Chip 
                                        label={estudianteSeleccionado.courseStatus === 'Upcoming' ? 'Inicio Pendiente' : 'Estudiante Activo'} 
                                        size="small" 
                                        style={{ 
                                            backgroundColor: estudianteSeleccionado.courseStatus === 'Upcoming' ? '#fef3c7' : '#e6f4ea',
                                            color: estudianteSeleccionado.courseStatus === 'Upcoming' ? '#d97706' : '#1e7e34',
                                            fontWeight: 600,
                                            marginTop: '8px'
                                        }} 
                                    />
                                </div>
                            </div>

                            <div className="modal-course-info">
                                <Typography variant="caption" className="modal-course-title">Información del Curso</Typography>
                                <div className="modal-course-details">
                                    <div>
                                        <Typography variant="body2" className="detail-label">Curso Inscrito</Typography>
                                        <Typography variant="body1" className="detail-value">{estudianteSeleccionado.courseName}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="body2" className="detail-label">Nivel</Typography>
                                        <Typography variant="body1" className="detail-value">{estudianteSeleccionado.level}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="body2" className="detail-label">Idioma</Typography>
                                        <Typography variant="body1" className="detail-value-cap">{estudianteSeleccionado.language}</Typography>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-stats-grid">
                                <Paper elevation={0} className="modal-stat-paper">
                                    <Typography variant="caption" className="modal-stat-label">Horas Acreditadas</Typography>
                                    <Typography variant="body1" className="modal-stat-value">{estudianteSeleccionado.horasTotales}</Typography>
                                </Paper>
                                <Paper elevation={0} className="modal-stat-paper">
                                    <Typography variant="caption" className="modal-stat-label">Última Sesión</Typography>
                                    <Typography variant="body1" className="modal-stat-value">{estudianteSeleccionado.ultimaSesion}</Typography>
                                </Paper>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}