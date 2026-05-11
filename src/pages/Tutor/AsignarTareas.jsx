import { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import toast from 'react-hot-toast';
import { Typography, Checkbox, CircularProgress, Paper, Button } from '@mui/material';

import '../../styles/App.css';
import '../../styles/Tutor/AgendarSesion.css';

export default function AsignarTareas() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [cursos, setCursos] = useState([]);
    const [alumnosDelCurso, setAlumnosDelCurso] = useState([]);
    const [loadingCursos, setLoadingCursos] = useState(true);
    const [loadingAlumnos, setLoadingAlumnos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [tarea, setTarea] = useState({ cursoID: '', titulo: '', descripcion: '', fecha: null, hora: null, linkMaterial: '' });
    const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
    const [archivoAdjunto, setArchivoAdjunto] = useState(null);

    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/tutor/tutor-cursos/${user.ID}`);
                const data = await res.json();
                if (data.success) setCursos(data.cursos);
            } catch (err) { console.error(err); } finally { setLoadingCursos(false); }
        };
        if (user?.ID) fetchCursos();
    }, [user?.ID]);

    useEffect(() => {
        const fetchAlumnos = async () => {
            if (!tarea.cursoID) { setAlumnosDelCurso([]); setAlumnosSeleccionados([]); return; }
            setLoadingAlumnos(true);
            try {
                const res = await fetch(`http://localhost:8000/api/tutor/estudiantes-curso/${tarea.cursoID}`);
                const data = await res.json();
                if (data.success) { setAlumnosDelCurso(data.estudiantes); setAlumnosSeleccionados([]); }
            } catch (err) { console.error(err); } finally { setLoadingAlumnos(false); }
        };
        fetchAlumnos();
    }, [tarea.cursoID]);

    const handleChange = (e) => setTarea({ ...tarea, [e.target.name]: e.target.value });
    const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setArchivoAdjunto(e.target.files[0]); };
    const handleAlumnoToggle = (id) => setAlumnosSeleccionados(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
    const seleccionarTodos = () => setAlumnosSeleccionados(alumnosDelCurso.map(a => a.ID));
    const limpiarSeleccion = () => setAlumnosSeleccionados([]);

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (alumnosSeleccionados.length === 0) return toast.error("Selecciona al menos un alumno.");
        if (!tarea.fecha || !tarea.hora) return toast.error("Selecciona fecha y hora limite.");
        
        setIsSubmitting(true);
        const tid = toast.loading("Asignando tarea...");

        try {
            let fileBase64 = null;
            if (archivoAdjunto) fileBase64 = await fileToBase64(archivoAdjunto);

            const deadlineISO = `${tarea.fecha.format('YYYY-MM-DD')} ${tarea.hora.format('HH:mm:ss')}`;

            const payload = {
                TutorID: user.ID, CourseID: tarea.cursoID, StudentIDs: alumnosSeleccionados,
                Title: tarea.titulo.trim(), Description: tarea.descripcion.trim(), Deadline: deadlineISO,
                HelpMaterialLink: tarea.linkMaterial, fileBase64, fileName: archivoAdjunto?.name, fileType: archivoAdjunto?.type
            };

            const res = await fetch("http://localhost:8000/api/tutor/asignar-tarea", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });

            if ((await res.json()).success) {
                toast.success("Tarea asignada con éxito", { id: tid });
                setTarea({ cursoID: '', titulo: '', descripcion: '', fecha: null, hora: null, linkMaterial: '' });
                setAlumnosSeleccionados([]); setArchivoAdjunto(null);
            } else throw new Error();
        } catch (err) { toast.error("Error al asignar tarea", { id: tid }); } finally { setIsSubmitting(false); }
    };

    if (loadingCursos) return <div style={{ padding: '40px', textAlign: 'center' }}><CircularProgress /></div>;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="mainContent">
                <h2 id="Title">Asignar Tareas</h2>
                <p className="dashboard-subtitle">Define las actividades, adjunta materiales y establece las fechas limite de entrega.</p>

                <div className="agendar-card color-accent" style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit}>
                        
                        <div className="agendar-row-2">
                            <div className="agendar-group">
                                <label>Curso a evaluar</label>
                                <select className="agendar-input" name="cursoID" value={tarea.cursoID} onChange={handleChange} required>
                                    <option value="">Selecciona el curso...</option>
                                    {cursos.map(c => <option key={c.CourseID} value={c.CourseID}>{c.Name} ({c.Level} - {c.Language})</option>)}
                                </select>
                            </div>

                            <div className="agendar-group">
                                <label>Titulo de la tarea</label>
                                <input type="text" className="agendar-input" name="titulo" value={tarea.titulo} placeholder="Ej. Ensayo sobre la Revolucion Francesa" onChange={handleChange} required />
                            </div>
                        </div>

                        {tarea.cursoID && (
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div>
                                        <Typography variant="body1" style={{ fontWeight: 700, color: '#1e293b' }}>Panel de Selección de Alumnos</Typography>
                                        <Typography variant="caption" style={{ color: '#64748b' }}>Seleccionados: {alumnosSeleccionados.length} de {alumnosDelCurso.length}</Typography>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button variant="outlined" size="small" onClick={limpiarSeleccion} style={{ textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}>Limpiar</Button>
                                        <Button variant="contained" size="small" onClick={seleccionarTodos} style={{ textTransform: 'none', backgroundColor: '#68899D', boxShadow: 'none' }}>Seleccionar Todos</Button>
                                    </div>
                                </div>
                                
                                {loadingAlumnos ? <Typography variant="body2">Cargando...</Typography> : alumnosDelCurso.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
                                        {alumnosDelCurso.map(est => {
                                            const isSelected = alumnosSeleccionados.includes(est.ID);
                                            return (
                                                <Paper key={est.ID} variant="outlined" onClick={() => handleAlumnoToggle(est.ID)} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: isSelected ? '#f0f9ff' : '#ffffff', borderColor: isSelected ? '#38bdf8' : '#e2e8f0', borderRadius: '8px' }}>
                                                    <Checkbox checked={isSelected} style={{ padding: '0 10px 0 0', color: isSelected ? '#0284c7' : '#94a3b8' }} />
                                                    <Typography variant="body2" style={{ fontWeight: isSelected ? 600 : 400, color: '#334155' }}>{est.Name}</Typography>
                                                </Paper>
                                            );
                                        })}
                                    </div>
                                ) : <Typography variant="body2" color="error">No hay alumnos inscritos en este curso.</Typography>}
                            </div>
                        )}

                        <div className="agendar-row-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="agendar-group mui-override">
                                <label>Fecha Limite de Entrega</label>
                                <DatePicker value={tarea.fecha} onChange={(v) => setTarea({...tarea, fecha: v})} format="DD/MM/YYYY" slotProps={{ textField: { required: true, placeholder: "Dia maximo" } }} />
                            </div>
                            <div className="agendar-group mui-override">
                                <label>Hora Limite</label>
                                <TimePicker value={tarea.hora} onChange={(v) => setTarea({...tarea, hora: v})} minutesStep={5} slotProps={{ textField: { required: true, placeholder: "Hora maxima" } }} />
                            </div>
                        </div>

                        <div className="agendar-group" style={{ marginBottom: '20px' }}>
                            <label>Instrucciones detalladas</label>
                            <textarea className="agendar-input" name="descripcion" rows="4" style={{ height: 'auto', resize: 'vertical', paddingTop: '12px' }} placeholder="Describe paso a paso..." value={tarea.descripcion} onChange={handleChange} required></textarea>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                            <Typography variant="body2" style={{ fontWeight: 700, color: '#475569', marginBottom: '15px' }}>Material de Apoyo (Opcional)</Typography>
                            <div className="agendar-row-2">
                                <div className="agendar-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Enlace a recurso externo</label>
                                    <input type="url" className="agendar-input" name="linkMaterial" value={tarea.linkMaterial} placeholder="https://..." onChange={handleChange} />
                                </div>
                                <div className="agendar-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Subir archivo de guia</label>
                                    <div onClick={() => document.getElementById('task-file-upload').click()} style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', boxSizing: 'border-box' }}>
                                        <input id="task-file-upload" type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                                        <span style={{ color: archivoAdjunto ? '#3b82f6' : '#64748b', fontSize: '0.9rem', fontWeight: archivoAdjunto ? 600 : 400 }}>{archivoAdjunto ? archivoAdjunto.name : 'Haz clic para adjuntar archivo'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="agendar-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <Button type="submit" variant="contained" disabled={isSubmitting} style={{ textTransform: 'none', backgroundColor: isSubmitting ? '#94a3b8' : '#68899D', boxShadow: 'none', padding: '10px 24px', fontWeight: 600, borderRadius: '8px', fontSize: '1rem' }}>
                                {isSubmitting ? "Publicando..." : "Asignar Tarea"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </LocalizationProvider>
    );
}