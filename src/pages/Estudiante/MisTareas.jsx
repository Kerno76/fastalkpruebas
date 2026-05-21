import { useState, useEffect } from 'react';
import { Typography, Button, Paper, Chip, Dialog, IconButton, TextField, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import toast from 'react-hot-toast';

import '../../styles/App.css';
import '../../styles/Estudiante/EstudianteDashboard.css'; 

export default function MisTareas() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [tareas, setTareas] = useState([]);
    const [viewMode, setViewMode] = useState('Actuales');
    
    const [openEntrega, setOpenEntrega] = useState(false);
    const [openFeedback, setOpenFeedback] = useState(false);
    const [tareaActual, setTareaActual] = useState(null);

    const [enlaces, setEnlaces] = useState([]);
    const [nuevoEnlace, setNuevoEnlace] = useState('');
    const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTareas = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/student/tareas/${user.ID}`);
            const data = await res.json();
            if (data.success) setTareas(data.tareas);
        } catch (err) { console.error("Error cargando tareas:", err); }
    };

    useEffect(() => { if (user?.ID) fetchTareas(); }, [user?.ID]);

    const abrirEntrega = (tarea) => {
        setTareaActual(tarea);
        setArchivosAdjuntos([]); setEnlaces([]); setNuevoEnlace('');
        setOpenEntrega(true); setOpenFeedback(false);
    };

    const handleAddLink = () => {
        if (nuevoEnlace.trim() && (nuevoEnlace.startsWith('http'))) {
            setEnlaces([...enlaces, nuevoEnlace.trim()]);
            setNuevoEnlace('');
        } else toast.error("Enlace no válido.");
    };

    const handleFileChange = (e) => { if (e.target.files) setArchivosAdjuntos(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = null; };
    const handleRemoveFile = (index) => setArchivosAdjuntos(archivosAdjuntos.filter((_, i) => i !== index));

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e);
    });

    const handleSubirTarea = async () => {
        if (!tareaActual) return;
        setIsSubmitting(true);
        const tid = toast.loading("Enviando...");
        try {
            const archivosData = await Promise.all(archivosAdjuntos.map(async (file) => ({
                fileBase64: await fileToBase64(file), fileName: file.name, fileType: file.type
            })));
            const res = await fetch("http://localhost:8000/api/student/entregar-tarea", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ AssignmentID: tareaActual.id, StudentID: user.ID, TutorID: tareaActual.tutorId, Title: tareaActual.title, Links: enlaces, Files: archivosData })
            });
            if ((await res.json()).success) {
                toast.success("Enviado con éxito", { id: tid });
                setOpenEntrega(false); fetchTareas();
            } else throw new Error();
        } catch (err) { toast.error("Error al enviar", { id: tid }); } finally { setIsSubmitting(false); }
    };

    const safeParse = (str) => { try { return JSON.parse(str); } catch { return str ? [str] : []; } };

    // --- FILTRADO: SOLO CURSOS ACTIVOS ---
    const tareasFiltradas = tareas.filter(t => {
        const esActivo = t.courseStatus?.toLowerCase() === 'active';
        if (viewMode === 'Actuales') return esActivo && t.status?.toLowerCase() === 'pending';
        return esActivo && (t.status?.toLowerCase() === 'submitted' || t.status?.toLowerCase() === 'graded');
    });

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="dashboard-title">Centro de Tareas</h2>
                    <p className="subtitleMainMS">Revisa asignaciones y envía evidencias.</p>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                    <Button onClick={() => setViewMode('Actuales')} style={{ backgroundColor: viewMode === 'Actuales' ? '#fff' : 'transparent', color: viewMode === 'Actuales' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>Actuales</Button>
                    <Button onClick={() => setViewMode('Historial')} style={{ backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent', color: viewMode === 'Historial' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>Historial</Button>
                </div>
            </div>

            <div className='dashboard-cards-grid'>
                {tareasFiltradas.length > 0 ? tareasFiltradas.map((item) => (
                    <Paper key={item.id} elevation={0} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <Typography variant="h6" style={{ fontWeight: 800 }}>{item.title}</Typography>
                        <Typography variant="body2" color="textSecondary">{item.courseName} | Tutor: {item.tutorName}</Typography>
                        <Button variant="contained" fullWidth onClick={() => abrirEntrega(item)} style={{ marginTop: '15px' }}>
                            {viewMode === 'Actuales' ? "Ver Detalles y Entregar" : "Ver Entrega"}
                        </Button>
                    </Paper>
                )) : <Typography>No hay tareas en esta vista.</Typography>}
            </div>

            {/* MODAL DE ENTREGA */}
            <Dialog open={openEntrega} onClose={() => setOpenEntrega(false)} fullWidth maxWidth="md">
                {tareaActual && (
                    <div style={{ padding: '30px' }}>
                        <IconButton onClick={() => setOpenEntrega(false)} style={{ float: 'right' }}><CloseIcon /></IconButton>
                        <Typography variant="h5">{tareaActual.title}</Typography>
                        <Typography variant="body2" style={{ marginBottom: '20px' }}>{tareaActual.description}</Typography>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <Typography variant="caption" fontWeight="bold">AGREGAR LINKS</Typography>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <TextField size="small" fullWidth value={nuevoEnlace} onChange={e => setNuevoEnlace(e.target.value)} />
                                <Button onClick={handleAddLink}><AddCircleOutlineIcon /></Button>
                            </div>
                            {enlaces.map((l, i) => <Chip key={i} label={l} onDelete={() => setEnlaces(enlaces.filter((_, idx) => idx !== i))} />)}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <Typography variant="caption" fontWeight="bold">SUBIR ARCHIVOS</Typography>
                            <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
                                Seleccionar <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                            {archivosAdjuntos.map((f, i) => (
                                <Typography key={i} variant="body2"><InsertDriveFileIcon /> {f.name} <IconButton onClick={() => handleRemoveFile(i)}><DeleteOutlineIcon /></IconButton></Typography>
                            ))}
                        </div>

                        <Button variant="contained" fullWidth onClick={handleSubirTarea} disabled={isSubmitting}>Enviar Tarea</Button>
                    </div>
                )}
            </Dialog>

            {/* MODAL DE FEEDBACK */}
            <Dialog open={openFeedback} onClose={() => setOpenFeedback(false)} fullWidth maxWidth="sm">
                <div style={{ padding: '30px' }}>
                    <IconButton onClick={() => setOpenFeedback(false)} style={{ float: 'right' }}><CloseIcon /></IconButton>
                    <Typography variant="h6">Detalles de la entrega</Typography>
                    {tareaActual && (
                        <div>
                            <Typography><strong>Links enviados:</strong></Typography>
                            {safeParse(tareaActual.studentUrl).map((l, i) => <Typography key={i}><LinkIcon/> {l}</Typography>)}
                            <Divider sx={{ my: 1 }} />
                            <Typography><strong>Calificación:</strong> {tareaActual.grade || 0}/100</Typography>
                            <Typography><strong>Comentarios:</strong> {tareaActual.feedback || 'Sin comentarios'}</Typography>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}