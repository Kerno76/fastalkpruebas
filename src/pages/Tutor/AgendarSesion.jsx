import { useState } from 'react';
import '../../styles/App.css';
import '../../styles/Config.css'; 

export default function AgendarSesion() {
  const [sesion, setSesion] = useState({
    alumno: '', tema: '', fecha: '', horaInicio: '', enlaceVideo: ''
  });

  const handleChange = (e) => {
    setSesion({ ...sesion, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Clase agendada y notificada con éxito!');
    console.log("Datos a enviar a Node.js:", sesion);
    // Nota Backend: Al recibir 'horaInicio', el backend automáticamente sumará 1 hora 
    // para registrar el bloque completo en la base de datos y calcular el curso del alumno.
  };

  return (
    <div className="mainContent">
      <h2 id="Title">Agendar Clase</h2>
      <p className="dashboard-subtitle">Programa tus próximas sesiones y notifica a tus alumnos.</p>

      {/* Contenedor central tipo tarjeta */}
      <div className="settingsPanel" style={{ maxWidth: '850px', padding: '35px', display: 'block', marginTop: '20px' }}>
        <div className="settingsThings" style={{ padding: '0' }}>
          <form onSubmit={handleSubmit}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
              <div className="formField">
                <label>Alumno</label>
                <select className="select-field" name="alumno" onChange={handleChange} required>
                  <option value="">Selecciona a tu alumno...</option>
                  <option value="ID_1">David Pérez (A2)</option>
                  <option value="ID_2">Sofía Gómez (A1)</option>
                  <option value="ID_3">Luis Eduardo (B1)</option>
                </select>
              </div>

              <div className="formField">
                <label>Tema principal</label>
                <input type="text" name="tema" placeholder="Ej. Present Perfect" onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '35px' }}>
              <div className="formField">
                <label>Fecha de la clase</label>
                <input type="date" name="fecha" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Hora de inicio</label>
                <input type="time" name="horaInicio" onChange={handleChange} required />
                <small style={{ color: '#666', marginTop: '6px', fontSize: '0.85rem' }}>*Duración fija de 1 hora.</small>
              </div>

              <div className="formField">
                <label>Enlace de Videollamada</label>
                <input type="url" name="enlaceVideo" placeholder="Zoom, Meets, Teams..." onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="button button-primary">
                Confirmar y Agendar
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}