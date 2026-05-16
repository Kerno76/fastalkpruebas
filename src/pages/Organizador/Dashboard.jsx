import { useState, useEffect } from 'react';
import { CalendarWidget } from "../../components/CalendarWidget";
import '../../styles/App.css';

// Importamos iconos dinámicos
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import { Box, Typography, Avatar, Paper } from '@mui/material';

// Función para mapear el icono y colores correctos según la notificación
const getNotifStyle = (type) => {
    switch(type) {
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'SesionRevisada': return { icon: <CheckCircleIcon />, bg: '#dcfce7', color: '#16a34a' };
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#f3e8ff', color: '#9333ea' };
        case 'AlertaAdmin': return { icon: <NotificationsActiveIcon />, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

// Función para mapear el icono de las tarjetas superiores
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

  const fetchData = async () => {
      if (!adminId) return;
      try {
          // 1. Obtener las métricas globales
          const resStats = await fetch('http://localhost:8000/api/admin/dashboard-summary');
          const dataStats = await resStats.json();
          if (dataStats.success) setStats(dataStats.stats);

          // 2. Obtener las notificaciones recientes
          const resNotif = await fetch(`http://localhost:8000/api/admin/notificaciones/${adminId}`);
          const dataNotif = await resNotif.json();
          if (dataNotif.success) setNotificaciones(dataNotif.notificaciones);
      } catch (error) {
          console.error("Error cargando dashboard:", error);
      }
  };

  useEffect(() => {
      fetchData();
      // Actualizamos automáticamente cada 30 segundos
      const intervalId = setInterval(fetchData, 30000);
      return () => clearInterval(intervalId);
  }, [adminId]);

  // Si hacen clic en una notificación que no han leído, la marcamos como leída en la BD
  const handleLeerNotificacion = async (notif) => {
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
                  // Convertimos la hora de UTC a Local
                  const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                  const timeString = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                      <Paper 
                          key={item.NotificationID} 
                          className={`activity-card ${!item.IsRead ? 'unread' : ''}`} 
                          elevation={0}
                          onClick={() => handleLeerNotificacion(item)}
                          style={{ cursor: !item.IsRead ? 'pointer' : 'default' }}
                      >
                          <Avatar style={{ backgroundColor: style.bg, color: style.color }}>
                              {style.icon}
                          </Avatar>

                          <Box className="activity-info">
                              <Typography className="activity-title">{item.Title}</Typography>
                              <Typography className="activity-desc">{item.Message}</Typography>
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
    </div>
  )
}