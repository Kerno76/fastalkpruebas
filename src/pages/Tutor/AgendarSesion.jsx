import { useState } from 'react';
import '../../styles/App.css';
import '../../styles/Config.css'; 

export default function AgendarSesion() {
  const [sesion, setSesion] = useState({
    curso: '', fecha: '', horaInicio: '', horaFin: '', tema: '', enlaceZoom: ''
  });

  const handleChange = (e) => {
    setSesion({ ...sesion, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Clase agendada y anunciada con éxito!');
    console.log("Datos a enviar al backend:", sesion);
  };

  return (
    <div className="mainContent">
      <h2 id="Title">Agendar Clase</h2>
      <p className="dashboard-subtitle">Programa tus próximas sesiones y notifica a tus alumnos.</p>

      <div className="settingsPanel" style={{ display: 'block', padding: '20px', marginTop: '10px' }}>
        <div className="settingsThings">
          <form onSubmit={handleSubmit}>
            <div className="formGrid">
              
              <div className="formField">
                <label>Curso / Grupo</label>
                <select className="select-field" name="curso" onChange={handleChange} required>
                  <option value="">Selecciona el curso...</option>
                  <option value="1">English - Beginner</option>
                  <option value="2">French - Advanced</option>
                </select>
              </div>

              <div className="formField">
                <label>Tema principal</label>
                <input type="text" name="tema" placeholder="Ej. Verb To Be / Passé Composé" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Fecha de la clase</label>
                <input type="date" name="fecha" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Hora de inicio</label>
                <input type="time" name="horaInicio" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Hora de fin</label>
                <input type="time" name="horaFin" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Enlace de Zoom</label>
                <input type="url" name="enlaceZoom" placeholder="https://zoom.us/j/..." onChange={handleChange} required />
              </div>

            </div>

            <button type="submit" className="button button-primary" style={{ marginTop: '30px' }}>
              Confirmar y Agendar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}