import { studentStats } from "../../data/dataEstudiantes.js";

import { Box, Typography, Avatar, Paper } from '@mui/material';

// Iconos MUI
import LanguageIcon from '@mui/icons-material/Language'; // Nivel actual del idioma aprendiendo
import MovingIcon from '@mui/icons-material/Moving'; // Progreso de sesiones
import PersonIcon from '@mui/icons-material/Person'; // Mi tutor
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation'; // Proxima sesión
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Simulación de avatar

import '../../styles/Estudiante/EstudianteDashboard.css';
import '../../styles/App.css';

const iconMap = {
  nivel_actual: <LanguageIcon />,
  sesions_progress: <MovingIcon />,
  my_tutor: <PersonIcon />,
  next_sesion: <InsertInvitationIcon />
};

export default function EstudianteDashboard() {
  return (
    <div className="mainContent">
      <h2 className="dashboard-title">¡Hola, Mario! Listo para tus sesión de hoy?</h2>
      <p className = "dashboard-subtitle">Bienvenido de vuelta. Aquí esta un resumen de tu inscripción.</p>

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
                    <circle 
                      cx="60" cy="60" r="50" 
                      className="circle-progress-student" 
                      style={{ 
                        strokeDasharray: 314, 
                        strokeDashoffset: 314 - (stat.current / stat.total) * 314 
                      }} 
                    />
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
                    
                    {/* Columna Derecha */}
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
                  <p className="session-date">{stat.date}</p>
                  <p className="session-topic">{stat.topic}</p>
                  <button className="start-session-btn">Unirse a Sesión</button>
                </div>
              )}
            </div>
            
            {stat.footer && <p className="card-footer-text">{stat.footer}</p>}
          </div>
        ))}
      </div>

      <div className="bottomSection-student">
        <div className="recentActivity-student">
          <h2>Recent Activity</h2>
        </div>
      </div>
    </div>
  );
}