import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Dialog, IconButton, Button } from '@mui/material';
import { CalendarWidget } from "../../components/CalendarWidget";

import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';

import '../../styles/Tutor/TutorDashboard.css';
import '../../styles/App.css';

const getNotifStyle = (type) => {
    switch(type) {
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'ReporteIncidencia': return { icon: <AssignmentTurnedInIcon />, bg: '#fee2e2', color: '#ef4444' };
        case 'SesionRevisada': return { icon: <CheckCircleIcon />, bg: '#dcfce7', color: '#16a34a' };
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#f3e8ff', color: '#9333ea' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

export default function TutorDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const tutorId = user?.ID;

  const [dashData, setDashData] = useState({ name: 'Cargando...', totalHours: 0, totalStudents: 0, nivelesAsignados: 'Cargando...', proximaSesion: null });
  const [notificaciones, setNotificaciones] = useState([]);
  
  const [openNotifModal, setOpenNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const metaHoras = 120; 

  useEffect(() => {
      if (!tutorId) return;
      fetch(`http://localhost:8000/api/tutor/dashboard/${tutorId}`)
          .then(res => res.json())
          .then(result => { if (result.success) setDashData(result.data); });

      fetch(`http://localhost:8000/api/tutor/notificaciones/${tutorId}`)
          .then(res => res.json())
          .then(result => { if (result.success) setNotificaciones(result.notificaciones); });
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
                <p className="session-date" style={{ fontWeight: 'bold' }}>{dashData.proximaSesion.date} a las {dashData.proximaSesion.time}</p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
              {notificaciones.length > 0 ? notificaciones.map((item) => {
                  const style = getNotifStyle(item.Type);
                  const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                  const timeString = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                      <Paper key={item.NotificationID} className={`activity-card ${!item.IsRead ? 'unread' : ''}`} elevation={0} onClick={() => handleOpenNotification(item)}>
                          <Avatar style={{ backgroundColor: style.bg, color: style.color, width: 40, height: 40 }}>
                              {style.icon}
                          </Avatar>
                          <Box className="activity-info">
                              <Typography className="activity-title">{item.Title}</Typography>
                              <Typography className="activity-desc">{item.Message}</Typography>
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
          <h2>Calendario</h2>
          <CalendarWidget />
        </div>
      </div>

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
                  
                  <span className="notif-modal-date">
                      {new Date(selectedNotif.CreatedAt.replace(' ', 'T') + 'Z').toLocaleString()}
                  </span>

                  <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.6, marginBottom: '25px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {selectedNotif.Message}
                  </Typography>
              </div>
          )}
      </Dialog>
    </div>
  );
}