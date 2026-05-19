import { useState, useEffect } from 'react';
import { Typography, Button, Paper, Chip, Dialog, IconButton, TextField, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ClassIcon from '@mui/icons-material/Class';
import HistoryIcon from '@mui/icons-material/History';
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

    const isImageUrl = (url) => url && url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
    const safeParse = (str) => { try { return JSON.parse(str); } catch { return str ? [str] : []; } };

    const tareasFiltradas = viewMode === 'Actuales' 
        ? tareas.filter(t => t.status?.toLowerCase() === 'pending')
        : tareas.filter(t => t.status?.toLowerCase() === 'submitted' || t.status?.toLowerCase() === 'graded');

    return (
        <div className='mainContent'>
            {/* CABECERA Y BOTONES DE VISTA */}
            <div className="header-container" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="dashboard-title">Centro de Tareas</h2>
                    <p className="subtitleMainMS">Revisa asignaciones y envía evidencias.</p>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                    <Button onClick={() => setViewMode('Actuales')} style={{ backgroundColor: viewMode === 'Actuales' ? '#fff' : 'transparent', color: viewMode === 'Actuales' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                        Actuales
                    </Button>
                    <Button onClick={() => setViewMode('Historial')} style={{ backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent', color: viewMode === 'Historial' ? '#0f172a' : '#64748b', textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                        Historial
                    </Button>
                </div>
            </div>

            {/* LISTADO DE TAREAS */}
            <div className='dashboard-cards-grid'>
                {tareasFiltradas.length > 0 ? tareasFiltradas.map((item) => (
                    <Paper key={item.id} elevation={0} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <Typography variant="h6" style={{ fontWeight: 800 }}>{item.title}</Typography>
                        <Typography variant="body2" color="textSecondary">{item.courseName} | Tutor: {item.tutorName}</Typography>
                        
                        <div style={{ marginTop: '15px' }}>
                            {viewMode === 'Actuales' ? (
                                <Button variant="contained" fullWidth onClick={() => abrirEntrega(item)}>Ver Detalles y Entregar</Button>
                            ) : (
                                <Button variant="outlined" fullWidth onClick={() => { setTareaActual(item); setOpenFeedback(true); }}>Ver mi Entrega y Calificación</Button>
                            )}
                        </div>
                    </Paper>
                )) : <Typography>No hay tareas en esta vista.</Typography>}
            </div>

            {/* MODAL DE ENTREGA (REUTILIZABLE) */}
            <Dialog open={openEntrega} onClose={() => setOpenEntrega(false)} fullWidth maxWidth="md">
                {/* ... Aquí va el contenido del formulario de entrega que ya tenías ... */}
            </Dialog>

            {/* MODAL DE FEEDBACK / HISTORIAL DE ENTREGA */}
            <Dialog open={openFeedback} onClose={() => setOpenFeedback(false)} fullWidth maxWidth="sm">
                <div style={{ padding: '24px' }}>
                    <Typography variant="h6">Detalles de tu entrega</Typography>
                    {tareaActual && (
                        <div>
                            <Typography><strong>Lo que enviaste:</strong></Typography>
                            {/* AQUÍ LISTAMOS LOS LINKS Y ARCHIVOS QUE EL ESTUDIANTE ENVIÓ PREVIAMENTE */}
                            {safeParse(tareaActual.studentUrl).map((l, i) => <Typography key={i}><LinkIcon/> {l}</Typography>)}
                            {safeParse(tareaActual.studentFile).map((f, i) => <Typography key={i}><InsertDriveFileIcon/> {f.name}</Typography>)}
                            
                            <Divider sx={{ my: 2 }} />
                            <Typography><strong>Calificación:</strong> {tareaActual.grade}/100</Typography>
                            <Typography><strong>Comentarios:</strong> {tareaActual.feedback}</Typography>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}