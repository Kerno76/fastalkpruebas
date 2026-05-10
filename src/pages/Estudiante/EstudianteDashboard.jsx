import { useState, useEffect } from 'react';
import { studentStats } from "../../data/dataEstudiantes.js";
import { Box, Typography, Avatar, Paper, Dialog, IconButton, Button } from '@mui/material';

import LanguageIcon from '@mui/icons-material/Language'; 
import MovingIcon from '@mui/icons-material/Moving'; 
import PersonIcon from '@mui/icons-material/Person'; 
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; 
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';

import '../../styles/Estudiante/EstudianteDashboard.css';
import '../../styles/App.css';

const iconMap = {
  nivel_actual: <LanguageIcon />,
  sesions_progress: <MovingIcon />,
  my_tutor: <PersonIcon />,
  next_sesion: <InsertInvitationIcon />
};

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

  const [openNotifModal, setOpenNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
      if (!studentId) return;

      fetch(`http://localhost:8000/api/tutor/notificaciones/${studentId}`)
          .then(res => res.json())
          .then(result => { if (result.success) setNotificaciones(result.notificaciones); });

      fetch(`http://localhost:8000/api/tutor/estudiante/proxima-sesion/${studentId}`) 
          .then(res => res.json())
          .then(result => { if (result.success) setProximaSesion(result.proximaSesion); });

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
      <h2 className="dashboard-title">¡Hola, {user?.Name?.split(' ')[0] || 'Estudiante'}! ¿Listo para tu sesión de hoy?</h2>
      <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está un resumen de tu inscripción.</p>

      <div className="dashboard-cards-grid">
        {studentStats.map((stat) => (
          <div key={stat.id} className="dash-card">
            <div className="dash-card-header">
              <h1>{stat.title}</h1>
              <span className="iconCard">{iconMap[stat.icon]}</span>
            </div>

            <div className="dash-card-body">
              {stat.type === 'language' && (
                <div className="language-display">
                    <h2 className="lang-main-title">{stat.language}</h2>
                    <p className="lang-level-tag">{stat.level}</p>
                    <p className="lang-description">{stat.note}</p>
                </div>
              )}

              {stat.type === 'progress' && (
                <div className="progress-container-student">
                  <svg className="progress-circle-student" width="120" height="120">
                    <circle cx="60" cy="60" r="50" className="circle-bg-student" />
                    <circle cx="60" cy="60" r="50" className="circle-progress-student" style={{ strokeDasharray: 314, strokeDashoffset: 314 - (stat.current / stat.total) * 314 }} />
                  </svg>
                  <div className="progress-text-student">
                    <span className="progress-current-student">{stat.current}</span>
                    <span className="progress-total-student">/ {stat.total}</span>
                  </div>
                </div>
              )}

              {stat.type === 'tutor' && (
                <div className="tutor-row-layout">
                    <Avatar className="student-avatar">
                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                    </Avatar>
                    <div className="tutor-col-info">
                        <h3 className="tutor-name-text">{stat.name}</h3>
                        <div className="tutor-meta-item">
                            <span className="tutor-meta-label">Carrera</span>
                            <span className="tutor-meta-value">{stat.career}</span>
                        </div>
                        <div className="tutor-meta-item">
                            <span className="tutor-meta-label">Especialidad</span>
                            <span className="tutor-meta-value">Inglés Académico</span>
                        </div>
                    </div>
                </div>
              )}

              {stat.type === 'action' && (
                <div className="session-details">
                  {proximaSesion ? (
                      <>
                        <p className="session-date" style={{ fontWeight: 'bold' }}>{proximaSesion.Date} a las {proximaSesion.StartTime}</p>
                        <p className="session-topic">{proximaSesion.Topic}</p>
                        <button className="start-session-btn" onClick={() => window.open(proximaSesion.Url, '_blank')}>Unirse a Sesión</button>
                      </>
                  ) : (
                      <>
                        <p className="session-topic" style={{ color: '#94a3b8' }}>No tienes sesiones agendadas</p>
                        <button className="start-session-btn" disabled style={{ backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }}>Unirse a Sesión</button>
                      </>
                  )}
                </div>
              )}
            </div>
            
            {stat.footer && <p className="card-footer-text">{stat.footer}</p>}
          </div>
        ))}
      </div>

      <div className="bottomSection-student" style={{ marginTop: '30px' }}>
        <div className="recentActivity-student" style={{ width: '100%' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Actividad Reciente</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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