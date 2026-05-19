import { useState, useEffect } from 'react';
import { Typography, Paper, Button, IconButton, Dialog, Chip, TextField, InputAdornment, Tabs, Tab, Checkbox } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
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
    
    // --- ESTADOS PARA LINKS Y ARCHIVOS (ARREGLOS) ---
    const [editLinks, setEditLinks] = useState([]);
    const [nuevoEditLink, setNuevoEditLink] = useState('');
    const [editExistingFiles, setEditExistingFiles] = useState([]);
    const [editNewFiles, setEditNewFiles] = useState([]);
    
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
        
        setEditLinks(tareaGroup.HelpMaterialLink ? JSON.parse(tareaGroup.HelpMaterialLink) : []);
        setEditExistingFiles(tareaGroup.HelpMaterialFile ? JSON.parse(tareaGroup.HelpMaterialFile) : []);
        setEditNewFiles([]);
        setNuevoEditLink('');
        setAlumnosSeleccionadosEdit(tareaGroup.StudentIDs);
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
            setEditLinks([...editLinks, nuevoEditLink.trim()]);
            setNuevoEditLink('');
        } else {
            toast.error("Ingresa un enlace válido (http:// o https://)");
        }
    };
    const handleRemoveEditLink = (index) => setEditLinks(editLinks.filter((_, i) => i !== index));

    const handleRemoveExistingFile = (index) => setEditExistingFiles(editExistingFiles.filter((_, i) => i !== index));
    const handleRemoveNewFile = (index) => setEditNewFiles(editNewFiles.filter((_, i) => i !== index));
    const handleEditFileChange = (e) => { 
        if (e.target.files) setEditNewFiles(prev => [...prev, ...Array.from(e.target.files)]);
        e.target.value = null; 
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
            const archivosNuevosData = await Promise.all(
                editNewFiles.map(async (file) => ({
                    fileBase64: await fileToBase64(file),
                    fileName: file.name,
                    fileType: file.type
                }))
            );
            
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
                Links: editLinks,               
                ExistingFiles: editExistingFiles, 
                NewFiles: archivosNuevosData     
            };

            const res = await fetch("http://localhost:8000/api/tutor/editar-tarea-completa", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Tarea actualizada con éxito", { id: tid });
                setOpenEditTask(false); 
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (err) { toast.error(`Error: ${err.message}`, { id: tid }); }
        finally { setIsSubmittingEdit(false); }
    };

    const datosFiltrados = estudiantesData.filter(est => est.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const isImageUrl = (url) => url && url.match(/\.(jpeg|jpg|gif|png)$/i) != null;

    // --- FUNCIÓN DE PARSEO SEGURO PARA ENTREGAS DE ALUMNOS ---
    const safeParse = (str) => {
        if (!str) return [];
        try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [str]; // Por si no es un arreglo
        } catch {
            return [str]; // Si es un string simple de una entrega antigua, lo metemos en un arreglo
        }
    };

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
                        {datosFiltrados.length > 0 ? datosFiltrados.map(est => {
                            // Separar elegantemente el nombre del curso y el nivel
                            const parts = est.course.split(' ');
                            const level = parts.length > 1 ? parts.pop() : '';
                            const courseName = parts.join(' ');

                            return (
                                <div key={est.id} className="student-task-section">
                                    <Paper className="student-header-pill" elevation={0} style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                                        <Typography className="shp-name" style={{ marginBottom: '8px' }}>{est.name}</Typography>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <Chip label={`Curso: ${courseName}`} size="small" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600 }} />
                                            {level && <Chip label={`Nivel: ${level}`} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />}
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
                            );
                        }) : <Typography style={{color:'#64748b'}}>No hay tareas entregadas por el momento.</Typography>}
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
                                <Typography style={{ margin: '15px 0', fontWeight: 700, fontSize: '1.1rem' }}>{tareaACalificar.title}</Typography>
                                
                                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '15px' }}>EVIDENCIAS ENTREGADAS:</Typography>
                                    
                                    {(() => {
                                        // Parsear los arreglos del estudiante
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
                                                {/* Enlaces del Alumno */}
                                                {studentLinks.length > 0 && (
                                                    <div>
                                                        <Typography variant="caption" style={{ fontWeight: 700, color: '#475569' }}>ENLACES EXTERNOS</Typography>
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

                                                {/* Archivos del Alumno */}
                                                {studentFiles.length > 0 && (
                                                    <div>
                                                        <Typography variant="caption" style={{ fontWeight: 700, color: '#475569' }}>ARCHIVOS ADJUNTOS</Typography>
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