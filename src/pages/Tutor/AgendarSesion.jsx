import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../../styles/App.css';
import '../../styles/Config.css'; 
import '../../styles/Tutor/AgendarSesion.css';

export default function AgendarSesion() {
    const user = JSON.parse(localStorage.getItem('user'));
    const location = useLocation();
    
    const [cursos, setCursos] = useState([]);
    const [estudiantesCurso, setEstudiantesCurso] = useState([]);
    const [revisores, setRevisores] = useState([]); 
    
    const [sesion, setSesion] = useState({
        CourseID: location.state?.courseId || '',
        estudiantesSeleccionados: location.state?.studentId ? [location.state.studentId] : [], 
        ReviewerID: '', 
        tema: '', 
        fecha: '', 
        horaInicio: '', 
        duracion: '1.0', 
        enlaceVideo: '',
        tipoAsistencia: 'Titular',
        descripcion: ''
    });

    useEffect(() => {
        if (user?.ID) {
            fetch(`http://localhost:8000/api/tutor/tutor-cursos/${user.ID}`)
                .then(res => res.json())
                .then(data => { if (data.success) setCursos(data.cursos); });

            fetch(`http://localhost:8000/api/tutor/revisores-asignados/${user.ID}`)
                .then(res => res.json())
                .then(data => { 
                    if (data.success && data.revisores.length > 0) {
                        setRevisores(data.revisores);
                        setSesion(prev => ({ ...prev, ReviewerID: data.revisores[0].ID }));
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user?.ID]);

    useEffect(() => {
        if (location.state?.courseId) {
            fetch(`http://localhost:8000/api/tutor/estudiantes-curso/${location.state.courseId}`)
                .then(res => res.json())
                .then(data => { if (data.success) setEstudiantesCurso(data.estudiantes); });
        }
    }, [location.state]);

    const handleCursoChange = async (e) => {
        const courseId = e.target.value;
        setSesion({ ...sesion, CourseID: courseId, estudiantesSeleccionados: [] });
        
        if (courseId) {
            try {
                const res = await fetch(`http://localhost:8000/api/tutor/estudiantes-curso/${courseId}`);
                const data = await res.json();
                if (data.success) setEstudiantesCurso(data.estudiantes);
            } catch (error) {
                console.error(error);
            }
        } else {
            setEstudiantesCurso([]);
        }
    };

    const handleChange = (e) => {
        setSesion({ ...sesion, [e.target.name]: e.target.value });
    };

    const handleStudentToggle = (studentId) => {
        setSesion(prev => {
            const seleccionados = prev.estudiantesSeleccionados.includes(studentId)
                ? prev.estudiantesSeleccionados.filter(id => id !== studentId)
                : [...prev.estudiantesSeleccionados, studentId];
            return { ...prev, estudiantesSeleccionados: seleccionados };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!sesion.CourseID || !sesion.tema.trim() || !sesion.fecha || !sesion.horaInicio || !sesion.duracion || !sesion.enlaceVideo.trim() || !sesion.descripcion.trim() || !sesion.tipoAsistencia) {
            return toast.error("Todos los campos son obligatorios. Por favor, llena la información faltante.");
        }

        if (sesion.estudiantesSeleccionados.length === 0) {
            return toast.error("Por favor, selecciona al menos a un alumno para la sesión.");
        }

        if (!sesion.ReviewerID) {
            return toast.error("No puedes agendar sin un revisor asignado. Contacta a un administrador.");
        }

        const toastId = toast.loading("Procesando agendamiento...");

        try {
            const res = await fetch("http://localhost:8000/api/tutor/agendar-sesion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    TutorID: user.ID,
                    CourseID: sesion.CourseID,
                    ReviewerID: sesion.ReviewerID,
                    Estudiantes: sesion.estudiantesSeleccionados,
                    Date: sesion.fecha,
                    StartTime: sesion.horaInicio,
                    Duration: parseFloat(sesion.duracion),
                    Topic: sesion.tema.trim(),
                    Url: sesion.enlaceVideo.trim(),
                    TypeAssistence: sesion.tipoAsistencia,
                    Description: sesion.descripcion.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("¡Sesión agendada correctamente!", { id: toastId });
                setSesion({ ...sesion, estudiantesSeleccionados: [], tema: '', fecha: '', horaInicio: '', enlaceVideo: '', descripcion: '' });
                setEstudiantesCurso([]);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    return (
        <div className="mainContent">
            <h2 id="Title">Agendar Clase</h2>
            <p className="dashboard-subtitle">Define los detalles de la sesión y selecciona a los participantes.</p>

            <div className="agendar-card">
                <form onSubmit={handleSubmit}>
                    
                    <div className="agendar-row-3">
                        <div className="agendar-group">
                            <label>Curso *</label>
                            <select className="agendar-input" name="CourseID" value={sesion.CourseID} onChange={handleCursoChange} required>
                                <option value="">Selecciona un curso...</option>
                                {cursos.map(c => (
                                    <option key={c.CourseID} value={c.CourseID}>{c.Name} - {c.Level}</option>
                                ))}
                            </select>
                        </div>

                        <div className="agendar-group">
                            <label>Revisor Asignado a tu perfil *</label>
                            {revisores.length > 0 ? (
                                <div className="agendar-input revisor-badge">
                                    <span>{revisores[0].Name}</span>
                                </div>
                            ) : (
                                <div className="agendar-input revisor-badge-error">
                                    Sin revisor asignado
                                </div>
                            )}
                        </div>

                        <div className="agendar-group">
                            <label>Tema de la Sesión *</label>
                            <input type="text" className="agendar-input" name="tema" value={sesion.tema} placeholder="Ej. Práctica de Listening" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="agendar-group students-wrapper">
                        <label className="students-wrapper-label">
                            {estudiantesCurso.length > 0 ? "Selecciona a los alumnos que asistirán: *" : "Selecciona un curso para ver la lista de alumnos *"}
                        </label>
                        <div className="students-container">
                            {estudiantesCurso.map(est => {
                                const isSelected = sesion.estudiantesSeleccionados.includes(est.ID);
                                return (
                                    <label key={est.ID} className={`student-checkbox-label ${isSelected ? 'selected' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => handleStudentToggle(est.ID)} 
                                        />
                                        {est.Name}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="agendar-row-2">
                        <div className="agendar-grid-2">
                            <div className="agendar-group">
                                <label>Fecha *</label>
                                <input type="date" className="agendar-input" name="fecha" value={sesion.fecha} onChange={handleChange} required />
                            </div>
                            <div className="agendar-group">
                                <label>Hora de Inicio *</label>
                                <input type="time" className="agendar-input" name="horaInicio" value={sesion.horaInicio} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="agendar-grid-2">
                            <div className="agendar-group">
                                <label>Duración (Hrs) *</label>
                                <input type="number" step="0.5" min="0.5" className="agendar-input" name="duracion" value={sesion.duracion} onChange={handleChange} required />
                            </div>
                            <div className="agendar-group">
                                <label>Tipo de Asistencia *</label>
                                <select className="agendar-input" name="tipoAsistencia" value={sesion.tipoAsistencia} onChange={handleChange} required>
                                    <option value="Titular">Titular</option>
                                    <option value="Backup">Backup</option>
                                    <option value="Apoyo">Apoyo</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="agendar-row-2 agendar-row-margin">
                        <div className="agendar-group">
                            <label>Enlace de Videollamada *</label>
                            <input type="url" className="agendar-input" name="enlaceVideo" value={sesion.enlaceVideo} placeholder="https://meet.google.com/..." onChange={handleChange} required />
                        </div>
                        <div className="agendar-group">
                            <label>Notas / Objetivos Previos *</label>
                            <textarea 
                                className="agendar-input agendar-textarea" 
                                name="descripcion" 
                                value={sesion.descripcion} 
                                onChange={handleChange} 
                                placeholder="Puntos clave que se abordarán..." 
                                required 
                            ></textarea>
                        </div>
                    </div>

                    <div className="agendar-actions">
                        <button type="submit" className="btn-agendar-solid">
                            Agendar y Notificar Alumnos
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}