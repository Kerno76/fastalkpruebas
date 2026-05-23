import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Dialog, IconButton, Button, Chip } from '@mui/material';
import { CalendarWidget } from "../../components/CalendarWidget";

import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ClassIcon from '@mui/icons-material/Class';
import EventNoteIcon from '@mui/icons-material/EventNote';

import '../../styles/Tutor/TutorDashboard.css';
import '../../styles/App.css';
import toast from 'react-hot-toast';

const getNotifStyle = (type) => {
    switch(type) {
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'ReporteIncidencia': return { icon: <AssignmentTurnedInIcon />, bg: '#fee2e2', color: '#ef4444' };
        case 'SesionRevisada': return { icon: <CheckCircleIcon />, bg: '#dcfce7', color: '#16a34a' };
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#f3e8ff', color: '#9333ea' };
        case 'AlertaAdmin': return { icon: <NotificationsActiveIcon />, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

export default function TutorDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const tutorId = user?.ID;

    const [dashData, setDashData] = useState({ name: 'Cargando...', totalHours: 0, totalStudents: 0, nivelesAsignados: 'Cargando...', proximaSesion: null });
    const [notificaciones, setNotificaciones] = useState([]);
    
    // Estados para la Agenda Unificada
    const [eventosBD, setEventosBD] = useState([]);
    const [fechasConEventos, setFechasConEventos] = useState([]); 
    const [openEventModal, setOpenEventModal] = useState(false);
    const [eventosDelDia, setEventosDelDia] = useState([]);
    const [fechaSeleccionada, setFechaSeleccionada] = useState('');

    const [openNotifModal, setOpenNotifModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);

    const metaHoras = 120; 

    useEffect(() => {
        if (!tutorId) return;

        const fetchData = async () => {
            try {
                const [resDash, resNotif, resSesiones, resTareas] = await Promise.all([
                    fetch(`http://localhost:8000/api/tutor/dashboard/${tutorId}`).then(r => r.json()),
                    fetch(`http://localhost:8000/api/tutor/notificaciones/${tutorId}`).then(r => r.json()),
                    fetch(`http://localhost:8000/api/tutor/sesiones-pendientes/${tutorId}`).then(r => r.json()),
                    fetch(`http://localhost:8000/api/tutor/tareas-calificar/${tutorId}`).then(r => r.json())
                ]);

                if (resDash.success) setDashData(resDash.data);
                if (resNotif.success) setNotificaciones(resNotif.notificaciones);

                let allEvents = [];

                if (resSesiones.success && resSesiones.sesiones.length > 0) {
                    resSesiones.sesiones.forEach(s => {
                        allEvents.push({
                            id: `ses_${s.SessionID}`,
                            type: 'Sesión',
                            title: s.Topic,
                            date: s.Date,
                            time: s.StartTime?.substring(0, 5) || '',
                            course: s.courseName,
                            description: s.Description || 'Sesión virtual de clase.'
                        });
                    });
                }

                if (resTareas.success && resTareas.publicadas.length > 0) {
                    resTareas.publicadas.forEach(t => {
                        if (t.CourseStatus === 'Active' || t.CourseStatus === 'Upcoming') {
                            if (t.Deadline) {
                                const [dDate, dTime] = t.Deadline.split('T');
                                allEvents.push({
                                    id: `tar_${t.CourseID}_${t.Title}`,
                                    type: 'Tarea',
                                    title: t.Title,
                                    date: dDate,
                                    time: dTime ? dTime.substring(0, 5) : '23:59',
                                    course: t.CourseName,
                                    description: t.Description || 'Límite de entrega de tarea.'
                                });
                            }
                        }
                    });
                }

                setEventosBD(allEvents);
                const fechasUnicas = [...new Set(allEvents.map(e => e.date))];
                setFechasConEventos(fechasUnicas);

            } catch (err) {
                console.error("Error cargando dashboard del tutor:", err);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [tutorId]);

    const handleOpenNotification = async (notif) => {
        setSelectedNotif(notif);
        setOpenNotifModal(true);
        if (!notif.IsRead) {
            try {
                await fetch(`http://localhost:8000/api/tutor/notificaciones/leer/${notif.NotificationID}`, { method: 'PUT' });
                setNotificaciones(prev => prev.map(n => n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n));
            } catch (error) { console.error(error); }
        }
    };

    const handleDateSelect = (newDate) => {
        const fechaFormateada = (newDate && typeof newDate.format === 'function') ? newDate.format('YYYY-MM-DD') : '';
        setFechaSeleccionada(fechaFormateada);

        const eventosHoy = eventosBD.filter(e => e.date === fechaFormateada);
        
        if (eventosHoy.length > 0) {
            setEventosDelDia(eventosHoy);
            setOpenEventModal(true);
        } else {
            toast('No hay sesiones ni tareas para este día.', { icon: 'ℹ️' });
        }
    };

    const progressRatio = Math.min(dashData.totalHours / metaHoras, 1);
    const strokeDashoffset = 251.2 - (progressRatio * 251.2);

    return (
        <div className="mainContent">
            <h2 className="dashboard-title">Panel de {dashData.name} | TutorTEC</h2>
            <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está tu resumen de actividades.</p>

            <div className="dashboard-cards-grid">
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h1>Horas Acreditadas</h1>
                        <span className="icon-wrapper blue-icon"><AccessTimeIcon /></span>
                    </div>
                    <div className="progress-container">
                        <svg className="progress-circle" width="100" height="100">
                            <circle cx="50" cy="50" r="40" className="circle-bg" />
                            <circle cx="50" cy="50" r="40" className="circle-progress" style={{ strokeDasharray: 251.2, strokeDashoffset: strokeDashoffset }} />
                        </svg>
                        <div className="progress-text">
                            <span className="progress-current">{dashData.totalHours}</span>
                            <span className="progress-total">/ {metaHoras} hrs</span>
                        </div>
                    </div>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h1>Mis Beneficiarios</h1>
                        <span className="icon-wrapper green-icon"><PeopleIcon /></span>
                    </div>
                    <div className="stat-container">
                        <span className="stat-number">{dashData.totalStudents}</span>
                        <span className="stat-label">Alumnos Activos</span>
                    </div>
                    <p className="card-footer-text">
                        Niveles {dashData.nivelesAsignados} asignados
                    </p>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header">
                        <h1>Próxima Sesión</h1>
                        <span className="icon-wrapper purple-icon"><EventAvailableIcon /></span>
                    </div>
                    {dashData.proximaSesion ? (
                        <div className="session-details">
                            <p className="session-date" style={{ fontWeight: 'bold' }}>{dashData.proximaSesion.date} a las {dashData.proximaSesion.time.substring(0,5)}</p>
                            <p className="session-student">Con: {dashData.proximaSesion.student}</p>
                            <button className="start-session-btn" onClick={() => window.open(dashData.proximaSesion.url, '_blank')}>Unirse a Sesión</button>
                        </div>
                    ) : (
                        <div className="session-details" style={{ textAlign: 'center', marginTop: '15px' }}>
                            <p className="session-date" style={{ color: '#94a3b8' }}>No tienes sesiones pendientes</p>
                            <button className="start-session-btn" disabled style={{ backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }}>Unirse a Sesión</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bottomSection">
                <div className="recentActivity">
                    <h2>Actividad Reciente</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', maxHeight: '450px', overflowY: 'auto', paddingRight: '6px' }}>
                        {notificaciones.length > 0 ? notificaciones.map((item) => {
                            const style = getNotifStyle(item.Type);
                            const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                            const timeString = localDate.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

                            return (
                                <Paper 
                                    key={item.NotificationID} className={`activity-card ${!item.IsRead ? 'unread' : ''}`}
                                    elevation={0} onClick={() => handleOpenNotification(item)} style={{ cursor: 'pointer' }}
                                >
                                    <Avatar style={{ backgroundColor: style.bg, color: style.color, width: 40, height: 40 }}>{style.icon}</Avatar>
                                    <Box className="activity-info">
                                        <Typography className="activity-title">{item.Title}</Typography>
                                        <Typography className="activity-desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.Message}</Typography>
                                    </Box>
                                    <Typography className="activity-time">{timeString}</Typography>
                                    {!item.IsRead && <div className="unread-dot"></div>}
                                </Paper>
                            );
                        }) : (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No hay actividad reciente.</p>
                        )}
                    </div>
                </div>

                <div className="calendar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0 }}>Agenda Virtual</h2>
                    </div>
                    <Paper elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '10px' }}>
                        <Typography variant="caption" style={{ display: 'block', textAlign: 'center', color: '#94a3b8', marginBottom: '5px' }}>
                            Haz clic en un día marcado para ver tus clases o entregas
                        </Typography>
                        <CalendarWidget fechasAgendadas={fechasConEventos} onDateSelect={handleDateSelect} />
                    </Paper>
                </div>
            </div>

            <Dialog open={openEventModal} onClose={() => setOpenEventModal(false)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '20px', padding: '15px' } }}>
                <div style={{ padding: '20px', position: 'relative' }}>
                    <IconButton onClick={() => setOpenEventModal(false)} style={{ position: 'absolute', right: 0, top: 0, color: '#94a3b8' }}>
                        <CloseIcon />
                    </IconButton>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Avatar style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}><EventNoteIcon /></Avatar>
                        <div>
                            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>Informe del día</Typography>
                            <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>{fechaSeleccionada}</Typography>
                        </div>
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {eventosDelDia.map(e => (
                            <Paper key={e.id} elevation={0} style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {e.type === 'Sesión' ? <ClassIcon style={{ color: '#3b82f6', fontSize: '1.2rem' }}/> : <AssignmentIcon style={{ color: '#8b5cf6', fontSize: '1.2rem' }}/>}
                                        
                                        <Typography variant="subtitle1" style={{ fontWeight: 800, color: '#0f172a' }}>{e.title}</Typography>
                                        
                                        <Chip 
                                            label={e.type === 'Sesión' ? 'Reunión' : 'Tarea'} 
                                            size="small" 
                                            style={{ 
                                                height: '20px', 
                                                fontSize: '0.7rem', 
                                                backgroundColor: e.type === 'Sesión' ? '#dbeafe' : '#f3e8ff', 
                                                color: e.type === 'Sesión' ? '#2563eb' : '#9333ea',
                                                fontWeight: 800,
                                                marginLeft: '4px'
                                            }} 
                                        />
                                    </div>

                                    <Chip label={e.time} size="small" style={{ backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 800 }} />
                                </div>
                                
                                <Typography variant="body2" style={{ color: '#0369a1', fontWeight: 700, marginBottom: '4px' }}>Curso: {e.course}</Typography>
                                <Typography variant="body2" style={{ color: '#475569' }}>{e.description}</Typography>
                            </Paper>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            * Para editar o cancelar, ve a "Registro de Sesiones" o "Centro de Tareas".
                        </Typography>
                    </div>
                </div>
            </Dialog>

            <Dialog open={openNotifModal} onClose={() => setOpenNotifModal(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
                {selectedNotif && (
                    <div style={{ padding: '20px', position: 'relative' }}>
                        <IconButton onClick={() => setOpenNotifModal(false)} style={{ position: 'absolute', right: 10, top: 10 }}><CloseIcon /></IconButton>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <Avatar style={{ backgroundColor: getNotifStyle(selectedNotif.Type).bg, color: getNotifStyle(selectedNotif.Type).color, width: 50, height: 50 }}>
                                {getNotifStyle(selectedNotif.Type).icon}
                            </Avatar>
                            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{selectedNotif.Title}</Typography>
                        </div>
                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-start' }}>
                            <Typography variant="caption" style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                {new Date(selectedNotif.CreatedAt.replace(' ', 'T') + 'Z').toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                            </Typography>
                        </div>
                        <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.6, marginBottom: '25px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {selectedNotif.Message}
                        </Typography>
                    </div>
                )}
            </Dialog>
        </div>
    );
}