import { useState, useEffect } from 'react';
import { Typography, Paper, Button, IconButton, Dialog, Chip, TextField, InputAdornment, Tabs, Tab, Checkbox } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [tabIndex, setTabIndex] = useState(0);

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
    const [editLink, setEditLink] = useState('');
    const [editFile, setEditFile] = useState(null);
    const [removeExistingFile, setRemoveExistingFile] = useState(false);
    
    const [alumnosCursoParaEditar, setAlumnosCursoParaEditar] = useState([]);
    const [alumnosSeleccionadosEdit, setAlumnosSeleccionadosEdit] = useState([]);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

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
                    AssignmentID: tareaACalificar.id, 
                    Grade: calificacion, 
                    Feedback: feedback,
                    AllowResubmit: permitirReenvio,
                    StudentID: tareaACalificar.studentId, 
                    TutorID: user.ID, 
                    Title: tareaACalificar.title
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Calificada con éxito", { id: tid });
                setOpenCalificar(false); 
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (err) { toast.error(`Error: ${err.message}`, { id: tid }); }
    };

    const handleCancelarTarea = async (tareaGroup) => {
        if (!window.confirm("¿Seguro que deseas cancelar esta tarea para todos los alumnos?")) return;
        const tid = toast.loading("Cancelando tarea...");
        try {
            const res = await fetch("http://localhost:8000/api/tutor/cancelar-tarea", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    AssignmentIDs: tareaGroup.AssignmentIDs, Title: tareaGroup.Title,
                    TutorID: user.ID, StudentIDs: tareaGroup.StudentIDs
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Tarea cancelada correctamente", { id: tid });
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (err) { toast.error(`Error al cancelar: ${err.message}`, { id: tid }); }
    };

    const handleAbrirEdicion = async (tareaGroup) => {
        setTareaAEditar(tareaGroup);
        setEditTitle(tareaGroup.Title);
        setEditDesc(tareaGroup.Description);
        setEditDate(dayjs(tareaGroup.Deadline));
        setEditTime(dayjs(tareaGroup.Deadline));
        setEditLink(tareaGroup.HelpMaterialLink || '');
        setAlumnosSeleccionadosEdit(tareaGroup.StudentIDs);
        setEditFile(null);
        setRemoveExistingFile(false);
        setOpenEditTask(true);

        try {
            const res = await fetch(`http://localhost:8000/api/tutor/estudiantes-curso/${tareaGroup.CourseID}`);
            const data = await res.json();
            if (data.success) {
                setAlumnosCursoParaEditar(data.estudiantes);
            }
        } catch (err) { console.error(err); }
    };

    const toggleAlumnoEdit = (id) => {
        setAlumnosSeleccionadosEdit(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e);
    });

    const handleUpdateTaskGeneral = async () => {
        if (!editDate || !editTime) return toast.error("Selecciona fecha y hora límite.");
        if (alumnosSeleccionadosEdit.length === 0) return toast.error("Debe haber al menos un alumno seleccionado.");

        setIsSubmittingEdit(true);
        const tid = toast.loading("Actualizando tarea...");

        try {
            let fileBase64 = null;
            if (editFile) fileBase64 = await fileToBase64(editFile);
            
            const deadlineISO = `${editDate.format('YYYY-MM-DD')} ${editTime.format('HH:mm:ss')}`;

            const payload = {
                AssignmentIDs: tareaAEditar.AssignmentIDs,
                CurrentStudentIDs: tareaAEditar.StudentIDs,
                NewStudentIDs: alumnosSeleccionadosEdit,
                CourseID: tareaAEditar.CourseID,
                TutorID: user.ID,
                Title: editTitle.trim(),
                Description: editDesc.trim(),
                Deadline: deadlineISO,
                HelpMaterialLink: editLink,
                fileBase64,
                fileName: editFile?.name,
                fileType: editFile?.type,
                existingFileUrl: tareaAEditar.HelpMaterialFile,
                removeExistingFile: removeExistingFile
            };

            const res = await fetch("http://localhost:8000/api/tutor/editar-tarea-completa", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Tarea actualizada y notificada", { id: tid });
                setOpenEditTask(false); 
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (err) { toast.error(`Error: ${err.message}`, { id: tid }); }
        finally { setIsSubmittingEdit(false); }
    };

    const datosFiltrados = estudiantesData.filter(est => est.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className='mainContent'>
                <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 id="Title">Centro de Tareas</h2>
                    {tabIndex === 0 && (
                        <TextField 
                            size="small" placeholder="Buscar alumno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), style: { backgroundColor: 'white', borderRadius: '8px', width: '250px' } }}
                        />
                    )}
                </div>

                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} style={{ marginBottom: '30px' }} TabIndicatorProps={{ style: { backgroundColor: '#68899D' } }}>
                    <Tab label="Calificar Entregas" style={{ textTransform: 'none', fontWeight: 600, fontSize: '1rem', color: tabIndex === 0 ? '#68899D' : '#64748b' }} />
                    <Tab label="Historial de Asignaciones" style={{ textTransform: 'none', fontWeight: 600, fontSize: '1rem', color: tabIndex === 1 ? '#68899D' : '#64748b' }} />
                </Tabs>

                {tabIndex === 0 && (
                    <div className="students-tasks-grid">
                        {datosFiltrados.length > 0 ? datosFiltrados.map(est => (
                            <div key={est.id} className="student-task-section">
                                <Paper className="student-header-pill" elevation={0}>
                                    <Typography className="shp-name">{est.name}</Typography>
                                    <span className="curso-tag">Curso: {est.course}</span>
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
                                                setFeedback('');
                                                setPermitirReenvio(false);
                                                setOpenCalificar(true); 
                                            }}>
                                                {task.status === 'Calificada' ? "Editar Nota" : "Calificar"}
                                            </button>
                                        </Paper>
                                    ))}
                                </div>
                            </div>
                        )) : <Typography style={{color:'#64748b'}}>No hay tareas entregadas por el momento.</Typography>}
                    </div>
                )}

                {tabIndex === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {tareasPublicadas.length > 0 ? tareasPublicadas.map((tp, idx) => (
                            <Paper key={idx} elevation={0} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Typography variant="h6" style={{ fontWeight: 700, color: '#1e293b' }}>{tp.Title}</Typography>
                                    <Typography variant="body2" style={{ color: '#64748b', marginBottom: '8px' }}>Curso: {tp.CourseName} | Asignada a {tp.StudentIDs.length} alumno(s)</Typography>
                                    <Typography variant="caption" style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>Fecha Límite: {new Date(tp.Deadline).toLocaleString()}</Typography>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleAbrirEdicion(tp)} style={{ color: '#68899D', borderColor: '#68899D', textTransform: 'none' }}>Editar Tarea</Button>
                                    <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleCancelarTarea(tp)} style={{ textTransform: 'none' }}>Cancelar</Button>
                                </div>
                            </Paper>
                        )) : <Typography style={{color:'#64748b'}}>Aún no has publicado ninguna tarea.</Typography>}
                    </div>
                )}

                <Dialog open={openCalificar} onClose={() => setOpenCalificar(false)} maxWidth="sm" fullWidth>
                    <div style={{ padding: '30px', position: 'relative' }}>
                        <IconButton onClick={() => setOpenCalificar(false)} style={{ position: 'absolute', right: 15, top: 15 }}><CloseIcon /></IconButton>
                        <Typography variant="h5" style={{ fontWeight: 800 }}>Calificar Entrega</Typography>
                        
                        {tareaACalificar && (
                            <>
                                <Typography style={{ margin: '15px 0', fontWeight: 700 }}>{tareaACalificar.title}</Typography>
                                
                                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b' }}>ENTREGA DEL ALUMNO:</Typography>
                                    {tareaACalificar.archivoAlumno ? (
                                        <Typography variant="body2" style={{ marginTop: '5px' }}>
                                            <a href={tareaACalificar.archivoAlumno} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Descargar Archivo Adjunto</a>
                                        </Typography>
                                    ) : tareaACalificar.urlAlumno ? (
                                        <Typography variant="body2" style={{ marginTop: '5px' }}>
                                            <a href={tareaACalificar.urlAlumno} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Ver Enlace Externo</a>
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" style={{ marginTop: '5px', color: '#ef4444' }}>Aún no hay entrega registrada.</Typography>
                                    )}
                                </div>

                                <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', marginBottom: '5px', display: 'block' }}>ASIGNAR CALIFICACIÓN (0 - 100)</Typography>
                                <TextField type="number" size="small" fullWidth value={calificacion} onChange={(e) => setCalificacion(e.target.value)} style={{ marginBottom: '20px' }} />
                                
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', marginBottom: '5px', display: 'block' }}>RETROALIMENTACIÓN</Typography>
                                <TextField multiline rows={3} fullWidth placeholder="Comentarios para el alumno..." value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ marginBottom: '15px' }} />
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                                    <Checkbox 
                                        id="resubmit" checked={permitirReenvio} onChange={(e) => setPermitirReenvio(e.target.checked)} 
                                        style={{ padding: 0, color: '#68899D' }}
                                    />
                                    <label htmlFor="resubmit" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
                                        Permitir que el alumno reenvíe la tarea (Re-entrega)
                                    </label>
                                </div>

                                <Button variant="contained" fullWidth style={{ backgroundColor: '#68899D', padding: '10px', fontWeight: 600, textTransform: 'none' }} onClick={handleGuardarCalificacion}>Guardar Calificación</Button>
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
                            <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px' }}>ACTUALIZAR MATERIAL DE APOYO</Typography>
                            
                            {tareaAEditar?.HelpMaterialFile && !removeExistingFile && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0f2fe', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px' }}>
                                    <Typography variant="body2" style={{ color: '#0284c7', fontWeight: 600 }}>📎 Ya hay un archivo de apoyo guardado.</Typography>
                                    <Button size="small" variant="outlined" color="error" onClick={() => setRemoveExistingFile(true)} style={{ textTransform: 'none' }}>Quitar archivo actual</Button>
                                </div>
                            )}

                            {removeExistingFile && (
                                <Typography variant="body2" style={{ color: '#ef4444', marginBottom: '15px', fontWeight: 600 }}>El archivo de apoyo anterior será eliminado al guardar.</Typography>
                            )}

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <TextField label="Enlace de apoyo externo" fullWidth size="small" value={editLink} onChange={(e) => setEditLink(e.target.value)} />
                                <Button variant="outlined" component="label" style={{ minWidth: '220px', textTransform: 'none', color: '#68899D', borderColor: '#68899D' }}>
                                    {editFile ? editFile.name : "Subir Archivo Nuevo"}
                                    <input type="file" hidden onChange={(e) => e.target.files && setEditFile(e.target.files[0])} />
                                </Button>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px', maxHeight: '200px', overflowY: 'auto' }}>
                            <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px' }}>
                                ALUMNOS DEL CURSO: {tareaAEditar?.CourseName} (Agrega o Quita asignaciones)
                            </Typography>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {alumnosCursoParaEditar.length > 0 ? alumnosCursoParaEditar.map(est => (
                                    <Paper key={est.ID} variant="outlined" onClick={() => toggleAlumnoEdit(est.ID)} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: alumnosSeleccionadosEdit.includes(est.ID) ? '#e0f2fe' : '#fff', borderColor: alumnosSeleccionadosEdit.includes(est.ID) ? '#38bdf8' : '#e2e8f0' }}>
                                        <Checkbox checked={alumnosSeleccionadosEdit.includes(est.ID)} size="small" style={{ padding: 0, marginRight: '8px', color: '#0284c7' }} />
                                        <Typography variant="body2" style={{ fontWeight: alumnosSeleccionadosEdit.includes(est.ID) ? 600 : 400 }}>{est.Name}</Typography>
                                    </Paper>
                                )) : <Typography variant="body2" color="textSecondary">No se encontraron alumnos en este curso.</Typography>}
                            </div>
                        </div>

                        <Button 
                            variant="contained" fullWidth disabled={isSubmittingEdit} onClick={handleUpdateTaskGeneral}
                            style={{ backgroundColor: isSubmittingEdit ? '#94a3b8' : '#68899D', padding: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
                        >
                            {isSubmittingEdit ? "Guardando Cambios..." : "Actualizar Tarea para los Alumnos Seleccionados"}
                        </Button>
                    </div>
                </Dialog>

            </div>
        </LocalizationProvider>
    );
}