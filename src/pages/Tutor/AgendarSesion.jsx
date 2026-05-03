import React, { useState } from 'react';
import '../../styles/App.css';
import '../../styles/Config.css'; 
import '../../styles/Tutor/RegistroSesiones.css';
import '../../styles/Tutor/AgendarSesion.css'; // Tu nuevo CSS

// --- DATA INFLADA PARA EL REGISTRO ---
const sesionesData = [
    {
        id: 1,
        alumno: "Elvis Alain Calzada",
        date: "27 Abril 2026",
        time: "16:00 hrs",
        course: "Ingles",
        level: "C1",
        topic: "First and Second Conditionals",
        status: "upcoming", 
        meetLink: "https://meet.google.com/abc-defg-hij",
        bitacoraLlena: false
    },
    {
        id: 4,
        alumno: "Daniel Carballido",
        date: "27 Abril 2026",
        time: "10:00 hrs",
        course: "Frances",
        level: "B1",
        topic: "Passé Composé Intro",
        status: "past", 
        bitacoraLlena: false 
    },
    {
        id: 2,
        alumno: "Mario Alejandro Avendaño",
        date: "10 Abril 2026",
        time: "16:00 hrs",
        course: "Ingles",
        level: "B2",
        topic: "Present Perfect vs Past Simple",
        status: "past", 
        bitacoraLlena: false 
    },
    {
        id: 3,
        alumno: "Javier Juárez",
        date: "05 Abril 2026",
        time: "16:00 hrs",
        course: "Frances",
        level: "A2",
        topic: "Speaking Practice",
        status: "past", 
        bitacoraLlena: true 
    },
    {
        id: 5,
        alumno: "Miguel Castañeda",
        date: "28 Marzo 2026",
        time: "16:00 hrs",
        course: "Frances",
        level: "C1",
        topic: "Modal Verbs of Deduction",
        status: "past", 
        bitacoraLlena: true 
    }
];

export default function AgendarYRegistroSesiones() {
  // ==========================================
  // ESTADOS DEL CÓDIGO 1 (AGENDAR SESIÓN)
  // ==========================================
  const [sesion, setSesion] = useState({
    alumno: '', tema: '', fecha: '', horaInicio: '', enlaceVideo: ''
  });

  // ==========================================
  // ESTADOS DEL CÓDIGO 2 (REGISTRO Y MODALES)
  // ==========================================
  const [sesiones, setSesiones] = useState(sesionesData);
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedSession, setSelectedSession] = useState(null);
  
  const [bitacoraData, setBitacoraData] = useState({
    tema: '', descripcion: '', planeacionSiguiente: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // ==========================================
  // HANDLERS DE AGENDAR SESIÓN
  // ==========================================
  const handleChange = (e) => {
    setSesion({ ...sesion, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Clase agendada y notificada con éxito!');
    console.log("Datos a enviar a Node.js:", sesion);
    
    // Magia de la fusión: Agregamos la nueva sesión a la lista de abajo temporalmente
    const nuevaSesion = {
        id: Date.now(), // ID temporal
        alumno: sesion.alumno, // Toma el value del select
        date: sesion.fecha,
        time: sesion.horaInicio + " hrs",
        course: "Por definir",
        level: "-",
        topic: sesion.tema,
        status: "upcoming",
        meetLink: sesion.enlaceVideo,
        bitacoraLlena: false
    };
    
    setSesiones([nuevaSesion, ...sesiones]); // La pone al principio de la lista
    setSesion({ alumno: '', tema: '', fecha: '', horaInicio: '', enlaceVideo: '' }); // Limpia el formulario
  };

  // ==========================================
  // HANDLERS DE REGISTRO Y MODALES
  // ==========================================
  const openBitacora = (sesionObj) => {
    setSelectedSession(sesionObj);
    setActiveModal('bitacora');
  };

  const openInasistencia = (sesionObj) => {
    setSelectedSession(sesionObj);
    setActiveModal('inasistencia');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedSession(null);
    setBitacoraData({ tema: '', descripcion: '', planeacionSiguiente: '' });
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleBitacoraSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
        alert("Por favor, adjunta una imagen de evidencia.");
        return;
    }
    const actualizadas = sesiones.map(s => 
      s.id === selectedSession.id ? { ...s, bitacoraLlena: true, status: 'past' } : s
    );
    setSesiones(actualizadas);
    alert("¡Bitácora guardada con éxito! Evidencia subida. Horas calculadas (1 hr).");
    closeModal();
  };

  const handleIncidenciaSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
        alert("Debes adjuntar la captura de pantalla comprobando tu asistencia.");
        return;
    }
    const actualizadas = sesiones.map(s => 
      s.id === selectedSession.id ? { ...s, bitacoraLlena: true, status: 'past' } : s 
    );
    setSesiones(actualizadas);
    alert("Incidencia por inasistencia registrada correctamente.");
    closeModal();
  };

  // --- RENDER DE FILAS (REGISTRO) ---
  const renderSesionRow = (sesionObj) => {
    const isUpcoming = sesionObj.status === 'upcoming';
    const isPending = sesionObj.status === 'past' && !sesionObj.bitacoraLlena;
    const isDone = sesionObj.bitacoraLlena;

    return (
      <div key={sesionObj.id} className={`sesion-row ${isUpcoming ? 'prox-sesion' : ''}`}>
        <div className="sesion-info">
            {isUpcoming && <span className="sesion-header-tag tag-prox">Próxima Sesión</span>}
            {isPending && <span className="sesion-header-tag tag-past">Pendiente de Revisión</span>}
            {isDone && <span className="sesion-header-tag tag-done">Completada</span>}
            
            <h3>{sesionObj.topic}</h3>
            <p><strong>Alumno:</strong> {sesionObj.alumno} ({sesionObj.level} - {sesionObj.course})</p>
            <p><strong>Horario:</strong> {sesionObj.date} a las {sesionObj.time}</p>
        </div>

        <div className="sesion-actions">
            {!isDone ? (
                <>
                    <button onClick={() => openInasistencia(sesionObj)} className="btn-sesion btn-incidencia">
                        ⚠️ Registrar Inasistencia
                    </button>
                    <button onClick={() => openBitacora(sesionObj)} className="btn-sesion btn-bitacora">
                        📝 Llenar Bitácora
                    </button>
                </>
            ) : (
                <button className="btn-sesion btn-disabled" disabled>
                    ✅ Gestionada
                </button>
            )}

            {isUpcoming && (
                <a href={sesionObj.meetLink} target="_blank" rel="noopener noreferrer" className="btn-sesion btn-sesion-link">
                    🎥 Entrar a Sesión
                </a>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="mainContent" style={{ paddingBottom: '50px' }}>
      
      {/* ================================================= */}
      {/* SECCIÓN 1: AGENDAR SESIÓN (CÓDIGO ORIGINAL RESPETADO + CSS NUEVO) */}
      {/* ================================================= */}
      <h2 id="Title">Agendar Clase</h2>
      <p className="dashboard-subtitle">Programa tus próximas sesiones y notifica a tus alumnos.</p>

      {/* Aplicando tu CSS: agendar-card color-accent */}
      <div className="agendar-card color-accent" style={{ margin: '20px auto 50px auto' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="agendar-row-2">
            <div className="agendar-group">
              <label>Alumno</label>
              <select className="agendar-input" name="alumno" value={sesion.alumno} onChange={handleChange} required>
                <option value="">Selecciona a tu alumno...</option>
                <option value="David Pérez">David Pérez (A2)</option>
                <option value="Sofía Gómez">Sofía Gómez (A1)</option>
                <option value="Luis Eduardo">Luis Eduardo (B1)</option>
              </select>
            </div>

            <div className="agendar-group">
              <label>Tema principal</label>
              <input type="text" className="agendar-input" name="tema" value={sesion.tema} placeholder="Ej. Present Perfect" onChange={handleChange} required />
            </div>
          </div>

          <div className="agendar-row-3">
            <div className="agendar-group">
              <label>Fecha de la clase</label>
              <input type="date" className="agendar-input" name="fecha" value={sesion.fecha} onChange={handleChange} required />
            </div>

            <div className="agendar-group">
              <label>Hora de inicio</label>
              <input type="time" className="agendar-input" name="horaInicio" value={sesion.horaInicio} onChange={handleChange} required />
              <small className="agendar-hint">*Duración fija de 1 hora.</small>
            </div>

            <div className="agendar-group">
              <label>Enlace de Videollamada</label>
              <input type="url" className="agendar-input" name="enlaceVideo" value={sesion.enlaceVideo} placeholder="Zoom, Meets, Teams..." onChange={handleChange} required />
            </div>
          </div>

          <div className="agendar-actions">
            <button type="submit" className="btn-agendar-gradient">
              Confirmar y Agendar
            </button>
          </div>

        </form>
      </div>

      <hr style={{ border: '1px solid #e5e7eb', marginBottom: '40px' }} />

      {/* ================================================= */}
      {/* SECCIÓN 2: REGISTRO DE SESIONES */}
      {/* ================================================= */}
      <div className="sesiones-manager-container" style={{ margin: '0', padding: '0', boxShadow: 'none' }}>
        <div className="sesiones-manager-header">
          <h2>Control de Sesiones</h2>
          <p>Visualiza tus clases agendadas, llena las bitácoras pendientes y reporta inasistencias.</p>
        </div>

        <div className="sesiones-grid">
          {sesiones.map(renderSesionRow)}
        </div>
      </div>

      {/* ================================================= */}
      {/* MODAL DE BITÁCORA */}
      {/* ================================================= */}
      {activeModal === 'bitacora' && selectedSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Bitácora de Sesión</h3>
              <button className="close-button" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="precargado-box">
                <p><strong>Alumno:</strong> {selectedSession.alumno}</p>
                <p><strong>Fecha y Hora:</strong> {selectedSession.date} - {selectedSession.time}</p>
                <p><strong>Duración:</strong> 1 Hora (Fija)</p>
            </div>

            <form onSubmit={handleBitacoraSubmit}>
                <div className="form-group">
                    <label>Tema Visto</label>
                    <input type="text" value={bitacoraData.tema} onChange={(e) => setBitacoraData({...bitacoraData, tema: e.target.value})} placeholder="Ej. Modal Verbs" required />
                </div>
                <div className="form-group">
                    <label>Descripción de la sesión (Observaciones)</label>
                    <textarea value={bitacoraData.descripcion} onChange={(e) => setBitacoraData({...bitacoraData, descripcion: e.target.value})} placeholder="¿Cómo participó el alumno? ¿Hubo dudas?" rows="3" required></textarea>
                </div>
                <div className="form-group">
                    <label>Planeación Siguiente Sesión</label>
                    <textarea value={bitacoraData.planeacionSiguiente} onChange={(e) => setBitacoraData({...bitacoraData, planeacionSiguiente: e.target.value})} placeholder="¿Qué tema verán en la próxima clase?" rows="2" required></textarea>
                </div>
                
                <div className="form-group">
                    <label>Evidencia de Clase (Imagen/Captura)</label>
                    <div className="drag-drop-zone">
                        <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                        <p>📄 Arrastra tu imagen aquí o haz clic para seleccionar</p>
                        {selectedFile && <div className="file-name">✅ {selectedFile.name} listo para subir</div>}
                    </div>
                </div>

                <div className="modal-actions">
                    <button type="submit" className="btn-submit green">Guardar Bitácora (1hr)</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL DE INASISTENCIA */}
      {/* ================================================= */}
      {activeModal === 'inasistencia' && selectedSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reporte de Inasistencia</h3>
              <button className="close-button" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="precargado-box">
                <p><strong>Motivo:</strong> Inasistencia del Alumno</p>
                <p><strong>Alumno Ausente:</strong> {selectedSession.alumno}</p>
                <p><strong>Clase Programada:</strong> {selectedSession.date} a las {selectedSession.time}</p>
            </div>

            <form onSubmit={handleIncidenciaSubmit}>
                <p style={{fontSize: '14px', marginBottom: '20px', color: '#4b5563'}}>
                    Adjunta la evidencia (captura de pantalla) demostrando que tú estuviste presente en la videollamada esperando al alumno.
                </p>
                
                <div className="form-group">
                    <div className="drag-drop-zone">
                        <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                        <p>📸 Arrastra tu captura aquí o haz clic para buscar</p>
                        {selectedFile && <div className="file-name">✅ {selectedFile.name} adjuntado</div>}
                    </div>
                </div>

                <div className="modal-actions">
                    <button type="submit" className="btn-submit red">Registrar Inasistencia</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}