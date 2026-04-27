import { useState, useEffect } from 'react';
import '../../styles/Tutor/RegistroSesiones.css';

export default function RegistroSesiones() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.Rol === 'Admin';
  
  const [step, setStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    alumno: '',
    tipoAsistencia: '',
    enlaceZoom: '',
    duracion: '',
    tema: '',
    descripcion: '',
    planeacionSiguiente: '',
    linkEvidencia: ''
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Clase Programada Simulada 
  const claseProgramada = new Date();
  claseProgramada.setMinutes(claseProgramada.getMinutes() + 5); 

  // Ventana de tiempo: 10 min antes y 15 min después
  const diffMinutes = (claseProgramada - currentTime) / 60000;
  // Si es Admin, la ventana SIEMPRE está abierta
  const isAttendanceWindowOpen = isAdmin || (diffMinutes <= 10 && diffMinutes >= -15);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSessionData({ ...sessionData, [name]: value });
  };

  const handleAsistenciaSubmit = (e) => {
    e.preventDefault();
    if (!sessionData.alumno || !sessionData.tipoAsistencia || !sessionData.enlaceZoom) {
        alert("Por favor, llena todos los campos de asistencia.");
        return;
    }
    alert(isAdmin ? "Modo Admin: Registro forzado exitoso." : "Asistencia registrada. ¡El botón de Zoom está activo!");
    setStep(2); 
  };

  const handleBitacoraSubmit = (e) => {
    e.preventDefault();
    alert("¡Bitácora guardada con éxito!");
    console.log("Datos enviados:", sessionData);
    setStep(1);
    setSessionData({
      alumno: '', tipoAsistencia: '', enlaceZoom: '', duracion: '', tema: '', descripcion: '', planeacionSiguiente: '', linkEvidencia: ''
    });
  };

  return (
    <div className="registro-container">
      <div className="registro-header">
        <h2>{isAdmin ? "📝 Registro de Sesión (Admin)" : "Registro de Sesión Unificado"}</h2>
        
        <div className="progress-bar-container">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Asistencia</div>
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Clase & Bitácora</div>
        </div>
      </div>

      <div className="registro-content">
        {step === 1 && (
          <form onSubmit={handleAsistenciaSubmit} className="registro-form">
            <h3>Pase de Asistencia {isAdmin && "(Saltar Restricción de Tiempo)"}</h3>
            
            {!isAttendanceWindowOpen ? (
                <div className="warning-box">
                    <p>⚠️ La asistencia solo se puede registrar 10 minutos antes de tu sesión programada.</p>
                </div>
            ) : (
                <>
                    <div className="form-group">
                        <label>Alumno {isAdmin && " (Global)"}</label>
                        <select name="alumno" value={sessionData.alumno} onChange={handleInputChange} required>
                            <option value="">Selecciona un alumno...</option>
                            {/* Aquí podrías mapear una lista completa si es Admin */}
                            <option value="David_Perez">David Pérez (Secundaria A2)</option>
                            <option value="Sofia_Gomez">Sofía Gómez (Secundaria A1)</option>
                            {isAdmin && <option value="Admin_Test">Alumno de Prueba (Admin)</option>}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Asistencia</label>
                        <select name="tipoAsistencia" value={sessionData.tipoAsistencia} onChange={handleInputChange} required>
                            <option value="">Selecciona el rol...</option>
                            <option value="Titular">Tutor TITULAR</option>
                            <option value="Reemplazo">Tutor de reemplazo "BACK UP"</option>
                            <option value="Apoyo">Tutor de APOYO</option>
                            {isAdmin && <option value="Admin_Forced">Registro Administrativo</option>}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Enlace de Zoom</label>
                        <input 
                            type="url" 
                            name="enlaceZoom" 
                            placeholder={isAdmin ? "Enlace de respaldo" : "https://zoom.us/j/..."}
                            value={sessionData.enlaceZoom} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>

                    <div className="info-box">
                        <p><strong>{isAdmin ? "Aviso Admin:" : "Recuerda:"}</strong> {isAdmin ? "Estás registrando una sesión con privilegios de administrador." : "Tolerancia máxima de 10 minutos."}</p>
                    </div>

                    <button type="submit" className="button button-primary full-width">
                        {isAdmin ? "Forzar Registro de Asistencia" : "Registrar Asistencia y Activar Clase"}
                    </button>
                </>
            )}
          </form>
        )}

        {step === 2 && (
          <div className="registro-form">
            <h3>{isAdmin ? "Edición de Bitácora" : "Clase en Curso & Bitácora"}</h3>
            
            <div className="zoom-section">
                <p>{isAdmin ? "Enlace registrado:" : "Tu asistencia ha sido registrada. Puedes iniciar tu clase:"}</p>
                <a href={sessionData.enlaceZoom} target="_blank" rel="noopener noreferrer" className="button button-zoom">
                    🎥 {isAdmin ? "Probar Enlace" : "Ingresar a Zoom"}
                </a>
            </div>

            <hr className="divider" />

            <form onSubmit={handleBitacoraSubmit}>
                <h4>Expediente Post-Sesión</h4>

                <div className="form-group">
                    <label>Tema Visto</label>
                    <input type="text" name="tema" value={sessionData.tema} onChange={handleInputChange} required />
                </div>

                <div className="form-group">
                    <label>Descripción de la sesión</label>
                    <textarea name="descripcion" value={sessionData.descripcion} onChange={handleInputChange} rows="3" required></textarea>
                </div>

                <div className="form-group">
                    <label>Planeación Siguiente Sesión</label>
                    <textarea name="planeacionSiguiente" value={sessionData.planeacionSiguiente} onChange={handleInputChange} rows="2" required></textarea>
                </div>

                <div className="form-group">
                    <label>Duración Efectiva (Horas)</label>
                    <input type="number" name="duracion" value={sessionData.duracion} onChange={handleInputChange} min="1" max="4" required />
                </div>
                
                <div className="form-group">
                    <label>Link de Evidencia</label>
                    <input type="url" name="linkEvidencia" value={sessionData.linkEvidencia} onChange={handleInputChange} required />
                </div>

                <button type="submit" className="button button-success full-width" style={{ backgroundColor: isAdmin ? '#3b82f6' : '#2ecc71' }}>
                    {isAdmin ? "Finalizar Ajuste Administrativo" : "Guardar Bitácora y Acreditar Horas"}
                </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}