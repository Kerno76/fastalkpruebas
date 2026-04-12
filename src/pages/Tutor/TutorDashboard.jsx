import { tutorStats, recentActTutor } from "../../data/dataTutor.js";
import { CalendarWidget } from "../../components/CalendarWidget";
import { Box, Typography, Avatar, Paper } from '@mui/material';

// Iconos MUI
import VideocamIcon from '@mui/icons-material/Videocam'; // Sesiones
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // Tareas recibidas
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Material subido
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Sesión terminada
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; // Registro de sesión

import '../../styles/Tutor/TutorDashboard.css';
import '../../styles/App.css';

const iconMap = {
  sesion_programada: <EventAvailableIcon />,
  material_subido: <CloudUploadIcon />,
  sesion_terminada: <CheckCircleIcon />,
  tarea_recibida: <AssignmentTurnedInIcon />,
  video: <VideocamIcon />
};

export default function TutorDashboard() {
  return (
    <div className="mainContent">
      <h2 className="dashboard-title">Panel de TutorTEC</h2>
      <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está tu resumen de actividades.</p>

      <div className="dashboard-cards-grid">
        {tutorStats.map((stat) => (
          <div key={stat.id} className="dash-card">
            <div className="dash-card-header">
              <h1>{stat.title}</h1>
              <span className={`icon-wrapper ${stat.colorClass}`}>{stat.icon}</span>
            </div>

            {stat.type === 'progress' && (
              <div className="progress-container">
                <svg className="progress-circle" width="100" height="100">
                  <circle cx="50" cy="50" r="40" className="circle-bg" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="circle-progress" 
                    style={{ strokeDasharray: 251.2, strokeDashoffset: 251.2 - (stat.current / stat.total) * 251.2 }} 
                  />
                </svg>
                <div className="progress-text">
                  <span className="progress-current">{stat.current}</span>
                  <span className="progress-total">/ {stat.total} hrs</span>
                </div>
              </div>
            )}

            {stat.type === 'stat' && (
              <div className="stat-container">
                <span className="stat-number">{stat.amount}</span>
                <span className="stat-label">{stat.subtitle}</span>
              </div>
            )}

            {stat.type === 'action' && (
              <div className="session-details">
                <p className="session-date">{stat.date}</p>
                <p className="session-student">{stat.student}</p>
                <button className="start-session-btn">Unirse a Sesión</button>
              </div>
            )}
            
            {stat.footer && <p className="card-footer-text">{stat.footer}</p>}
          </div>
        ))}
      </div>

      <div className="bottomSection">
        <div className="recentActivity">
          <h2>Recent Activity</h2>
          {recentActTutor.map((item) => (
            <Paper key={item.id} className="activity-card" elevation={0}>
              <Avatar 
                className="activity-avatar" 
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                {iconMap[item.type]}
              </Avatar>
              <Box className="activity-info">
                <Typography className="activity-title">{item.title}</Typography>
                <Typography className="activity-desc">{item.description}</Typography>
              </Box>
              <Typography className="activity-time">{item.time}</Typography>
            </Paper>
          ))}
        </div>

        <div className="calendar">
          <h2>Calendario</h2>
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}