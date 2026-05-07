import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { CalendarWidget } from "../../components/CalendarWidget";
import { recentActTutor } from "../../data/dataTutor.js"; 

import VideocamIcon from '@mui/icons-material/Videocam'; 
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
  const user = JSON.parse(localStorage.getItem('user'));
  const tutorId = user?.ID;

  const [dashData, setDashData] = useState({
      name: 'Cargando...',
      totalHours: 0,
      totalStudents: 0,
      nivelesAsignados: 'Cargando...'
  });

  const metaHoras = 120; 

  useEffect(() => {
      const fetchDashboardData = async () => {
          if (!tutorId) return;
          try {
              const response = await fetch(`http://localhost:8000/api/tutor/dashboard/${tutorId}`);
              const result = await response.json();
              if (result.success) {
                  setDashData(result.data);
              }
          } catch (error) {
              console.error("Error cargando dashboard:", error);
          }
      };
      fetchDashboardData();
  }, [tutorId]);

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
              <circle 
                cx="50" cy="50" r="40" 
                className="circle-progress" 
                style={{ strokeDasharray: 251.2, strokeDashoffset: strokeDashoffset }} 
              />
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
          <div className="session-details">
            <p className="session-date">Hoy, 4:00 PM</p>
            <p className="session-student">con Luis Eduardo Martínez</p>
            <button className="start-session-btn">Unirse a Sesión</button>
          </div>
        </div>
      </div>

      <div className="bottomSection">
        <div className="recentActivity">
          <h2>Actividad Reciente</h2>
          {recentActTutor.map((item) => (
            <Paper key={item.id} className="activity-card" elevation={0}>
              <Avatar className="activity-avatar" style={{ backgroundColor: item.bgColor, color: item.color }}>
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