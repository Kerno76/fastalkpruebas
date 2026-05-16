import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../../styles/Tutor/RegistroSesiones.css';

// Función para verificar si se permite el reenvío leyendo la BD oculta
const canResubmit = (comments) => {
    if (!comments) return false;
    return comments.includes('Permite Reenvío: Sí');
};

// Función para extraer el comentario limpio de la BD oculta
const getCleanComment = (comments) => {
    if (!comments) return '';
    const split = comments.split('Comentarios: ');
    return split.length > 1 ? split[1] : comments;
};

export default function RegistroSesiones() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [sesiones, setSesiones] = useState([]);
    const [activeModal, setActiveModal] = useState(null); 
    const [selectedSession, setSelectedSession] = useState(null);

    const [bitacoraData, setBitacoraData] = useState({ descripcion: '', planeacionSiguiente: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [asistenciaAlumnos, setAsistenciaAlumnos] = useState([]);
    
    const [reagendarData, setReagendarData] = useState({ fecha: '', hora: '' });

    const fetchSesionesPendientes = async () => {
        if (!user?.ID) return;
        try {
            const res = await fetch(`http://localhost:8000/api/tutor/sesiones-pendientes/${user.ID}`);
            const data = await res.json();
            if (data.success) {
                // Filtramos: Si está rechazada pero el revisor puso "Permite Reenvío: No", se oculta de esta pantalla
                const filtradas = data.sesiones.filter(s => {
                    if (s.ReviewerStatus === 'Rechazado') {
                        return canResubmit(s.ReviewerComments);
                    }
                    return true;
                });
                setSesiones(filtradas);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchSesionesPendientes(); }, [user?.ID]);

    const openModal = (type, sesion) => {
        setSelectedSession(sesion);
        setAsistenciaAlumnos(sesion.estudiantes || []);
        if(type === 'posponer') setReagendarData({ fecha: sesion.Date, hora: sesion.StartTime });
        setActiveModal(type);
    };
    
    const closeModal = () => {
        setActiveModal(null);
        setSelectedSession(null);
        setBitacoraData({ descripcion: '', planeacionSiguiente: '' });
        setSelectedFile(null);
        setAsistenciaAlumnos([]);
        setReagendarData({ fecha: '', hora: '' });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleStudentUpdate = (studentId, field, value) => {
        setAsistenciaAlumnos(prev => prev.map(est => 
            est.StudentID === studentId ? { ...est, [field]: value } : est
        ));
    };

    const handleSaveIncidencias = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Guardando reporte...");
        try {
            const res = await fetch("http://localhost:8000/api/tutor/guardar-incidencias", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ SessionID: selectedSession.SessionID, estudiantesData: asistenciaAlumnos })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Asistencia y reportes actualizados", { id: toastId });
                fetchSesionesPendientes();
                closeModal();
            } else throw new Error(data.message);
        } catch (error) { toast.error(error.message, { id: toastId }); }
    };

    const handleCompletarSesion = async (e) => {
        e.preventDefault();

        if (!bitacoraData.descripcion || bitacoraData.descripcion.trim() === '') {
            return toast.error("El resumen de la clase es obligatorio.");
        }
        
        if (!bitacoraData.planeacionSiguiente || bitacoraData.planeacionSiguiente.trim() === '') {
            return toast.error("La planeación de la próxima clase es obligatoria.");
        }

        if (!selectedFile) {
            return toast.error("La captura de evidencia es obligatoria.");
        }

        const toastId = toast.loading("Cerrando sesión y enviando a revisión...");
        
        try {
            const fileBase64 = await fileToBase64(selectedFile);
            
            const estudiantesPorDefecto = asistenciaAlumnos.map(est => ({
                StudentID: est.StudentID,
                Attendance: est.Attendance || 'Presente',
                IncidentReport: est.IncidentReport || ''
            }));

            const payload = {
                SessionID: selectedSession.SessionID,
                Status: 'Completed',
                Description: bitacoraData.descripcion.trim(),
                NextSession: bitacoraData.planeacionSiguiente.trim(),
                fileBase64,
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                estudiantesData: estudiantesPorDefecto 
            };

            const res = await fetch("http://localhost:8000/api/tutor/completar-sesion", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (data.success) {
                toast.success("Bitácora enviada exitosamente", { id: toastId });
                fetchSesionesPendientes();
                closeModal();
            } else {
                throw new Error(data.message);
            }
        } catch (error) { 
            toast.error(error.message || "Ocurrió un error al enviar la bitácora", { id: toastId }); 
        }
    };

    const handlePosponer = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Reprogramando sesión...");
        try {
            const res = await fetch("http://localhost:8000/api/tutor/posponer-sesion", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SessionID: selectedSession.SessionID,
                    TutorID: user.ID,
                    NewDate: reagendarData.fecha,
                    NewTime: reagendarData.hora,
                    Estudiantes: asistenciaAlumnos,
                    Topic: selectedSession.Topic
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Sesión pospuesta y alumnos notificados", { id: toastId });
                fetchSesionesPendientes();
                closeModal();
            } else throw new Error(data.message);
        } catch (error) { toast.error(error.message, { id: toastId }); }
    };

    const handleCancelar = async () => {
        const toastId = toast.loading("Cancelando sesión...");
        try {
            const res = await fetch("http://localhost:8000/api/tutor/cancelar-sesion", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SessionID: selectedSession.SessionID,
                    TutorID: user.ID,
                    Estudiantes: asistenciaAlumnos,
                    Topic: selectedSession.Topic
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Sesión cancelada", { id: toastId });
                fetchSesionesPendientes();
                closeModal();
            } else throw new Error(data.message);
        } catch (error) { toast.error(error.message, { id: toastId }); }
    };

    const isPastSession = (date, time) => {
        const sessionDateTime = new Date(`${date}T${time}`);
        return sessionDateTime < new Date();
    };

    const renderSesionRow = (sesion) => {
        const isPast = isPastSession(sesion.Date, sesion.StartTime);
        const isRejected = sesion.ReviewerStatus === 'Rechazado';
        const cleanComment = getCleanComment(sesion.ReviewerComments);

        return (
            <div key={sesion.SessionID} className="sesion-row" style={{ borderLeft: isRejected ? '5px solid #ef4444' : 'none', flexDirection: 'column' }}>
                
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sesion-info">
                        {isRejected ? (
                            <span className="sesion-header-tag tag-prox" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>Requiere Corrección</span>
                        ) : (
                            <span className="sesion-header-tag tag-prox">En Progreso</span>
                        )}
                        <h3>{sesion.Topic}</h3>
                        <p><strong>Curso:</strong> {sesion.courseName}</p>
                        <p><strong>Horario:</strong> {sesion.Date} a las {sesion.StartTime}</p>
                        <p><strong>Alumnos convocados:</strong> {sesion.studentCount}</p>
                    </div>
                    
                    <div className="sesion-actions">
                        <button 
                            onClick={() => openModal('posponer', sesion)} 
                            className="btn-sesion btn-posponer"
                            disabled={isPast}
                            style={isPast ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            Posponer
                        </button>
                        <button onClick={() => openModal('cancelar', sesion)} className="btn-sesion btn-cancelar">Cancelar</button>
                        <a href={sesion.Url} target="_blank" rel="noopener noreferrer" className="btn-sesion btn-sesion-link">Entrar a Sesión</a>
                        <button onClick={() => openModal('incidencias', sesion)} className="btn-sesion btn-incidencia">Incidentes</button>
                        <button onClick={() => openModal('bitacora', sesion)} className="btn-sesion btn-bitacora">
                            {isRejected ? 'Reenviar Bitácora' : 'Bitácora'}
                        </button>
                    </div>
                </div>

                {/* CAJA DE NOTAS DE EVALUADOR DIRECTO EN LA LISTA */}
                {isRejected && (
                    <div style={{ backgroundColor: '#fee2e2', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #fca5a5', width: '100%' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                            ⚠️ Notas del Evaluador (Segunda Revisión Habilitada)
                        </span>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#991b1b', lineHeight: 1.5 }}>
                            {cleanComment}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="sesiones-manager-container">
            <div className="sesiones-manager-header">
                <h2>Gestión de Clases en Curso</h2>
                <p>Pasa lista, reporta comportamientos inusuales, reagenda y sube tu evidencia al terminar la sesión.</p>
            </div>

            <div className="sesiones-grid">
                {sesiones.length > 0 ? sesiones.map(renderSesionRow) : <div className="repo-empty-state">No tienes sesiones activas pendientes de cierre.</div>}
            </div>

            {activeModal === 'incidencias' && selectedSession && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Incidentes y Asistencia</h3>
                            <button className="close-button" onClick={closeModal}>&times;</button>
                        </div>

                        <div className="precargado-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <strong style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Curso</strong>
                                <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{selectedSession.courseName}</p>
                            </div>
                            <div>
                                <strong style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Tema Central</strong>
                                <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{selectedSession.Topic}</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSaveIncidencias}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                {asistenciaAlumnos.length > 0 ? asistenciaAlumnos.map((est) => (
                                    <div key={est.StudentID} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                                        <div>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', display: 'block', marginBottom: '5px' }}>{est.Name}</span>
                                            <select className="select-field" value={est.Attendance || 'Presente'} onChange={(e) => handleStudentUpdate(est.StudentID, 'Attendance', e.target.value)}>
                                                <option value="Presente">Presente</option>
                                                <option value="Ausente">Ausente</option>
                                                <option value="Retardo">Retardo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>Detalle / Incidente</span>
                                            <input className="select-field" type="text" placeholder="Ej. Problemas de internet..." value={est.IncidentReport || ''} onChange={(e) => handleStudentUpdate(est.StudentID, 'IncidentReport', e.target.value)} />
                                        </div>
                                    </div>
                                )) : <p style={{ color: '#ef4444' }}>No hay alumnos registrados.</p>}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="btn-sesion btn-bitacora" style={{ width: 'auto', padding: '10px 20px', border: 'none' }}>Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeModal === 'bitacora' && selectedSession && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Llenar Bitácora {selectedSession.ReviewerStatus === 'Rechazado' && '(Corrección)'}</h3>
                            <button className="close-button" onClick={closeModal}>&times;</button>
                        </div>
                        
                        <div className="precargado-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <strong style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Curso a evaluar</strong>
                                <p style={{ margin: '2px 0 10px 0', fontWeight: 600 }}>{selectedSession.courseName}</p>
                                <strong style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Fecha</strong>
                                <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{selectedSession.Date}</p>
                            </div>
                            <div>
                                <strong style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Tema Principal</strong>
                                <p style={{ margin: '2px 0 10px 0', fontWeight: 600 }}>{selectedSession.Topic}</p>
                                <strong style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Horario impartido</strong>
                                <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{selectedSession.StartTime} ({selectedSession.Duration} hrs)</p>
                            </div>
                        </div>

                        <form onSubmit={handleCompletarSesion}>
                            <div className="form-group">
                                <label>Resumen de la Clase (Bitácora)</label>
                                <textarea 
                                    rows="3" 
                                    value={bitacoraData.descripcion} 
                                    onChange={(e) => setBitacoraData({...bitacoraData, descripcion: e.target.value})} 
                                    placeholder="Describe qué actividades realizaron y cómo fue el avance general..." 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Planeación para la próxima sesión</label>
                                <textarea 
                                    rows="2" 
                                    value={bitacoraData.planeacionSiguiente} 
                                    onChange={(e) => setBitacoraData({...bitacoraData, planeacionSiguiente: e.target.value})} 
                                    placeholder="¿Qué temas abordarán en la siguiente clase?" 
                                    required 
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                <label>Captura de Evidencia</label>
                                <div className="drag-drop-zone" onClick={() => document.getElementById('file-upload').click()}>
                                    <input id="file-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                                    {selectedFile ? <p style={{ margin: 0, color: '#3b82f6', fontWeight: 600 }}>Archivo listo: {selectedFile.name}</p> : <p style={{ margin: 0, color: '#64748b' }}>Haz clic aquí para seleccionar tu captura de pantalla</p>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn-sesion btn-bitacora" style={{ width: '100%', padding: '14px', fontSize: '1rem', border: 'none', justifyContent: 'center' }}>
                                    {selectedSession.ReviewerStatus === 'Rechazado' ? 'Reenviar Corrección' : 'Cerrar Clase y Enviar a Revisión'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeModal === 'posponer' && selectedSession && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Posponer Sesión</h3>
                            <button className="close-button" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handlePosponer}>
                            <div className="form-group">
                                <label>Nueva Fecha</label>
                                <input type="date" className="select-field" value={reagendarData.fecha} onChange={(e) => setReagendarData({...reagendarData, fecha: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Nueva Hora</label>
                                <input type="time" className="select-field" value={reagendarData.hora} onChange={(e) => setReagendarData({...reagendarData, hora: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="submit" className="btn-sesion btn-bitacora" style={{ border: 'none', padding: '10px 20px', width: '100%', justifyContent: 'center' }}>
                                    Confirmar y Notificar Alumnos
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeModal === 'cancelar' && selectedSession && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0', justifyContent: 'center' }}>
                            <h3 style={{ color: '#ef4444' }}>Cancelar Sesión</h3>
                        </div>
                        <div style={{ margin: '20px 0' }}>
                            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                ¿Estás seguro de cancelar por completo la sesión de <strong>"{selectedSession.Topic}"</strong>?
                                <br/><br/>
                                Esta acción no se puede deshacer y se enviará una notificación automática a los alumnos.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px' }}>
                            <button type="button" onClick={closeModal} className="btn-sesion btn-sesion-link" style={{ flex: 1, justifyContent: 'center' }}>
                                Volver
                            </button>
                            <button type="button" onClick={handleCancelar} className="btn-sesion btn-incidencia" style={{ flex: 1, justifyContent: 'center' }}>
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}