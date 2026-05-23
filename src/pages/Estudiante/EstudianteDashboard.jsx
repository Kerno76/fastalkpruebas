import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Dialog, IconButton, Chip } from '@mui/material';
import { CalendarWidget } from "../../components/CalendarWidget";

import LanguageIcon from '@mui/icons-material/Language'; 
import PersonIcon from '@mui/icons-material/Person'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; 
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment'; 
import StarIcon from '@mui/icons-material/Star';
import ClassIcon from '@mui/icons-material/Class';
import EventNoteIcon from '@mui/icons-material/EventNote';
import toast from 'react-hot-toast';

import '../../styles/Estudiante/EstudianteDashboard.css';
import '../../styles/App.css';

const getNotifStyle = (type) => {
    switch(type) {
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'AlertaAdmin': return { icon: <NotificationsActiveIcon />, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

    export default function EstudianteDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const studentId = user?.ID;

    const [notificaciones, setNotificaciones] = useState([]);
    const [proximaSesion, setProximaSesion] = useState(null);
    const [ultimaCalificacion, setUltimaCalificacion] = useState(null);
    
    const [summaryData, setSummaryData] = useState({
        language: 'Cargando...',
        level: '...',
        courseName: '...',
        tutor: { name: 'Cargando...', career: '...' },

        pendingTasks: 0,
        submittedTasks: 0,
        missingTasks: 0
    });

    const [openNotifModal, setOpenNotifModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);

    // Estados del Calendario Unificado
    const [eventosBD, setEventosBD] = useState([]);
    const [fechasConEventos, setFechasConEventos] = useState([]); 
    const [openEventModal, setOpenEventModal] = useState(false);
    const [eventosDelDia, setEventosDelDia] = useState([]);
    const [fechaSeleccionada, setFechaSeleccionada] = useState('');

    const fetchData = async () => {
        if (!studentId) return;

        fetch(`http://localhost:8000/api/tutor/notificaciones/${studentId}`)
            .then(res => res.json())
            .then(result => { if (result.success) setNotificaciones(result.notificaciones); });

        fetch(`http://localhost:8000/api/student/estudiante/proxima-sesion/${studentId}`) 
            .then(res => res.json())
            .then(result => { if (result.success) setProximaSesion(result.proximaSesion); });

        fetch(`http://localhost:8000/api/student/dashboard-summary/${studentId}`)
            .then(res => res.json())
            .then(result => { 
                if (result.success) {
                    setSummaryData(prev => ({
                        ...result.summary,
                        level: result.summary.level || prev.level,
                        language: result.summary.language || prev.language
                    }));
                }
            });

        fetch(`http://localhost:8000/api/student/ultima-calificacion/${studentId}`)
            .then(res => res.json())
            .then(result => { if (result.success) setUltimaCalificacion(result.data); });

        fetch(`http://localhost:8000/api/student/eventos-calendario/${studentId}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setEventosBD(result.eventos);
                    const fechasUnicas = [...new Set(result.eventos.map(e => e.date))];
                    setFechasConEventos(fechasUnicas);
                }
            });
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [studentId]);

    const handleOpenNotification = async (notif) => {
        setSelectedNotif(notif);
        setOpenNotifModal(true);

        if (!notif.IsRead) {
            try {
                await fetch(`http://localhost:8000/api/tutor/notificaciones/leer/${notif.NotificationID}`, { method: 'PUT' });
                setNotificaciones(prev => prev.map(n => n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n));
            } catch (error) {}
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
            toast('No tienes clases ni entregas programadas para este día.', { icon: 'ℹ️' });
        }
    };

    return (
        <div className="mainContent">
        <h2 className="dashboard-title">¡Hola, {user?.Name?.split(' ')[0] || 'Estudiante'}! ¿Listo para aprender hoy?</h2>
        <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está un resumen de tu inscripción y actividades.</p>

        <div className="dashboard-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            
            <div className="dash-card" style={{ backgroundColor: ultimaCalificacion ? (ultimaCalificacion.grade >= 70 ? '#f0fdf4' : '#fef2f2') : '#fff', border: ultimaCalificacion ? (ultimaCalificacion.grade >= 70 ? '1px solid #bbf7d0' : '1px solid #fecaca') : '1px solid #e2e8f0' }}>
            <div className="dash-card-header">
                <h1>Última Calificación</h1>
                <span className="iconCard" style={{ backgroundColor: ultimaCalificacion ? (ultimaCalificacion.grade >= 70 ? '#dcfce3' : '#fee2e2') : '#f1f5f9', color: ultimaCalificacion ? (ultimaCalificacion.grade >= 70 ? '#16a34a' : '#ef4444') : '#475569' }}><StarIcon /></span>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                {ultimaCalificacion ? (
                    <>
                        <Typography style={{ fontSize: '3.5rem', fontWeight: 'bold', color: ultimaCalificacion.grade >= 70 ? '#16a34a' : '#ef4444', lineHeight: 1 }}>
                            {ultimaCalificacion.grade}
                        </Typography>
                        <Typography style={{ color: ultimaCalificacion.grade >= 70 ? '#15803d' : '#991b1b', marginTop: '10px', fontWeight: 800, textAlign: 'center' }}>
                            Curso: "{ultimaCalificacion.courseName}"
                        </Typography>
                        <Typography style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: '5px' }}>
                            {ultimaCalificacion.grade >= 70 ? '¡Aprobaste el curso!' : 'Necesitas repasar este nivel.'}
                        </Typography>
                    </>
                ) : (
                    <Typography style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                        Aún no tienes calificaciones finales registradas.
                    </Typography>
                )}
            </div>
            </div>

            <div className="dash-card">
            <div className="dash-card-header">
                <h1>Nivel actual</h1>
                <span className="iconCard"><LanguageIcon /></span>
            </div>
            <div className="dash-card-body">
                <div className="language-display">
                    <h2 className="lang-main-title">{summaryData.language}</h2>
                    <p className="lang-level-tag">{summaryData.level}</p>
                    <p className="lang-description" style={{ marginTop: '10px', color: '#64748b' }}>Curso: {summaryData.courseName}</p>
                </div>
            </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h1>Tareas</h1>
                    <span className="iconCard">
                        <AssignmentIcon />
                    </span>
                </div>

                <div
                    className="dash-card-body"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        paddingTop: '10px'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                    >
                        <div>
                            <Typography style={{ fontWeight: 700, color: '#991b1b' }}>
                                Pendientes
                            </Typography>

                            <Typography style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                                Aún por entregar
                            </Typography>
                        </div>

                        <Typography
                            style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: '#ef4444'
                            }}
                        >
                            {summaryData.pendingTasks}
                        </Typography>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                    >
                        <div>
                            <Typography style={{ fontWeight: 700, color: '#166534' }}>
                                Entregadas
                            </Typography>

                            <Typography style={{ fontSize: '0.8rem', color: '#166534' }}>
                                Ya enviadas
                            </Typography>
                        </div>

                        <Typography
                            style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: '#16a34a'
                            }}
                        >
                            {summaryData.submittedTasks}
                        </Typography>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fff7ed',
                            border: '1px solid #fdba74',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                    >
                        <div>
                            <Typography style={{ fontWeight: 700, color: '#9a3412' }}>
                                Sin entregar
                            </Typography>

                            <Typography style={{ fontSize: '0.8rem', color: '#9a3412' }}>
                                Fecha vencida
                            </Typography>
                        </div>

                        <Typography
                            style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: '#ea580c'
                            }}
                        >
                            {summaryData.missingTasks}
                        </Typography>
                    </div>

                </div>
            </div>

            <div className="dash-card">
            <div className="dash-card-header">
                <h1>Mi tutor</h1>
                <span className="iconCard"><PersonIcon /></span>
            </div>
            <div className="dash-card-body">
                <div className="tutor-row-layout">
                    <Avatar className="student-avatar">
                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                    </Avatar>
                    <div className="tutor-col-info">
                        <h3 className="tutor-name-text">{summaryData.tutor.name}</h3>
                        <div className="tutor-meta-item">
                            <span className="tutor-meta-label">Carrera</span>
                            <span className="tutor-meta-value">{summaryData.tutor.career}</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
            
            <div className="recentActivity-student" style={{ flex: 1.2 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>
                    Actividad Reciente
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
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
                                {!item.IsRead && <div className="unread-dot" style={{ backgroundColor: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', marginLeft: '10px' }} />}
                            </Paper>
                        );
                    }) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>Aún no tienes notificaciones.</p>
                    )}
                </div>
            </div>

            <div className="calendar" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>Mi Agenda Escolar</h2>
                </div>
                <Paper elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '10px' }}>
                    <Typography variant="caption" style={{ display: 'block', textAlign: 'center', color: '#94a3b8', marginBottom: '5px' }}>
                        Revisa tus clases programadas y límites de entrega
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
                        <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>Agenda del día</Typography>
                        <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>{fechaSeleccionada}</Typography>
                    </div>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {eventosDelDia.map(e => (
                        <Paper key={e.id} elevation={0} style={{ padding: '15px', backgroundColor: e.type === 'Sesión' ? '#f0f9ff' : '#faf5ff', border: e.type === 'Sesión' ? '1px solid #bae6fd' : '1px solid #e9d5ff', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {e.type === 'Sesión' ? <ClassIcon style={{ color: '#0284c7', fontSize: '1.2rem' }}/> : <AssignmentIcon style={{ color: '#9333ea', fontSize: '1.2rem' }}/>}
                                    
                                    <Typography variant="subtitle1" style={{ fontWeight: 800, color: e.type === 'Sesión' ? '#0369a1' : '#7e22ce' }}>
                                        {e.type === 'Sesión' ? ` CLASE: ${e.title}` : ` TAREA: ${e.title}`}
                                    </Typography>
                                </div>
                                <Chip label={e.time} size="small" style={{ backgroundColor: '#1e293b', color: '#fff', fontWeight: 800 }} />
                            </div>
                            
                            <Typography variant="body2" style={{ color: '#475569', fontWeight: 700, marginBottom: '6px' }}>
                                Curso: <span style={{ fontWeight: 500 }}>{e.course}</span>
                            </Typography>
                            
                            <Typography variant="body2" style={{ color: '#334155', backgroundColor: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <strong>{e.type === 'Sesión' ? 'Detalles de la sesión:' : 'Instrucciones de entrega:'}</strong> {e.description}
                            </Typography>
                        </Paper>
                    ))}
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