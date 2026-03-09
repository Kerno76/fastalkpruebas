import { useState, useEffect } from 'react';
import '../RegistroSesiones.css';

export default function RegistroSesiones() {
  const [step, setStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    alumno: '',
    tipoAsistencia: '',
    enlaceZoom: '',
    // Datos de bitácora
    duracion: '',
    tema: '',
    descripcion: '',
    planeacionSiguiente: '',
    linkEvidencia: ''
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Clase Programada Simulada 
  const claseProgramada = new Date();
  claseProgramada.setMinutes(claseProgramada.getMinutes() + 5); // Es en 5 mins

  // Verifica si estamos en la ventana de 10 min antes
  const diffMinutes = (claseProgramada - currentTime) / 60000;
  const isAttendanceWindowOpen = diffMinutes <= 10 && diffMinutes >= -15; // 10 min antes y hasta 15 min después

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Actualiza cada minuto
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
    alert("Asistencia registrada. ¡El botón de Zoom está activo!");
    setStep(2); // Avanza al paso de Zoom / Bitácora
  };

  const handleBitacoraSubmit = (e) => {
    e.preventDefault();
    alert("¡Bitácora guardada con éxito! Horas calculadas y enviadas al sistema.");
    console.log("Datos enviados:", sessionData);
    setStep(1); // Reinicia el flujo
    setSessionData({
      alumno: '', tipoAsistencia: '', enlaceZoom: '', duracion: '', tema: '', descripcion: '', planeacionSiguiente: '', linkEvidencia: ''
    });
  };

  return (
    <div className="registro-container">
      <div className="registro-header">
        <h2>Registro de Sesión Unificado</h2>
        
        {/* Barra de progreso visual */}
        <div className="progress-bar-container">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Asistencia</div>
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Clase & Bitácora</div>
        </div>
      </div>

      <div className="registro-content">
        {step === 1 && (
          <form onSubmit={handleAsistenciaSubmit} className="registro-form">
            <h3>Pase de Asistencia (Previo a clase)</h3>
            
            {!isAttendanceWindowOpen ? (
                <div className="warning-box">
                    <p>⚠️ La asistencia solo se puede registrar 10 minutos antes de tu sesión programada.</p>
                    <p>Próxima clase: {claseProgramada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            ) : (
                <>
                    <div className="form-group">
                        <label>Alumno Asignado</label>
                        <select name="alumno" value={sessionData.alumno} onChange={handleInputChange} required>
                            <option value="">Selecciona un alumno...</option>
                            <option value="David_Perez">David Pérez (Secundaria A2)</option>
                            <option value="Sofia_Gomez">Sofía Gómez (Secundaria A1)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Asistencia</label>
                        <select name="tipoAsistencia" value={sessionData.tipoAsistencia} onChange={handleInputChange} required>
                            <option value="">Selecciona el rol...</option>
                            <option value="Titular">Tutor TITULAR</option>
                            <option value="Reemplazo">Tutor de reemplazo "BACK UP"</option>
                            <option value="Apoyo">Tutor de APOYO</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Enlace de Zoom (Clase Virtual)</label>
                        <input 
                            type="url" 
                            name="enlaceZoom" 
                            placeholder="https://zoom.us/j/..." 
                            value={sessionData.enlaceZoom} 
                            onChange={handleInputChange} 
                            required 
                        />
                        <small>Este enlace se activará en el siguiente paso.</small>
                    </div>

                    <div className="info-box">
                        <p><strong>Recuerda:</strong> Tolerancia máxima de 10 minutos. Si el alumno no llega, deberás llenar el reporte de incidencia.</p>
                    </div>

                    <button type="submit" className="button button-primary full-width">
                        Registrar Asistencia y Activar Clase
                    </button>
                </>
            )}
          </form>
        )}

        {step === 2 && (
          <div className="registro-form">
            <h3>Clase en Curso & Bitácora</h3>
            
            {/* El "Botón Mágico" de Zoom */}
            <div className="zoom-section">
                <p>Tu asistencia ha sido registrada. Puedes iniciar tu clase:</p>
                <a href={sessionData.enlaceZoom} target="_blank" rel="noopener noreferrer" className="button button-zoom">
                    🎥 Ingresar a Zoom
                </a>
            </div>

            <hr className="divider" />

            <form onSubmit={handleBitacoraSubmit}>
                <h4>Expediente Post-Sesión</h4>
                <p className="subtitle">Llenar inmediatamente al finalizar para cálculo automático de horas.</p>

                <div className="form-group">
                    <label>Tema Visto</label>
                    <input type="text" name="tema" value={sessionData.tema} onChange={handleInputChange} placeholder="Ej. Present Simple" required />
                </div>

                <div className="form-group">
                    <label>Descripción de la sesión (Observaciones)</label>
                    <textarea name="descripcion" value={sessionData.descripcion} onChange={handleInputChange} placeholder="¿Cómo participó el alumno? ¿Hubo dudas?" rows="3" required></textarea>
                </div>

                <div className="form-group">
                    <label>Planeación Siguiente Sesión</label>
                    <textarea name="planeacionSiguiente" value={sessionData.planeacionSiguiente} onChange={handleInputChange} placeholder="¿Qué tema verán? (De acuerdo a su estilo de aprendizaje)" rows="2" required></textarea>
                </div>

                <div className="form-group">
                    <label>Duración Efectiva (Horas)</label>
                    <input type="number" name="duracion" value={sessionData.duracion} onChange={handleInputChange} min="1" max="4" required />
                </div>
                
                <div className="form-group">
                    <label>Link de Evidencia (Drive/Capturas)</label>
                    <input type="url" name="linkEvidencia" value={sessionData.linkEvidencia} onChange={handleInputChange} placeholder="https://docs.google.com/..." required />
                </div>

                <button type="submit" className="button button-success full-width">
                    Guardar Bitácora y Acreditar Horas
                </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}