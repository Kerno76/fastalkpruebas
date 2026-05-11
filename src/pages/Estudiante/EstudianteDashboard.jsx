import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Dialog, IconButton } from '@mui/material';

import LanguageIcon from '@mui/icons-material/Language'; 
import PersonIcon from '@mui/icons-material/Person'; 
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; 
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment'; 

import '../../styles/Estudiante/EstudianteDashboard.css';
import '../../styles/App.css';

const getNotifStyle = (type) => {
    switch(type) {
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#e0f2fe', color: '#0284c7' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

export default function EstudianteDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const studentId = user?.ID;

  const [notificaciones, setNotificaciones] = useState([]);
  const [proximaSesion, setProximaSesion] = useState(null);
  
  const [summaryData, setSummaryData] = useState({
      language: 'Cargando...',
      level: '...',
      courseName: '...',
      tutor: { name: 'Cargando...', career: '...' },
      pendingTasks: 0
  });

  const [openNotifModal, setOpenNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
      if (!studentId) return;

      fetch(`http://localhost:8000/api/tutor/notificaciones/${studentId}`)
          .then(res => res.json())
          .then(result => { if (result.success) setNotificaciones(result.notificaciones); });

      fetch(`http://localhost:8000/api/student/estudiante/proxima-sesion/${studentId}`) 
          .then(res => res.json())
          .then(result => { if (result.success) setProximaSesion(result.proximaSesion); });

      fetch(`http://localhost:8000/api/student/dashboard-summary/${studentId}`)
          .then(res => res.json())
          .then(result => { if (result.success) setSummaryData(result.summary); });

  }, [studentId]);

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

  return (
    <div className="mainContent">
      <h2 className="dashboard-title">¡Hola, {user?.Name?.split(' ')[0] || 'Estudiante'}! ¿Listo para aprender hoy?</h2>
      <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está un resumen de tu inscripción y actividades.</p>

      <div className="dashboard-cards-grid">
        
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
            <h1>Tareas Pendientes</h1>
            <span className="iconCard"><AssignmentIcon /></span>
          </div>
          <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
            <Typography style={{ fontSize: '3.5rem', fontWeight: 'bold', color: summaryData.pendingTasks > 0 ? '#ef4444' : '#10b981', lineHeight: 1 }}>
                {summaryData.pendingTasks}
            </Typography>
            <Typography style={{ color: '#64748b', marginTop: '10px', fontWeight: 600 }}>
                {summaryData.pendingTasks === 1 ? 'Asignación por entregar' : 'Asignaciones por entregar'}
            </Typography>
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

        <div className="dash-card">
          <div className="dash-card-header">
            <h1>Siguiente sesión</h1>
            <span className="iconCard"><InsertInvitationIcon /></span>
          </div>
          <div className="dash-card-body">
            <div className="session-details">
              {proximaSesion ? (
                  <>
                    <p className="session-date" style={{ fontWeight: 'bold' }}>{proximaSesion.Date} a las {proximaSesion.StartTime}</p>
                    <p className="session-topic">{proximaSesion.Topic}</p>
                    <button className="start-session-btn" onClick={() => window.open(proximaSesion.Url, '_blank')}>Unirse a Sesión</button>
                  </>
              ) : (
                  <>
                    <p className="session-topic" style={{ color: '#94a3b8' }}>No tienes sesiones agendadas para hoy.</p>
                    <button className="start-session-btn" disabled style={{ backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }}>Unirse a Sesión</button>
                  </>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="bottomSection-student" style={{ marginTop: '30px' }}>
        <div className="recentActivity-student" style={{ width: '100%' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Actividad Reciente</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notificaciones.length > 0 ? notificaciones.map((item) => {
                  const style = getNotifStyle(item.Type);
                  const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                  const timeString = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = localDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });

                  return (
                      <Paper key={item.NotificationID} className={`activity-card ${!item.IsRead ? 'unread' : ''}`} elevation={0} onClick={() => handleOpenNotification(item)}>
                          <Avatar style={{ backgroundColor: style.bg, color: style.color, width: 40, height: 40 }}>
                              {style.icon}
                          </Avatar>
                          <Box className="activity-info">
                              <Typography className="activity-title">{item.Title}</Typography>
                              <Typography className="activity-desc">{item.Message}</Typography>
                          </Box>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography className="activity-time" style={{ fontWeight: 600 }}>{timeString}</Typography>
                              <Typography style={{ fontSize: '0.75rem', color: '#64748b' }}>{dateString}</Typography>
                          </div>
                          {!item.IsRead && <div className="unread-dot"></div>}
                      </Paper>
                  );
              }) : (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>Aún no tienes notificaciones.</p>
              )}
          </div>
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
                  <span className="notif-modal-date">{new Date(selectedNotif.CreatedAt.replace(' ', 'T') + 'Z').toLocaleString()}</span>
                  <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.6, marginBottom: '25px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {selectedNotif.Message}
                  </Typography>
              </div>
          )}
      </Dialog>
    </div>
  );
}