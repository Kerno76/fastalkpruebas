import { useState, useEffect } from 'react';
import { Typography, Paper, Button, IconButton, Dialog, Chip, TextField, InputAdornment, Checkbox, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import ClassIcon from '@mui/icons-material/Class';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import toast from 'react-hot-toast';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

import '../../styles/App.css';
import '../../styles/Tutor/Calificar.css';

export default function CalificarTareas() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [estudiantesData, setEstudiantesData] = useState([]);
    const [tareasPublicadas, setTareasPublicadas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('Calificar'); 

    const [openCalificar, setOpenCalificar] = useState(false);
    const [tareaACalificar, setTareaACalificar] = useState(null);
    const [calificacion, setCalificacion] = useState('');
    const [feedback, setFeedback] = useState('');
    const [permitirReenvio, setPermitirReenvio] = useState(false);

    const [openEditTask, setOpenEditTask] = useState(false);
    const [tareaAEditar, setTareaAEditar] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editDate, setEditDate] = useState(null);
    const [editTime, setEditTime] = useState(null);
    
    const [editLinks, setEditLinks] = useState([]);
    const [nuevoEditLink, setNuevoEditLink] = useState('');
    const [editExistingFiles, setEditExistingFiles] = useState([]);
    const [editNewFiles, setEditNewFiles] = useState([]);
    
    const [alumnosCursoParaEditar, setAlumnosCursoParaEditar] = useState([]);
    const [alumnosSeleccionadosEdit, setAlumnosSeleccionadosEdit] = useState([]);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    const [openResumen, setOpenResumen] = useState(false);
    const [tareaResumen, setTareaResumen] = useState(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/tutor/tareas-calificar/${user.ID}`);
            const data = await res.json();
            if (data.success) {
                setEstudiantesData(data.estudiantes);
                setTareasPublicadas(data.publicadas);
            } else {
                toast.error("Error del servidor: " + data.message);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (user?.ID) fetchData(); }, [user?.ID]);

    const handleGuardarCalificacion = async () => {
        const tid = toast.loading("Guardando calificación...");
        try {
            const res = await fetch("http://localhost:8000/api/tutor/calificar-tarea", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    AssignmentID: tareaACalificar.id, Grade: calificacion, Feedback: feedback,
                    AllowResubmit: permitirReenvio, StudentID: tareaACalificar.studentId, 
                    TutorID: user.ID, Title: tareaACalificar.title
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Calificada con éxito", { id: tid });
                setOpenCalificar(false); fetchData();
            } else { throw new Error(data.message); }
        } catch (err) { toast.error(`Error: ${err.message}`, { id: tid }); }
    };

    const handleCancelarTarea = async (tareaGroup) => {
        if (!window.confirm("¿Seguro que deseas cancelar esta tarea para todos los alumnos?")) return;
        const tid = toast.loading("Cancelando tarea...");
        try {
            const res = await fetch("http://localhost:8000/api/tutor/cancelar-tarea", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ AssignmentIDs: tareaGroup.AssignmentIDs, Title: tareaGroup.Title, TutorID: user.ID, StudentIDs: tareaGroup.StudentIDs })
            });
            if ((await res.json()).success) {
                toast.success("Tarea cancelada correctamente", { id: tid });
                fetchData();
            } else throw new Error();
        } catch (err) { toast.error("Error al cancelar la tarea", { id: tid }); }
    };

    const handleAbrirEdicion = async (tareaGroup) => {
        setTareaAEditar(tareaGroup); setEditTitle(tareaGroup.Title); setEditDesc(tareaGroup.Description);
        setEditDate(dayjs(tareaGroup.Deadline)); setEditTime(dayjs(tareaGroup.Deadline));
        setEditLinks(tareaGroup.HelpMaterialLink ? JSON.parse(tareaGroup.HelpMaterialLink) : []);
        setEditExistingFiles(tareaGroup.HelpMaterialFile ? JSON.parse(tareaGroup.HelpMaterialFile) : []);
        setEditNewFiles([]); setNuevoEditLink(''); setAlumnosSeleccionadosEdit(tareaGroup.StudentIDs);
        setOpenEditTask(true);
        try {
            const res = await fetch(`http://localhost:8000/api/tutor/estudiantes-curso/${tareaGroup.CourseID}`);
            const data = await res.json();
            if (data.success) setAlumnosCursoParaEditar(data.estudiantes);
        } catch (err) { console.error(err); }
    };

    const toggleAlumnoEdit = (id) => setAlumnosSeleccionadosEdit(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleAddEditLink = () => {
        if (nuevoEditLink.trim() && (nuevoEditLink.startsWith('http://') || nuevoEditLink.startsWith('https://'))) {
            setEditLinks([...editLinks, nuevoEditLink.trim()]); setNuevoEditLink('');
        } else toast.error("Ingresa un enlace válido (http:// o https://)");
    };
    
    const handleRemoveEditLink = (index) => setEditLinks(editLinks.filter((_, i) => i !== index));
    const handleRemoveExistingFile = (index) => setEditExistingFiles(editExistingFiles.filter((_, i) => i !== index));
    const handleRemoveNewFile = (index) => setEditNewFiles(editNewFiles.filter((_, i) => i !== index));
    const handleEditFileChange = (e) => { if (e.target.files) setEditNewFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = null; };
    const fileToBase64 = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e); });

    const handleUpdateTaskGeneral = async () => {
        if (!editDate || !editTime) return toast.error("Selecciona fecha y hora límite.");
        if (alumnosSeleccionadosEdit.length === 0) return toast.error("Debe haber al menos un alumno seleccionado.");
        setIsSubmittingEdit(true);
        const tid = toast.loading("Actualizando tarea...");
        try {
            const archivosNuevosData = await Promise.all(editNewFiles.map(async (file) => ({ fileBase64: await fileToBase64(file), fileName: file.name, fileType: file.type })));
            const deadlineISO = `${editDate.format('YYYY-MM-DD')} ${editTime.format('HH:mm:ss')}`;
            const payload = { AssignmentIDs: tareaAEditar.AssignmentIDs, CurrentStudentIDs: tareaAEditar.StudentIDs, NewStudentIDs: alumnosSeleccionadosEdit, CourseID: tareaAEditar.CourseID, TutorID: user.ID, Title: editTitle.trim(), Description: editDesc.trim(), Deadline: deadlineISO, Links: editLinks, ExistingFiles: editExistingFiles, NewFiles: archivosNuevosData };
            const res = await fetch("http://localhost:8000/api/tutor/editar-tarea-completa", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if ((await res.json()).success) { toast.success("Tarea actualizada con éxito", { id: tid }); setOpenEditTask(false); fetchData(); } else throw new Error();
        } catch (err) { toast.error("Error al actualizar la tarea", { id: tid }); } finally { setIsSubmittingEdit(false); }
    };

    const isImageUrl = (url) => url && url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
    const safeParse = (str) => { if (!str) return []; try { const p = JSON.parse(str); return Array.isArray(p) ? p : [str]; } catch { return [str]; } };

    const handleAbrirResumen = (tareaGroup) => {
        setTareaResumen(tareaGroup);
        setOpenResumen(true);
    };

    const estudiantesActivos = estudiantesData.map(est => ({
        ...est,
        tasks: est.tasks.filter(t => t.courseStatus === 'Active')
    })).filter(est => est.tasks.length > 0);

    const datosFiltrados = estudiantesActivos.filter(est => est.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const tareasActivasPublicadas = tareasPublicadas.filter(tp => tp.CourseStatus === 'Active');
    const tareasInactivas = tareasPublicadas.filter(tp => tp.CourseStatus !== 'Active');
    
    const historialPorCurso = Object.values(tareasInactivas.reduce((acc, tarea) => {
        if (!acc[tarea.CourseID]) { acc[tarea.CourseID] = { courseName: tarea.CourseName, tareas: [] }; }
        acc[tarea.CourseID].tareas.push(tarea);
        return acc;
    }, {}));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className='mainContent'>
                
                <div className="header-container" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h2 className="dashboard-title">Centro de Tareas</h2>
                        
                        {viewMode === 'Calificar' && (
                            <TextField 
                                size="small" placeholder="Buscar alumno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), style: { backgroundColor: 'white', borderRadius: '8px', width: '280px', marginTop: '10px' } }}
                            />
                        )}
                    </div>

                    <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px', flexWrap: 'wrap', gap: '4px' }}>
                        <Button startIcon={<FactCheckIcon />} onClick={() => setViewMode('Calificar')} style={{ backgroundColor: viewMode === 'Calificar' ? '#fff' : 'transparent', color: viewMode === 'Calificar' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', boxShadow: viewMode === 'Calificar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            Por Calificar
                        </Button>
                        <Button startIcon={<SettingsSuggestIcon />} onClick={() => setViewMode('Gestion')} style={{ backgroundColor: viewMode === 'Gestion' ? '#fff' : 'transparent', color: viewMode === 'Gestion' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', boxShadow: viewMode === 'Gestion' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            Gestión de Tareas
                        </Button>
                        <Button startIcon={<FolderCopyIcon />} onClick={() => setViewMode('Historial')} style={{ backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent', color: viewMode === 'Historial' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', boxShadow: viewMode === 'Historial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            Historial Cursos
                        </Button>
                    </div>
                </div>

                {viewMode === 'Calificar' && (
                    <div className="students-tasks-grid">
                        {datosFiltrados.length > 0 ? datosFiltrados.map(est => {
                            const parts = est.course.split(' ');
                            const level = parts.length > 1 ? parts.pop() : '';
                            const courseName = parts.join(' ');

                            return (
                                <div key={est.id} className="student-task-section">
                                    <Paper className="student-header-pill" elevation={0} style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                                        <Typography className="shp-name" style={{ marginBottom: '8px' }}>{est.name}</Typography>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <Chip label={`Curso: ${courseName}`} size="small" style={{ backgroundColor: 'var(--student-card, #e2e8f0)', color: '#475569', fontWeight: 600 }} />
                                            {level && <Chip label={`Nivel: ${level}`} size="small" style={{ backgroundColor: 'var(--student-card, #e0f2fe)', color: '#0369a1', fontWeight: 700 }} />}
                                        </div>
                                    </Paper>
                                    <div className="tasks-container">
                                        {est.tasks.map(task => (
                                            <Paper key={task.id} className="task-card" elevation={0}>
                                                <div className="task-info">
                                                    <Typography className="task-title">{task.title}</Typography>
                                                    <Typography variant="caption">Límite: {new Date(task.date).toLocaleString()}</Typography>
                                                    <div style={{ marginTop: '5px' }}>
                                                        <Chip label={task.status} size="small" style={{ backgroundColor: task.status === 'Pendiente por Calificar' ? '#fef08a' : '#f1f5f9' }} />
                                                        {task.grade && <Chip label={task.grade} size="small" color="primary" style={{ marginLeft: '10px' }} />}
                                                    </div>
                                                </div>
                                                <button className="btn-task-action btn-main" onClick={() => { 
                                                    setTareaACalificar({...task, studentId: est.id}); 
                                                    setCalificacion(task.grade ? task.grade.split('/')[0] : '');
                                                    setFeedback(''); setPermitirReenvio(false); setOpenCalificar(true); 
                                                }}>
                                                    {task.status === 'Calificada' ? "Editar Nota" : "Calificar"}
                                                </button>
                                            </Paper>
                                        ))}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: 'var(--student-card, #f8fafc)', borderRadius: '12px' }}>
                                <FactCheckIcon style={{ fontSize: 40, color: '#94a3b8', marginBottom: '10px' }} />
                                <Typography style={{ color: 'var(--text-main, #475569)', fontWeight: 600 }}>Sin entregas pendientes</Typography>
                                <Typography style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Las tareas de tus cursos activos aparecerán aquí cuando los alumnos envíen evidencia.</Typography>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'Gestion' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {tareasActivasPublicadas.length > 0 ? tareasActivasPublicadas.map((tp, idx) => (
                            <Paper key={idx} elevation={0} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: 'var(--student-card, #f8fafc)' }}>
                                <div>
                                    <Typography variant="h6" style={{ fontWeight: 700, color: 'var(--text-main, #1e293b)'}}>{tp.Title}</Typography>
                                    <Typography variant="body2" style={{ color: 'var(--text-main, #64748b)', marginBottom: '8px' }}>Curso: {tp.CourseName} | Asignada a {tp.StudentIDs.length} alumno(s)</Typography>
                                    <Typography variant="caption" style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>Fecha Límite: {new Date(tp.Deadline).toLocaleString()}</Typography>
                                </div>
                                <div style={{ display: 'flex', gap: '10px',}}>
                                    <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleAbrirEdicion(tp)} style={{ color: '#68899D', borderColor: '#68899D', textTransform: 'none', fontWeight: 600 }}>Editar Tarea</Button>
                                    <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleCancelarTarea(tp)} style={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
                                </div>
                            </Paper>
                        )) : (
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                                <SettingsSuggestIcon style={{ fontSize: 40, color: '#94a3b8', marginBottom: '10px' }} />
                                <Typography style={{ color: '#475569', fontWeight: 600 }}>No hay tareas activas.</Typography>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'Historial' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {historialPorCurso.length > 0 ? historialPorCurso.map((grupo, idx) => (
                            <div key={idx}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                                    <ClassIcon style={{ color: '#3b82f6' }} />
                                    <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b' }}>
                                        {grupo.courseName} <span style={{fontSize:'0.85rem', color:'#94a3b8', fontWeight:'normal'}}>(Curso Finalizado)</span>
                                    </Typography>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                                    {grupo.tareas.map((tarea, tIdx) => (
                                        <Paper key={tIdx} elevation={0} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
                                                <AssignmentIcon style={{ color: '#94a3b8', marginTop: '2px' }} />
                                                <div>
                                                    <Typography style={{ fontWeight: 700, color: '#334155', lineHeight: 1.2, marginBottom: '5px' }}>{tarea.Title}</Typography>
                                                    <Typography variant="caption" style={{ color: '#64748b', display: 'block' }}>
                                                        Entregada a: {tarea.StudentIDs.length} alumnos
                                                    </Typography>
                                                    <Typography variant="caption" style={{ color: '#64748b', display: 'block' }}>
                                                        Finalizó el: {new Date(tarea.Deadline).toLocaleDateString()}
                                                    </Typography>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => handleAbrirResumen(tarea)}
                                                style={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1', fontWeight: 600 }}
                                            >
                                                Ver Resumen de Tarea
                                            </Button>
                                        </Paper>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--student-card, #f8fafc)', borderRadius: '12px' }}>
                                <FolderCopyIcon style={{ fontSize: 40, color: '#94a3b8', marginBottom: '10px' }} />
                                <Typography style={{ color: 'var(--text-main, #475569)', fontWeight: 600 }}>Tu historial está vacío.</Typography>
                                <Typography style={{ color: 'var(--text-main, #94a3b8)', fontSize: '0.9rem' }}>Aquí aparecerán las tareas de los cursos que ya hayan concluido.</Typography>
                            </div>
                        )}
                    </div>
                )}

                <Dialog open={openResumen} onClose={() => setOpenResumen(false)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                    <div style={{ padding: '30px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
                        <IconButton onClick={() => setOpenResumen(false)} style={{ position: 'absolute', right: 15, top: 15 }}><CloseIcon /></IconButton>
                        <Typography variant="h5" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '5px' }}>Resumen de Tarea</Typography>
                        
                        {tareaResumen && (
                            <>
                                <Chip label="Archivo Histórico" size="small" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600, marginBottom: '20px' }} />
                                <Typography style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>{tareaResumen.Title}</Typography>
                                
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <Typography variant="caption" style={{ color: '#64748b', fontWeight: 700 }}>CURSO</Typography>
                                        <Typography variant="body2" style={{ fontWeight: 600 }}>{tareaResumen.CourseName}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="caption" style={{ color: '#64748b', fontWeight: 700 }}>FECHA LÍMITE</Typography>
                                        <Typography variant="body2" style={{ fontWeight: 600 }}>{new Date(tareaResumen.Deadline).toLocaleDateString()}</Typography>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>INSTRUCCIONES ORIGINALES</Typography>
                                    <Typography variant="body2" style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{tareaResumen.Description}</Typography>
                                </div>

                                <Divider style={{ margin: '25px 0' }} />
                                <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '15px' }}>
                                    Registro de Entregas ({tareaResumen.Entregas?.length || 0})
                                </Typography>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {tareaResumen.Entregas?.map((entrega, idx) => {
                                        const sLinks = safeParse(entrega.studentUrl);
                                        const sFiles = safeParse(entrega.studentFile);
                                        const hasSubmission = sLinks.length > 0 || sFiles.length > 0;
                                        
                                        let statusColor = '#94a3b8';
                                        let statusText = 'Pendiente';
                                        if (entrega.status?.toLowerCase() === 'submitted') { statusColor = '#3b82f6'; statusText = 'Entregada'; }
                                        if (entrega.status?.toLowerCase() === 'graded') { statusColor = '#16a34a'; statusText = 'Calificada'; }
                                        if (entrega.status?.toLowerCase() === 'canceled') { statusColor = '#ef4444'; statusText = 'Cancelada'; }

                                        return (
                                            <Paper key={idx} elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <Typography style={{ fontWeight: 700, color: '#334155' }}>{entrega.studentName}</Typography>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <Chip label={statusText} size="small" style={{ backgroundColor: `${statusColor}20`, color: statusColor, fontWeight: 700 }} />
                                                        {entrega.grade && <Typography variant="body2" style={{ fontWeight: 800, color: '#16a34a' }}>{entrega.grade}/100</Typography>}
                                                    </div>
                                                </div>
                                                
                                                {hasSubmission ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                                                        {sLinks.length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                {sLinks.map((link, i) => {
                                                                    const url = typeof link === 'string' ? link : link.url;
                                                                    return (
                                                                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#0284c7', fontSize: '0.85rem', backgroundColor: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>
                                                                            <LinkIcon style={{ fontSize: '1rem' }} /> Enlace
                                                                        </a>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                        {sFiles.length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                                {sFiles.map((f, i) => {
                                                                    const fileUrl = f.url || f;
                                                                    const fileName = f.name || 'Archivo';
                                                                    return (
                                                                        <a key={i} href={fileUrl} target="_blank" rel="noreferrer" download style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                                                                            <InsertDriveFileIcon style={{ fontSize: '1rem', color: '#94a3b8' }} />
                                                                            <Typography variant="caption" style={{ fontWeight: 600 }}>{fileName}</Typography>
                                                                        </a>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Typography variant="body2" style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '5px' }}>El alumno no adjuntó evidencia.</Typography>
                                                )}
                                                
                                                {entrega.feedback && (
                                                    <Typography variant="body2" style={{ marginTop: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                                                        <strong style={{color:'#334155'}}>Feedback del Tutor:</strong> {entrega.feedback}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        );
                                    })}
                                </div>
                                
                                <Button variant="outlined" fullWidth onClick={() => setOpenResumen(false)} style={{ marginTop: '25px', textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#cbd5e1' }}>
                                    Cerrar Resumen
                                </Button>
                            </>
                        )}
                    </div>
                </Dialog>

                <Dialog open={openCalificar} onClose={() => setOpenCalificar(false)} maxWidth="sm" fullWidth>
                    <div style={{ padding: '30px', position: 'relative' }}>
                        <IconButton onClick={() => setOpenCalificar(false)} style={{ position: 'absolute', right: 15, top: 15 }}><CloseIcon /></IconButton>
                        <Typography variant="h5" style={{ fontWeight: 800 }}>Calificar Entrega</Typography>
                        
                        {tareaACalificar && (
                            <>
                                <Typography style={{ margin: '15px 0', fontWeight: 700, fontSize: '1.1rem' }}>{tareaACalificar.title}</Typography>
                                
                                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" style={{ fontWeight: 800, color: '#475569', display: 'block', marginBottom: '15px' }}>EVIDENCIAS ENTREGADAS:</Typography>
                                    
                                    {(() => {
                                        const studentLinks = safeParse(tareaACalificar.urlAlumno);
                                        const studentFiles = safeParse(tareaACalificar.archivoAlumno);

                                        if (studentLinks.length === 0 && studentFiles.length === 0) {
                                            return (
                                                <Typography variant="body2" style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: 600 }}>
                                                    El alumno marcó la tarea como entregada pero no adjuntó archivos ni enlaces.
                                                </Typography>
                                            );
                                        }

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {studentLinks.length > 0 && (
                                                    <div>
                                                        <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b' }}>ENLACES EXTERNOS</Typography>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                                            {studentLinks.map((link, idx) => {
                                                                const url = typeof link === 'string' ? link : link.url; 
                                                                return (
                                                                    <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                                                        <Paper elevation={0} style={{ padding: '8px 12px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                            <LinkIcon style={{ color: '#0284c7', fontSize: '1.2rem' }} />
                                                                            <Typography variant="body2" style={{ color: '#0369a1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</Typography>
                                                                        </Paper>
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {studentFiles.length > 0 && (
                                                    <div>
                                                        <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b' }}>ARCHIVOS ADJUNTOS</Typography>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                                                            {studentFiles.map((file, idx) => {
                                                                const isObj = typeof file === 'object';
                                                                const fileUrl = isObj ? file.url : file;
                                                                const fileName = isObj ? file.name : 'Archivo Adjunto';
                                                                const isImg = isImageUrl(fileUrl);
                                                                
                                                                return (
                                                                    <a key={idx} href={fileUrl} target="_blank" rel="noreferrer" download style={{ textDecoration: 'none' }}>
                                                                        <Paper elevation={1} style={{ padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px', transition: 'transform 0.2s', border: '1px solid #e2e8f0' }}>
                                                                            <div style={{ width: '50px', height: '50px', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                                                                                {isImg ? <img src={fileUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <InsertDriveFileIcon style={{ fontSize: '36px', color: '#94a3b8' }} />}
                                                                            </div>
                                                                            <Typography variant="caption" style={{ fontSize: '0.65rem', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569', fontWeight: 700 }}>{fileName}</Typography>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '4px' }}>
                                                                                <DownloadIcon style={{ fontSize: '14px' }} />
                                                                                <Typography variant="caption" style={{ fontSize: '0.65rem', fontWeight: 800 }}>Descargar</Typography>
                                                                            </div>
                                                                        </Paper>
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', marginBottom: '5px', display: 'block' }}>ASIGNAR CALIFICACIÓN (0 - 100)</Typography>
                                <TextField type="number" size="small" fullWidth value={calificacion} onChange={(e) => setCalificacion(e.target.value)} style={{ marginBottom: '20px' }} />
                                
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', marginBottom: '5px', display: 'block' }}>RETROALIMENTACIÓN</Typography>
                                <TextField multiline rows={3} fullWidth placeholder="Comentarios para el alumno..." value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ marginBottom: '15px' }} />
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                                    <Checkbox id="resubmit" checked={permitirReenvio} onChange={(e) => setPermitirReenvio(e.target.checked)} style={{ padding: 0, color: '#68899D' }} />
                                    <label htmlFor="resubmit" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>Permitir que el alumno reenvíe la tarea (Re-entrega)</label>
                                </div>

                                <Button variant="contained" fullWidth style={{ backgroundColor: '#68899D', padding: '12px', fontWeight: 700, textTransform: 'none', fontSize: '1rem', boxShadow: 'none', borderRadius: '8px' }} onClick={handleGuardarCalificacion}>
                                    Guardar Calificación
                                </Button>
                            </>
                        )}
                    </div>
                </Dialog>

                <Dialog open={openEditTask} onClose={() => setOpenEditTask(false)} maxWidth="md" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                    <div style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <Typography variant="h5" style={{ fontWeight: 800 }}>Editar Tarea</Typography>
                            <IconButton onClick={() => setOpenEditTask(false)}><CloseIcon /></IconButton>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <TextField label="Título de la tarea" fullWidth size="small" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <DatePicker label="Fecha Límite" value={editDate} onChange={(v) => setEditDate(v)} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                                <TimePicker label="Hora Límite" value={editTime} onChange={(v) => setEditTime(v)} minutesStep={5} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                            </div>
                        </div>

                        <TextField label="Instrucciones" fullWidth multiline rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={{ marginBottom: '20px' }} />

                        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '15px' }}>ACTUALIZAR MATERIAL DE APOYO</Typography>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Enlaces Externos</label>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '10px' }}>
                                        <TextField size="small" placeholder="https://..." value={nuevoEditLink} onChange={(e) => setNuevoEditLink(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEditLink())} fullWidth />
                                        <Button variant="outlined" onClick={handleAddEditLink} style={{ minWidth: '45px', padding: 0, borderColor: '#cbd5e1' }}><AddCircleOutlineIcon /></Button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                                        {editLinks.map((link, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <Typography variant="caption" style={{ color: '#0284c7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{link}</Typography>
                                                <IconButton size="small" color="error" onClick={() => handleRemoveEditLink(idx)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Archivos Adjuntos</label>
                                    <div onClick={() => document.getElementById('edit-file-upload').click()} style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '8px', textAlign: 'center', backgroundColor: '#ffffff', cursor: 'pointer', marginTop: '8px', marginBottom: '10px' }}>
                                        <input id="edit-file-upload" type="file" multiple onChange={handleEditFileChange} style={{ display: 'none' }} />
                                        <Typography variant="body2" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Añadir archivos</Typography>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', maxHeight: '130px', overflowY: 'auto', padding: '2px' }}>
                                        {editExistingFiles.map((file, index) => {
                                            const isImage = isImageUrl(file.url);
                                            return (
                                                <Paper key={`exist-${index}`} elevation={1} style={{ position: 'relative', padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <IconButton size="small" onClick={() => handleRemoveExistingFile(index)} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '22px', height: '22px' }}><DeleteOutlineIcon style={{ fontSize: '14px' }} /></IconButton>
                                                    <div style={{ width: '35px', height: '35px', marginBottom: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                                        {isImage ? <img src={file.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <InsertDriveFileIcon style={{ fontSize: '28px', color: '#94a3b8' }} />}
                                                    </div>
                                                    <Typography variant="caption" style={{ fontSize: '0.6rem', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>{file.name}</Typography>
                                                </Paper>
                                            );
                                        })}
                                        {editNewFiles.map((file, index) => {
                                            const isImage = file.type.startsWith('image/');
                                            return (
                                                <Paper key={`new-${index}`} elevation={1} style={{ position: 'relative', padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
                                                    <IconButton size="small" onClick={() => handleRemoveNewFile(index)} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '22px', height: '22px' }}><DeleteOutlineIcon style={{ fontSize: '14px' }} /></IconButton>
                                                    <div style={{ width: '35px', height: '35px', marginBottom: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                                        {isImage ? <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <InsertDriveFileIcon style={{ fontSize: '28px', color: '#22c55e' }} />}
                                                    </div>
                                                    <Typography variant="caption" style={{ fontSize: '0.6rem', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#166534' }}>{file.name}</Typography>
                                                </Paper>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px', maxHeight: '180px', overflowY: 'auto' }}>
                            <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px' }}>ALUMNOS DEL CURSO: {tareaAEditar?.CourseName}</Typography>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {alumnosCursoParaEditar.length > 0 ? alumnosCursoParaEditar.map(est => (
                                    <Paper key={est.ID} variant="outlined" onClick={() => toggleAlumnoEdit(est.ID)} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: alumnosSeleccionadosEdit.includes(est.ID) ? '#e0f2fe' : '#fff', borderColor: alumnosSeleccionadosEdit.includes(est.ID) ? '#38bdf8' : '#e2e8f0' }}>
                                        <Checkbox checked={alumnosSeleccionadosEdit.includes(est.ID)} size="small" style={{ padding: 0, marginRight: '8px', color: '#0284c7' }} />
                                        <Typography variant="body2" style={{ fontWeight: alumnosSeleccionadosEdit.includes(est.ID) ? 600 : 400 }}>{est.Name}</Typography>
                                    </Paper>
                                )) : <Typography variant="body2" color="textSecondary">No se encontraron alumnos.</Typography>}
                            </div>
                        </div>

                        <Button variant="contained" fullWidth disabled={isSubmittingEdit} onClick={handleUpdateTaskGeneral} style={{ backgroundColor: isSubmittingEdit ? '#94a3b8' : '#68899D', padding: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
                            {isSubmittingEdit ? "Guardando Cambios..." : "Actualizar Tarea"}
                        </Button>
                    </div>
                </Dialog>
            </div>
        </LocalizationProvider>
    );
}