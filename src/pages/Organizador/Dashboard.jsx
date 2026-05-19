import { useState, useEffect } from 'react';
import { CalendarWidget } from "../../components/CalendarWidget";
import '../../styles/App.css';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import CloseIcon from '@mui/icons-material/Close';
import { Box, Typography, Avatar, Paper, Dialog, IconButton } from '@mui/material';

const getNotifStyle = (type) => {
    switch(type) {
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'SesionRevisada': return { icon: <CheckCircleIcon />, bg: '#dcfce7', color: '#16a34a' };
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#f3e8ff', color: '#9333ea' };
        case 'AlertaAdmin': return { icon: <NotificationsActiveIcon />, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

const getStatIcon = (title) => {
    if (title.includes('Estudiantes')) return <PeopleIcon style={{ color: '#3b82f6' }} />;
    if (title.includes('Tutores')) return <SchoolIcon style={{ color: '#8b5cf6' }} />;
    if (title.includes('Cursos')) return <ClassIcon style={{ color: '#10b981' }} />;
    return <PeopleIcon />;
};

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const adminId = user?.ID;

    const [stats, setStats] = useState([
        { title: "Estudiantes Activos", amount: 0 },
        { title: "Tutores Activos", amount: 0 },
        { title: "Cursos Activos", amount: 0 }
    ]);
    const [notificaciones, setNotificaciones] = useState([]);

    const [openNotifModal, setOpenNotifModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);

    const fetchData = async () => {
        if (!adminId) return;
        try {
            const resStats = await fetch('http://localhost:8000/api/admin/dashboard-summary');
            const dataStats = await resStats.json();
            if (dataStats.success) setStats(dataStats.stats);

            const resNotif = await fetch(`http://localhost:8000/api/admin/notificaciones/${adminId}`);
            const dataNotif = await resNotif.json();
            if (dataNotif.success) setNotificaciones(dataNotif.notificaciones);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [adminId]);

    const handleOpenNotification = async (notif) => {
        setSelectedNotif(notif);
        setOpenNotifModal(true);

        if (!notif.IsRead) {
            try {
                await fetch(`http://localhost:8000/api/admin/notificaciones/leer/${notif.NotificationID}`, { method: 'PUT' });
                setNotificaciones(prev => prev.map(n => n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n));
            } catch (error) { console.error(error); }
        }
    };

    return (
        <div className="mainContent">

        <h2 id="Title">Panel Principal</h2>
        <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está el resumen general de FasTalk.</p>

        <div className="dashboard-cards-grid">
            {stats.map((stat, index) => (
            <div key={index} className="dash-card">
                <div className="dash-card-header">
                <h1>{stat.title}</h1>
                <span className="icon-wrapper" style={{ backgroundColor: '#f8fafc', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                    {getStatIcon(stat.title)}
                </span>
                </div>
                
                <div className="stat-container">
                <span className="stat-number">{stat.amount}</span>
                <span className="stat-label">Total en sistema</span>
                </div>
                
                <p className="card-footer-text" style={{ color: '#64748b' }}>Cálculo en tiempo real</p>
            </div>
            ))}
        </div>

        <div className="bottomSection">
            <div className="recentActivity">
            <h2 style={{ marginBottom: '15px' }}>Actividad Reciente</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notificaciones.length > 0 ? notificaciones.map((item) => {
                    const style = getNotifStyle(item.Type);
                    const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                    const timeString = localDate.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

                    return (
                        <Paper 
                            key={item.NotificationID} 
                            className={`activity-card ${!item.IsRead ? 'unread' : ''}`} 
                            elevation={0}
                            onClick={() => handleOpenNotification(item)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Avatar style={{ backgroundColor: style.bg, color: style.color }}>
                                {style.icon}
                            </Avatar>

                            <Box className="activity-info">
                                <Typography className="activity-title">{item.Title}</Typography>
                                <Typography className="activity-desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.Message}
                                </Typography>
                            </Box>

                            <Typography className="activity-time">{timeString}</Typography>
                            {!item.IsRead && <div className="unread-dot" style={{ backgroundColor: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', marginLeft: '10px' }}></div>}
                        </Paper>
                    );
                }) : (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                        Aún no hay actividad reciente en el sistema.
                    </p>
                )}
            </div>
            </div>

            <div className="calendar">
            <h2 style={{ marginBottom: '15px' }}>Calendario General</h2>
            <CalendarWidget></CalendarWidget>
            </div>
        </div>

        <Dialog open={openNotifModal} onClose={() => setOpenNotifModal(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
            {selectedNotif && (
                <div style={{ padding: '20px', position: 'relative' }}>
                    <IconButton onClick={() => setOpenNotifModal(false)} style={{ position: 'absolute', right: 10, top: 10 }}>
                        <CloseIcon />
                    </IconButton>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <Avatar style={{ backgroundColor: getNotifStyle(selectedNotif.Type).bg, color: getNotifStyle(selectedNotif.Type).color, width: 50, height: 50 }}>
                            {getNotifStyle(selectedNotif.Type).icon}
                        </Avatar>
                        <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                            {selectedNotif.Title}
                        </Typography>
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
    )
    }