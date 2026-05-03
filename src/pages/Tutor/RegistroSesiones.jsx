import React, { useState } from 'react';
import '../../styles/Tutor/RegistroSesiones.css';

// Data inflada basada en tu array 'misSesiones'
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
        bitacoraLlena: false // Faltó llenar hoy
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
        bitacoraLlena: true // Ya la llenó en su momento
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

export default function RegistroSesiones() {
  const [sesiones, setSesiones] = useState(sesionesData);
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedSession, setSelectedSession] = useState(null);

  // Estados de formularios y archivos
  const [bitacoraData, setBitacoraData] = useState({
    tema: '', descripcion: '', planeacionSiguiente: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // --- HANDLERS ---
  const openBitacora = (sesion) => {
    setSelectedSession(sesion);
    setActiveModal('bitacora');
  };

  const openInasistencia = (sesion) => {
    setSelectedSession(sesion);
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

  // --- RENDER DE FILAS ---
  const renderSesionRow = (sesion) => {
    const isUpcoming = sesion.status === 'upcoming';
    const isPending = sesion.status === 'past' && !sesion.bitacoraLlena;
    const isDone = sesion.bitacoraLlena;

    return (
      <div key={sesion.id} className={`sesion-row ${isUpcoming ? 'prox-sesion' : ''}`}>
        <div className="sesion-info">
            {isUpcoming && <span className="sesion-header-tag tag-prox">Próxima Sesión</span>}
            {isPending && <span className="sesion-header-tag tag-past">Pendiente de Revisión</span>}
            {isDone && <span className="sesion-header-tag tag-done">Completada</span>}
            
            <h3>{sesion.topic}</h3>
            <p><strong>Alumno:</strong> {sesion.alumno} ({sesion.level} - {sesion.course})</p>
            <p><strong>Horario:</strong> {sesion.date} a las {sesion.time}</p>
        </div>

        <div className="sesion-actions">
            {/* Los botones ahora están alineados horizontalmente */}
            {!isDone ? (
                <>
                    <button onClick={() => openInasistencia(sesion)} className="btn-sesion btn-incidencia">
                        ⚠️ Registrar Inasistencia
                    </button>
                    <button onClick={() => openBitacora(sesion)} className="btn-sesion btn-bitacora">
                        📝 Llenar Bitácora
                    </button>
                </>
            ) : (
                <button className="btn-sesion btn-disabled" disabled>
                    ✅ Gestionada
                </button>
            )}

            {isUpcoming && (
                <a href={sesion.meetLink} target="_blank" rel="noopener noreferrer" className="btn-sesion btn-sesion-link">
                    🎥 Entrar a Sesión
                </a>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="sesiones-manager-container">
      <div className="sesiones-manager-header">
        <h2>Control de Sesiones</h2>
        <p>Visualiza tus clases agendadas, llena las bitácoras pendientes y reporta inasistencias.</p>
      </div>

      {/* Grid ahora funciona como lista de filas */}
      <div className="sesiones-grid">
        {sesiones.map(renderSesionRow)}
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
                
                {/* Zona de Drag & Drop para subir imagen */}
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
                
                {/* Zona de Drag & Drop para inasistencia */}
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