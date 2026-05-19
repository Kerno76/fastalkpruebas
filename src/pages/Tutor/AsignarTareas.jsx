import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import toast from 'react-hot-toast';
import { Typography, Checkbox, CircularProgress, Paper, Button, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import '../../styles/App.css';
import '../../styles/Tutor/AgendarSesion.css';

export default function AsignarTareas() {
    const user = JSON.parse(localStorage.getItem('user'));
    const location = useLocation();
    
    const [cursos, setCursos] = useState([]);
    const [alumnosDelCurso, setAlumnosDelCurso] = useState([]);
    const [loadingCursos, setLoadingCursos] = useState(true);
    const [loadingAlumnos, setLoadingAlumnos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [tarea, setTarea] = useState({ cursoID: location.state?.courseId || '', titulo: '', descripcion: '', fecha: null, hora: null });
    const [alumnosSeleccionados, setAlumnosSeleccionados] = useState(location.state?.studentId ? [location.state.studentId] : []);
    
    const [enlaces, setEnlaces] = useState([]);
    const [nuevoEnlace, setNuevoEnlace] = useState('');
    const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);

useEffect(() => {
        const fetchCursos = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/tutor/tutor-cursos/${user.ID}`);
                const data = await res.json();
                if (data.success) {
                    const cursosActivos = data.cursos.filter(c => c.Status === 'Active');
                    setCursos(cursosActivos);
                }
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
                if (data.success) { 
                    setAlumnosDelCurso(data.estudiantes); 
                    if (location.state?.courseId === tarea.cursoID && location.state?.studentId) {
                        setAlumnosSeleccionados([location.state.studentId]);
                    } else {
                        setAlumnosSeleccionados([]);
                    }
                }
            } catch (err) { console.error(err); } finally { setLoadingAlumnos(false); }
        };
        fetchAlumnos();
    }, [tarea.cursoID, location.state]);

    const handleChange = (e) => setTarea({ ...tarea, [e.target.name]: e.target.value });
    const handleAlumnoToggle = (id) => setAlumnosSeleccionados(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
    const seleccionarTodos = () => setAlumnosSeleccionados(alumnosDelCurso.map(a => a.ID));
    const limpiarSeleccion = () => setAlumnosSeleccionados([]);

    const handleAddLink = () => {
        if (nuevoEnlace.trim() && (nuevoEnlace.startsWith('http://') || nuevoEnlace.startsWith('https://'))) {
            setEnlaces([...enlaces, nuevoEnlace.trim()]);
            setNuevoEnlace('');
        } else {
            toast.error("Ingresa un enlace válido que inicie con http:// o https://");
        }
    };
    const handleRemoveLink = (index) => setEnlaces(enlaces.filter((_, i) => i !== index));

    const handleFileChange = (e) => { 
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setArchivosAdjuntos(prev => [...prev, ...newFiles]);
        }
        e.target.value = null; 
    };
    const handleRemoveFile = (index) => setArchivosAdjuntos(archivosAdjuntos.filter((_, i) => i !== index));

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (alumnosSeleccionados.length === 0) return toast.error("Selecciona al menos un alumno.");
        if (!tarea.fecha || !tarea.hora) return toast.error("Selecciona fecha y hora límite.");
        
        setIsSubmitting(true);
        const tid = toast.loading("Asignando tarea...");

        try {
            const archivosData = await Promise.all(
                archivosAdjuntos.map(async (file) => ({
                    fileBase64: await fileToBase64(file),
                    fileName: file.name,
                    fileType: file.type
                }))
            );

            const deadlineISO = `${tarea.fecha.format('YYYY-MM-DD')} ${tarea.hora.format('HH:mm:ss')}`;

            const payload = {
                TutorID: user.ID, CourseID: tarea.cursoID, StudentIDs: alumnosSeleccionados,
                Title: tarea.titulo.trim(), Description: tarea.descripcion.trim(), Deadline: deadlineISO,
                Links: enlaces, Files: archivosData
            };

            const res = await fetch("http://localhost:8000/api/tutor/asignar-tarea", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });

            if ((await res.json()).success) {
                toast.success("Tarea asignada con éxito", { id: tid });
                setTarea({ cursoID: '', titulo: '', descripcion: '', fecha: null, hora: null });
                setAlumnosSeleccionados([]); setArchivosAdjuntos([]); setEnlaces([]);
            } else throw new Error();
        } catch (err) { toast.error("Error al asignar tarea", { id: tid }); } finally { setIsSubmitting(false); }
    };

    if (loadingCursos) return <div style={{ padding: '40px', textAlign: 'center' }}><CircularProgress /></div>;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="mainContent">
                <h2 id="Title">Asignar Tareas</h2>
                <p className="dashboard-subtitle">Define las actividades, adjunta materiales y establece las fechas límite de entrega.</p>

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
                                <label>Título de la tarea</label>
                                <input type="text" className="agendar-input" name="titulo" value={tarea.titulo} placeholder="Ej. Ensayo sobre la Revolución Francesa" onChange={handleChange} required />
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
                                        <Button variant="outlined" size="small" onClick={limpiarSeleccion} style={{ textTransform: 'none' }}>Limpiar</Button>
                                        <Button variant="contained" size="small" onClick={seleccionarTodos} style={{ textTransform: 'none', backgroundColor: '#68899D' }}>Seleccionar Todos</Button>
                                    </div>
                                </div>
                                
                                {loadingAlumnos ? <Typography variant="body2">Cargando...</Typography> : alumnosDelCurso.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
                                        {alumnosDelCurso.map(est => {
                                            const isSelected = alumnosSeleccionados.includes(est.ID);
                                            return (
                                                <Paper key={est.ID} variant="outlined" onClick={() => handleAlumnoToggle(est.ID)} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: isSelected ? '#f0f9ff' : '#ffffff', borderColor: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                                                    <Checkbox checked={isSelected} style={{ padding: '0 10px 0 0', color: isSelected ? '#0284c7' : '#94a3b8' }} />
                                                    <Typography variant="body2" style={{ fontWeight: isSelected ? 600 : 400 }}>{est.Name}</Typography>
                                                </Paper>
                                            );
                                        })}
                                    </div>
                                ) : <Typography variant="body2" color="error">No hay alumnos inscritos en este curso.</Typography>}
                            </div>
                        )}

                        <div className="agendar-row-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="agendar-group mui-override">
                                <label>Fecha Límite</label>
                                <DatePicker value={tarea.fecha} onChange={(v) => setTarea({...tarea, fecha: v})} format="DD/MM/YYYY" slotProps={{ textField: { required: true } }} />
                            </div>
                            <div className="agendar-group mui-override">
                                <label>Hora Límite</label>
                                <TimePicker value={tarea.hora} onChange={(v) => setTarea({...tarea, hora: v})} minutesStep={5} slotProps={{ textField: { required: true } }} />
                            </div>
                        </div>

                        <div className="agendar-group" style={{ marginBottom: '20px' }}>
                            <label>Instrucciones detalladas</label>
                            <textarea className="agendar-input" name="descripcion" rows="4" style={{ resize: 'vertical', paddingTop: '12px' }} value={tarea.descripcion} onChange={handleChange} required></textarea>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                            <Typography variant="body1" style={{ fontWeight: 700, color: '#475569', marginBottom: '20px' }}>Material de Apoyo (Opcional)</Typography>
                            <div className="agendar-row-2">
                                <div className="agendar-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.85rem' }}>Agregar Enlaces Externos</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                        <input type="url" className="agendar-input" placeholder="https://..." value={nuevoEnlace} onChange={(e) => setNuevoEnlace(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())} style={{ flexGrow: 1 }} />
                                        <Button variant="outlined" onClick={handleAddLink} style={{ minWidth: '45px', padding: 0 }}><AddCircleOutlineIcon /></Button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {enlaces.map((link, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                                <Typography variant="caption" style={{ color: '#0284c7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</Typography>
                                                <IconButton size="small" color="error" onClick={() => handleRemoveLink(index)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="agendar-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.85rem' }}>Subir Archivos de Guía</label>
                                    <div onClick={() => document.getElementById('task-file-upload').click()} style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', marginBottom: '10px' }}>
                                        <input id="task-file-upload" type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                                        <span style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: 600 }}>Haz clic para adjuntar archivos</span>
                                    </div>

                                    {archivosAdjuntos.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                            {archivosAdjuntos.map((file, index) => {
                                                const isImage = file.type.startsWith('image/');
                                                return (
                                                    <Paper key={index} elevation={1} style={{ position: 'relative', padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <IconButton size="small" onClick={() => handleRemoveFile(index)} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '22px', height: '22px' }}>
                                                            <DeleteOutlineIcon style={{ fontSize: '14px' }} />
                                                        </IconButton>
                                                        <div style={{ width: '40px', height: '40px', marginBottom: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            {isImage ? <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <InsertDriveFileIcon style={{ fontSize: '32px', color: '#94a3b8' }} />}
                                                        </div>
                                                        <Typography variant="caption" style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{file.name}</Typography>
                                                    </Paper>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="agendar-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <Button type="submit" variant="contained" disabled={isSubmitting} style={{ textTransform: 'none', backgroundColor: isSubmitting ? '#94a3b8' : '#68899D', padding: '10px 24px', fontWeight: 600 }}>
                                {isSubmitting ? "Publicando..." : "Asignar Tarea"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </LocalizationProvider>
    );
}