import { useState, useEffect } from 'react';
import { Typography, Button, Paper, Chip, Dialog, IconButton, TextField } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import toast from 'react-hot-toast';

import '../../styles/App.css';
import '../../styles/Estudiante/EstudianteDashboard.css'; 

export default function MisTareas() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [tareas, setTareas] = useState([]);
    
    const [openEntrega, setOpenEntrega] = useState(false);
    const [openFeedback, setOpenFeedback] = useState(false);
    const [tareaActual, setTareaActual] = useState(null);

    const [archivoAdjunto, setArchivoAdjunto] = useState(null);
    const [linkEntrega, setLinkEntrega] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTareas = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/student/tareas/${user.ID}`);
            const data = await res.json();
            if (data.success) {
                setTareas(data.tareas);
            } else {
                toast.error("Error del servidor: " + data.message);
            }
        } catch (err) { console.error("Error cargando tareas:", err); }
    };

    useEffect(() => { if (user?.ID) fetchTareas(); }, [user?.ID]);

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e);
    });

    const handleSubirTarea = async () => {
        if (!archivoAdjunto && (!linkEntrega || linkEntrega.trim() === '')) {
            return toast.error("Debes adjuntar un archivo o pegar un enlace válido.");
        }

        setIsSubmitting(true);
        const tid = toast.loading("Subiendo entrega...");

        try {
            let fileBase64 = null;
            if (archivoAdjunto) fileBase64 = await fileToBase64(archivoAdjunto);

            const payload = {
                AssignmentID: tareaActual.id,
                StudentID: user.ID,
                TutorID: tareaActual.tutorId,
                Title: tareaActual.title,
                fileBase64,
                fileName: archivoAdjunto?.name,
                fileType: archivoAdjunto?.type,
                studentUrl: linkEntrega
            };

            const res = await fetch("http://localhost:8000/api/student/entregar-tarea", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Tarea enviada. Se notificó a tu tutor.", { id: tid });
                setOpenEntrega(false);
                setArchivoAdjunto(null);
                setLinkEntrega('');
                fetchTareas(); 
            } else {
                throw new Error(data.message);
            }
        } catch (err) { 
            console.error("Error de backend:", err.message);
            toast.error(`Error: ${err.message}`, { id: tid, duration: 5000 }); 
        } 
        finally { setIsSubmitting(false); }
    };

    const abrirEntrega = (tarea) => {
        setTareaActual(tarea);
        setArchivoAdjunto(null);
        setLinkEntrega('');
        setOpenEntrega(true);
        setOpenFeedback(false);
    };

    const tareasPendientes = tareas.filter(t => t.status?.toLowerCase() === 'pending');
    const tareasPasadas = tareas.filter(t => t.status?.toLowerCase() === 'submitted' || t.status?.toLowerCase() === 'graded');

    const isFormEmpty = !archivoAdjunto && (!linkEntrega || linkEntrega.trim() === '');
    const isOverdueModal = tareaActual ? new Date() > new Date(tareaActual.deadline) : false;

    return (
        <div className='mainContent'>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px', marginBottom: '15px' }}>
                <h2 className="dashboard-title" style={{ marginTop: 0 }}>Centro de Tareas</h2>
                <p id="dashboard-subtitle" style={{ margin: 0 }}>
                    Revisa asignaciones, envía evidencias y consulta tu progreso.
                </p>
            </div>

            <hr className="divisor" style={{ marginBottom: '15px', borderTop: '1px solid #e0e4e8' }} />

            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '15px' }}>
                Tareas por Vencer
            </Typography>

            <div className='dashboard-cards-grid' style={{ marginBottom: '40px' }}>
                {tareasPendientes.length > 0 ? tareasPendientes.map((item) => {
                    const isOverdue = new Date() > new Date(item.deadline);

                    return (
                        <Paper key={item.id} elevation={0} style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <Chip label={item.courseName} size="small" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                                    {isOverdue ? (
                                        <Chip label="Vencida" size="small" style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 700 }} />
                                    ) : (
                                        <Chip label="Pendiente" size="small" style={{ backgroundColor: '#fef08a', color: '#ca8a04', fontWeight: 700 }} />
                                    )}
                                </div>
                                
                                <Typography style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '8px' }}>
                                    {item.title}
                                </Typography>
                                <Typography style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                                    Tutor: {item.tutorName}
                                </Typography>
                                
                                <div style={{ backgroundColor: '#fff1f2', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', display: 'inline-block' }}>
                                    <Typography style={{ fontSize: '0.85rem', color: '#e11d48', fontWeight: 700 }}>
                                        Límite: {new Date(item.deadline).toLocaleString()}
                                    </Typography>
                                </div>
                            </div>

                            <Button 
                                variant="contained" fullWidth startIcon={!isOverdue ? <UploadFileIcon /> : <VisibilityIcon />} 
                                onClick={() => abrirEntrega(item)}
                                style={{ backgroundColor: isOverdue ? '#ef4444' : '#3b82f6', textTransform: 'none', borderRadius: '8px', padding: '10px', fontWeight: 600, boxShadow: 'none' }}
                            >
                                {isOverdue ? "Ver Detalles (Vencida)" : "Ver Detalles y Entregar"}
                            </Button>
                        </Paper>
                    );
                }) : (
                    <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>No tienes tareas pendientes en este momento.</Typography>
                )}
            </div>

            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '15px' }}>
                Historial de Entregas
            </Typography>

            <div className='dashboard-cards-grid'>
                {tareasPasadas.length > 0 ? tareasPasadas.map((item) => {
                    const statusText = item.status?.toLowerCase();
                    return (
                        <Paper key={item.id} elevation={0} style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <Chip label={item.courseName} size="small" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600 }} />
                                    {statusText === 'graded' ? (
                                        <Chip label="Calificada" size="small" style={{ backgroundColor: '#dcfce3', color: '#16a34a', fontWeight: 700 }} />
                                    ) : (
                                        <Chip label="En Revisión" size="small" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 700 }} />
                                    )}
                                </div>
                                
                                <Typography style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '8px' }}>
                                    {item.title}
                                </Typography>
                                <Typography style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                                    Tutor: {item.tutorName}
                                </Typography>
                            </div>

                            <div>
                                {statusText === 'submitted' && (
                                    <Button variant="outlined" fullWidth startIcon={<CheckCircleIcon />} disabled style={{ textTransform: 'none', borderRadius: '8px', padding: '10px', color: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}>
                                        Entregada
                                    </Button>
                                )}

                                {statusText === 'graded' && (
                                    <Button 
                                        variant="outlined" fullWidth startIcon={<VisibilityIcon />} 
                                        onClick={() => { setTareaActual(item); setOpenFeedback(true); }}
                                        style={{ textTransform: 'none', borderRadius: '8px', padding: '10px', color: '#68899D', borderColor: '#68899D', fontWeight: 600 }}
                                    >
                                        Ver Calificación {item.grade && `(${item.grade}/100)`}
                                    </Button>
                                )}
                            </div>
                        </Paper>
                    );
                }) : (
                    <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aún no tienes historial de entregas.</Typography>
                )}
            </div>

            <Dialog open={openEntrega} onClose={() => setOpenEntrega(false)} maxWidth="md" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <IconButton onClick={() => setOpenEntrega(false)} style={{ position: 'absolute', right: 16, top: 16 }}>
                    <CloseIcon />
                </IconButton>

                {tareaActual && (
                    <div style={{ padding: '32px', color: '#1e293b' }}>
                        
                        {isOverdueModal && (
                            <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5', marginBottom: '20px' }}>
                                <Typography style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
                                    ⏳ El tiempo de entrega ha expirado. Ya no puedes subir evidencias para esta asignación.
                                </Typography>
                            </div>
                        )}

                        <Typography variant="h5" style={{ fontWeight: 800, marginBottom: '24px', color: '#0f172a', paddingRight: '30px' }}>
                            {tareaActual.title}
                        </Typography>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
                            <Chip icon={<AssignmentIcon />} label={`Curso: ${tareaActual.courseName}`} style={{ backgroundColor: '#f1f5f9', fontWeight: 600 }} />
                            <Chip label={`Vence: ${new Date(tareaActual.deadline).toLocaleString()}`} style={{ backgroundColor: '#fff1f2', color: '#e11d48', fontWeight: 600 }} />
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                            <Typography style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Instrucciones del Tutor</Typography>
                            <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#334155', marginBottom: '20px' }}>
                                {tareaActual.description}
                            </Typography>

                            {(tareaActual.helpMaterialLink || tareaActual.helpMaterialFile) && (
                                <>
                                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '15px 0' }} />
                                    <Typography style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Material de Apoyo Adjunto</Typography>
                                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                        {tareaActual.helpMaterialFile && (
                                            <>
                                                <Button variant="outlined" size="small" href={tareaActual.helpMaterialFile} target="_blank" startIcon={<VisibilityIcon />} style={{ textTransform: 'none', color: '#3b82f6', borderColor: '#3b82f6', borderRadius: '6px' }}>Ver Archivo</Button>
                                                <Button variant="outlined" size="small" href={tareaActual.helpMaterialFile} download target="_blank" startIcon={<DownloadIcon />} style={{ textTransform: 'none', color: '#68899D', borderColor: '#68899D', borderRadius: '6px' }}>Descargar</Button>
                                            </>
                                        )}
                                        {tareaActual.helpMaterialLink && (
                                            <Button variant="outlined" size="small" href={tareaActual.helpMaterialLink} target="_blank" startIcon={<LinkIcon />} style={{ textTransform: 'none', color: '#8b5cf6', borderColor: '#8b5cf6', borderRadius: '6px' }}>Ver Enlace Externo</Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <Typography style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px' }}>Tu Entrega</Typography>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: isOverdueModal ? 0.6 : 1, pointerEvents: isOverdueModal ? 'none' : 'auto' }}>
                            <div>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#475569' }}>OPCIÓN 1: PEGAR UN ENLACE (Drive, Figma, YouTube, etc.)</Typography>
                                <TextField fullWidth size="small" placeholder="https://..." value={linkEntrega} onChange={(e) => setLinkEntrega(e.target.value)} disabled={isOverdueModal} style={{ marginTop: '5px' }} />
                            </div>
                            
                            <div>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#475569' }}>OPCIÓN 2: SUBIR UN ARCHIVO DIRECTAMENTE</Typography>
                                <div 
                                    onClick={() => !isOverdueModal && document.getElementById('student-file-upload').click()}
                                    style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '15px', textAlign: 'center', cursor: isOverdueModal ? 'not-allowed' : 'pointer', backgroundColor: '#ffffff', marginTop: '5px', transition: 'all 0.2s' }}
                                >
                                    <input id="student-file-upload" type="file" disabled={isOverdueModal} onChange={(e) => e.target.files && setArchivoAdjunto(e.target.files[0])} style={{ display: 'none' }} />
                                    <Typography style={{ color: archivoAdjunto ? '#3b82f6' : '#64748b', fontWeight: archivoAdjunto ? 600 : 400 }}>
                                        {archivoAdjunto ? archivoAdjunto.name : 'Haz clic aquí para seleccionar tu archivo (PDF, Word, Imagen)'}
                                    </Typography>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                            <Button 
                                variant="contained" 
                                disabled={isSubmitting || isFormEmpty || isOverdueModal} 
                                onClick={handleSubirTarea}
                                style={{ 
                                    backgroundColor: (isSubmitting || isFormEmpty || isOverdueModal) ? '#94a3b8' : '#3b82f6', 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    padding: '10px 30px', 
                                    borderRadius: '8px', 
                                    boxShadow: 'none' 
                                }}
                            >
                                {isSubmitting ? "Enviando..." : "Enviar Tarea para Revisión"}
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>

            <Dialog open={openFeedback} onClose={() => setOpenFeedback(false)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <IconButton onClick={() => setOpenFeedback(false)} style={{ position: 'absolute', right: 16, top: 16 }}>
                    <CloseIcon />
                </IconButton>

                {tareaActual && (
                    <div style={{ padding: '32px', color: '#1e293b', textAlign: 'center' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <Typography variant="h4" style={{ fontWeight: 800, color: '#16a34a' }}>{tareaActual.grade}/100</Typography>
                            <Typography variant="body2" style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Calificación Final</Typography>
                        </div>
                        <Typography variant="h6" style={{ fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>{tareaActual.title}</Typography>
                        
                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '25px' }}>
                            <Typography style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Comentarios del Tutor</Typography>
                            <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#334155' }}>
                                {tareaActual.feedback || 'Tu tutor calificó la tarea sin dejar comentarios adicionales.'}
                            </Typography>
                        </div>
                        
                        {tareaActual.allowResubmit ? (
                            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', padding: '15px', borderRadius: '8px' }}>
                                <Typography style={{ color: '#b45309', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>El tutor ha habilitado la opción de reentregar esta tarea para mejorar tu calificación.</Typography>
                                <Button variant="contained" size="small" onClick={() => abrirEntrega(tareaActual)} style={{ backgroundColor: '#d97706', boxShadow: 'none', textTransform: 'none', fontWeight: 600 }}>Volver a Entregar</Button>
                            </div>
                        ) : (
                            <Button variant="outlined" onClick={() => setOpenFeedback(false)} style={{ color: '#64748b', borderColor: '#cbd5e1', textTransform: 'none', fontWeight: 600 }}>Cerrar</Button>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    );
}