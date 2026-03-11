import React from 'react';
import '../styles/TutorDashboard.css';
import '../styles/App.css';
import { CalendarWidget } from "../components/CalendarWidget"

export function TutorDashboard() {
  // Datos hardcodeados de ejemplo
  const horasCompletadas = 45;
  const horasMeta = 120;
  const porcentajeHoras = (horasCompletadas / horasMeta) * 100;
  
  const radio = 40;
  const circunferencia = 2 * Math.PI * radio;
  const dashoffset = circunferencia - (porcentajeHoras / 100) * circunferencia;

  return (
    <div className="tutor-dashboard-container">
      <h2 className="dashboard-title">Panel de TutorTEC</h2>
      <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está tu resumen de actividades.</p>

      <div className="dashboard-cards-grid">
        
        <div className="dash-card">
          <div className="dash-card-header">
            <h1>Horas Acreditadas</h1>
            <span className="icon-wrapper blue-icon">⏱️</span>
          </div>
          <div className="progress-container">
            <svg className="progress-circle" width="100" height="100">
              {/* Círculo de fondo (gris claro) */}
              <circle cx="50" cy="50" r={radio} className="circle-bg" />
              {/* Círculo de progreso (azul) */}
              <circle 
                cx="50" 
                cy="50" 
                r={radio} 
                className="circle-progress" 
                style={{ 
                  strokeDasharray: circunferencia, 
                  strokeDashoffset: dashoffset 
                }} 
              />
            </svg>
            <div className="progress-text">
              <span className="progress-current">{horasCompletadas}</span>
              <span className="progress-total">/ {horasMeta} hrs</span>
            </div>
          </div>
          <p className="card-footer-text">Progreso de Servicio Social</p>
        </div>

        {/* Tarjeta 2: Mis Beneficiarios */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h1>Mis Beneficiarios</h1>
            <span className="icon-wrapper green-icon">👥</span>
          </div>
          <div className="stat-container">
            <span className="stat-number">3</span>
            <span className="stat-label">Alumnos Activos</span>
          </div>
          <p className="card-footer-text">Niveles A2 y B1 asignados</p>
        </div>

        {/* Tarjeta 3: Próxima Sesión */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h1>Próxima Sesión</h1>
            <span className="icon-wrapper purple-icon">🗓️</span>
          </div>
          <div className="session-details">
            <p className="session-date">Hoy, 4:00 PM</p>
            <p className="session-student">con Luis Eduardo Martínez</p>
          </div>
          <button className="button button-primary start-session-btn">
            Unirse a Sesión
          </button>
        </div>
      </div>

      <div className="bottomSection">
        <div className="recentActivity">
          <h2>Recent Activity</h2>
        </div>
      
        <div className="calendar">
          <h2>Calendario</h2>
          <CalendarWidget></CalendarWidget>
        </div>
      </div>

    </div>
  );
}