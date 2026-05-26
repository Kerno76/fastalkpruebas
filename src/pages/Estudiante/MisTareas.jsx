import { useState, useEffect } from 'react';
import { Typography, Button, Paper, Chip, Dialog, IconButton, TextField, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import toast from 'react-hot-toast';

import '../../styles/App.css';
import '../../styles/Estudiante/EstudianteDashboard.css';

const RESUBMIT = {
    border:        '#a8bfcc',   
    bgCard:        '#f0f4f7',   
    bgWarning:     '#e8eff4',   
    borderWarning: '#a8bfcc',   
    chipBg:        '#4b6478',   
    chipColor:     '#ffffff',
    textStrong:    '#2e4a5a',  
    textBody:      '#3d5566',   
    deadlineBg:    '#dde8ef',   
    deadlineColor: '#2e4a5a',   
    btnBg:         '#4b6478',   
    btnHover:      '#3a5060',
};

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
        setArchivosAdjuntos([]);
        setEnlaces([]);
        setNuevoEnlace('');
        setOpenEntrega(true);
        setOpenFeedback(false);
    };

    const handleAddLink = () => {
        if (nuevoEnlace.trim() && nuevoEnlace.startsWith('http')) {
            setEnlaces([...enlaces, nuevoEnlace.trim()]);
            setNuevoEnlace('');
        } else toast.error("Por favor ingresa un enlace válido que comience con http.");
    };

    const handleFileChange = (e) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        const archivoPesado = newFiles.find(f => f.size > 52428800); // 50MB
        if (archivoPesado) {
            return toast.error("El archivo excede el límite de 50MB.");
        }
        setArchivosAdjuntos(prev => [...prev, ...newFiles]);
    }
    e.target.value = null;
};

    const handleRemoveFile = (index) => setArchivosAdjuntos(archivosAdjuntos.filter((_, i) => i !== index));

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = e => reject(e);
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
                body: JSON.stringify({
                    AssignmentID: tareaActual.id,
                    StudentID: user.ID,
                    TutorID: tareaActual.tutorId,
                    Title: tareaActual.title,
                    Links: enlaces,
                    Files: archivosData
                })
            });
            if ((await res.json()).success) {
                toast.success("Enviado con éxito", { id: tid });
                setOpenEntrega(false);
                fetchTareas();
            } else throw new Error();
        } catch (err) {
            toast.error("Error al enviar", { id: tid });
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseLinks = (str) => {
        if (!str) return [];
        try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
        } catch { return [str]; }
    };

    const parseFiles = (str) => {
        if (!str) return [];
        try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    const nowMs = Date.now();
    const tareasCursoActivo = tareas.filter(t => ['active', 'upcoming'].includes(t.courseStatus?.toLowerCase()));
    const isResubmit = (t) => t.allowResubmit === true || t.allowResubmit === 'true';

    const tareasPendientes = tareasCursoActivo.filter(t =>
        (t.status?.toLowerCase() === 'pending' || isResubmit(t)) &&
        (!t.deadline || new Date(t.deadline).getTime() > nowMs)
    );

    const tareasEntregadas = tareasCursoActivo.filter(t =>
        ['submitted', 'graded'].includes(t.status?.toLowerCase()) &&
        !isResubmit(t)
    );

    const tareasVencidas = tareasCursoActivo.filter(t =>
        (t.status?.toLowerCase() === 'pending' || isResubmit(t)) &&
        t.deadline && new Date(t.deadline).getTime() <= nowMs
    );

    const renderCard = (item, isHistorial = false) => (
        <Paper
            key={item.id}
            elevation={0}
            style={{
                padding: '20px',
                borderRadius: '16px',
                border: isResubmit(item) ? `2px solid ${RESUBMIT.border}` : '1px solid #e2e8f0',
                backgroundColor: isResubmit(item) ? RESUBMIT.bgCard : '#fff'
            }}
        >
            <Typography variant="h6" style={{ fontWeight: 800 }}>
                {item.title}
                {isResubmit(item) && !isHistorial && (
                    <Chip
                        label="Requiere Corrección"
                        size="small"
                        style={{
                            backgroundColor: RESUBMIT.chipBg,
                            color: RESUBMIT.chipColor,
                            fontWeight: 800,
                            marginLeft: '10px'
                        }}
                    />
                )}
            </Typography>

            <Typography variant="body2" color="textSecondary" style={{ marginBottom: '10px' }}>
                {item.courseName} | Tutor: {item.tutorName}
            </Typography>

            {item.deadline && !isHistorial && (
                <Chip
                    label={`Vence: ${new Date(item.deadline).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`}
                    size="small"
                    style={{
                        backgroundColor: isResubmit(item) ? RESUBMIT.deadlineBg : '#fffbeb',
                        color: isResubmit(item) ? RESUBMIT.deadlineColor : '#d97706',
                        fontWeight: 700
                    }}
                />
            )}

            <Button
                variant={isHistorial ? "outlined" : "contained"}
                fullWidth
                onClick={() => isHistorial ? (setTareaActual(item), setOpenFeedback(true)) : abrirEntrega(item)}
                style={{
                    marginTop: '15px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    boxShadow: 'none',
                    ...(isResubmit(item) && !isHistorial ? {
                        backgroundColor: RESUBMIT.btnBg,
                        color: '#fff',
                    } : {}),
                    ...(isHistorial && isResubmit(item) ? {
                        borderColor: RESUBMIT.border,
                        color: RESUBMIT.textStrong,
                    } : {}),
                }}
            >
                {isHistorial
                    ? "Ver Detalles y Estatus"
                    : isResubmit(item)
                        ? "Ver Observaciones y Re-entregar"
                        : "Ver Detalles y Entregar"
                }
            </Button>
        </Paper>
    );

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="dashboard-title">Centro de Tareas</h2>
                    <p className="subtitleMainMS">Revisa asignaciones y envía evidencias de tus cursos vigentes.</p>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                    <Button
                        onClick={() => setViewMode('Actuales')}
                        style={{
                            backgroundColor: viewMode === 'Actuales' ? '#fff' : 'transparent',
                            color: viewMode === 'Actuales' ? '#0f172a' : '#64748b',
                            textTransform: 'none', fontWeight: 600, borderRadius: '8px'
                        }}
                    >Actuales</Button>
                    <Button
                        onClick={() => setViewMode('Historial')}
                        style={{
                            backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent',
                            color: viewMode === 'Historial' ? '#0f172a' : '#64748b',
                            textTransform: 'none', fontWeight: 600, borderRadius: '8px'
                        }}
                    >Historial</Button>
                </div>
            </div>

            {viewMode === 'Actuales' ? (
                <div className='dashboard-cards-grid'>
                    {tareasPendientes.length > 0 ? tareasPendientes.map(t => renderCard(t)) : (
                        <Typography style={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                            No tienes tareas pendientes en este momento.
                        </Typography>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div>
                        <Typography variant="h6" style={{ fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <CheckCircleIcon /> Entregadas / Calificadas
                        </Typography>
                        <Divider style={{ marginBottom: '20px' }} />
                        <div className='dashboard-cards-grid'>
                            {tareasEntregadas.length > 0 ? tareasEntregadas.map(t => renderCard(t, true)) : (
                                <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aún no has entregado tareas de este curso.</Typography>
                            )}
                        </div>
                    </div>

                    <div>
                        <Typography variant="h6" style={{ fontWeight: 800, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', marginTop: '20px' }}>
                            <ErrorOutlineIcon /> Tareas Vencidas
                        </Typography>
                        <Divider style={{ marginBottom: '20px' }} />
                        <div className='dashboard-cards-grid'>
                            {tareasVencidas.length > 0 ? tareasVencidas.map(t => renderCard(t, true)) : (
                                <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>Excelente, no tienes tareas atrasadas.</Typography>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={openEntrega} onClose={() => setOpenEntrega(false)} fullWidth maxWidth="md">
                {tareaActual && (
                    <div style={{ padding: '30px' }}>
                        <IconButton onClick={() => setOpenEntrega(false)} style={{ float: 'right' }}><CloseIcon /></IconButton>
                        <Typography variant="h5" style={{ fontWeight: 800 }}>{tareaActual.title}</Typography>
                        <Typography variant="body2" style={{ marginBottom: '20px', color: '#64748b' }}>{tareaActual.courseName}</Typography>

                        {isResubmit(tareaActual) && (
                            <Paper
                                elevation={0}
                                style={{
                                    padding: '15px',
                                    backgroundColor: RESUBMIT.bgWarning,
                                    border: `1px solid ${RESUBMIT.borderWarning}`,
                                    borderRadius: '12px',
                                    marginBottom: '20px'
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    style={{
                                        fontWeight: 800,
                                        color: RESUBMIT.textStrong,
                                        marginBottom: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <WarningAmberIcon fontSize="small" /> Observaciones del Tutor (Corrección Requerida)
                                </Typography>
                                <Typography variant="body2" style={{ color: RESUBMIT.textBody }}>
                                    {tareaActual.feedback || 'Por favor revisa tu entrega anterior y vuelve a subir los archivos solicitados.'}
                                </Typography>
                            </Paper>
                        )}

                        <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#f8fafc' }}>
                            <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: '8px' }}>Instrucciones originales del tutor</Typography>
                            <Typography variant="body2">{tareaActual.description || 'Sin descripción detallada.'}</Typography>
                        </Paper>

                        {(tareaActual.helpMaterialLink || tareaActual.helpMaterialFile) && (
                            <div style={{ marginBottom: '20px' }}>
                                <Typography variant="caption" fontWeight="bold">MATERIAL DE APOYO DEL TUTOR</Typography>

                                {parseLinks(tareaActual.helpMaterialLink).map((link, i) => (
                                    <Typography key={`link-${i}`} style={{ marginTop: '5px' }}>
                                        <a href={link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#0284c7', textDecoration: 'none' }}>
                                            <LinkIcon style={{ fontSize: '18px', marginRight: '5px' }} /> {link}
                                        </a>
                                    </Typography>
                                ))}

                                {parseFiles(tareaActual.helpMaterialFile).map((file, i) => (
                                    <Typography key={`file-${i}`} style={{ marginTop: '8px' }}>
                                        <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>
                                            <InsertDriveFileIcon style={{ fontSize: '18px', marginRight: '5px', color: '#4b6478' }} /> {file.name}
                                        </a>
                                    </Typography>
                                ))}
                            </div>
                        )}

                        <Divider style={{ margin: '25px 0' }} />

                        <div style={{ marginBottom: '20px' }}>
                            <Typography variant="caption" fontWeight="bold">AGREGAR LINKS (OPCIONAL)</Typography>
                            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                <TextField size="small" fullWidth placeholder="https://..." value={nuevoEnlace} onChange={e => setNuevoEnlace(e.target.value)} />
                                <Button variant="outlined" onClick={handleAddLink}><AddCircleOutlineIcon /></Button>
                            </div>
                            <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {enlaces.map((l, i) => (
                                    <Chip key={i} label={l} onDelete={() => setEnlaces(enlaces.filter((_, idx) => idx !== i))} color="primary" variant="outlined" />
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <Typography variant="caption" fontWeight="bold" style={{ display: 'block', marginBottom: '10px' }}>SUBIR ARCHIVOS</Typography>
                            <Button component="label" variant="contained" startIcon={<UploadFileIcon />} style={{ backgroundColor: '#1e293b', boxShadow: 'none', textTransform: 'none' }}>
                                Seleccionar Archivo <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                            <div style={{ marginTop: '10px' }}>
                                {archivosAdjuntos.map((f, i) => (
                                    <Chip key={i} icon={<InsertDriveFileIcon />} label={f.name} onDelete={() => handleRemoveFile(i)} style={{ margin: '5px' }} />
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSubirTarea}
                            disabled={isSubmitting}
                            style={{
                                padding: '12px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                backgroundColor: isResubmit(tareaActual) ? RESUBMIT.btnBg : '#0ea5e9',
                                boxShadow: 'none',
                                textTransform: 'none',
                            }}
                        >
                            {isSubmitting ? "Enviando Tarea..." : isResubmit(tareaActual) ? "Enviar Corrección" : "Confirmar y Enviar Tarea"}
                        </Button>
                    </div>
                )}
            </Dialog>

            <Dialog open={openFeedback} onClose={() => setOpenFeedback(false)} fullWidth maxWidth="md">
                <div style={{ padding: '30px' }}>
                    <IconButton onClick={() => setOpenFeedback(false)} style={{ float: 'right' }}><CloseIcon /></IconButton>
                    {tareaActual && (
                        <>
                            <Typography variant="h5" style={{ fontWeight: 800, marginBottom: '5px' }}>{tareaActual.title}</Typography>
                            <Typography variant="body2" style={{ color: '#64748b', marginBottom: '20px' }}>{tareaActual.courseName}</Typography>

                            <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#f8fafc' }}>
                                <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: '8px' }}>Tu entrega</Typography>

                                {parseLinks(tareaActual.studentUrl).length > 0 ? (
                                    parseLinks(tareaActual.studentUrl).map((l, i) => (
                                        <Typography key={i} style={{ marginTop: '5px' }}>
                                            <a href={l} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#0284c7', textDecoration: 'none' }}>
                                                <LinkIcon style={{ fontSize: '18px', marginRight: '5px' }} /> {l}
                                            </a>
                                        </Typography>
                                    ))
                                ) : <Typography variant="body2" color="textSecondary">No enviaste links externos.</Typography>}

                                {parseFiles(tareaActual.studentFile).length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        {parseFiles(tareaActual.studentFile).map((file, i) => (
                                            <Typography key={`sfile-${i}`} style={{ marginTop: '5px' }}>
                                                <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>
                                                    <InsertDriveFileIcon style={{ fontSize: '18px', marginRight: '5px', color: '#10b981' }} /> {file.name}
                                                </a>
                                            </Typography>
                                        ))}
                                    </div>
                                )}
                            </Paper>

                            <Paper
                                elevation={0}
                                style={{
                                    padding: '15px',
                                    borderRadius: '12px',
                                    backgroundColor: tareaActual.status?.toLowerCase() === 'graded' ? '#f0fdf4' : '#f8fafc',
                                    border: tareaActual.status?.toLowerCase() === 'graded' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                                }}
                            >
                                <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: '10px' }}>Retroalimentación del Tutor</Typography>
                                <Typography>
                                    <strong>Estado:</strong>{' '}
                                    {tareaActual.status?.toLowerCase() === 'submitted'
                                        ? 'Entregada (En revisión)'
                                        : tareaActual.status?.toLowerCase() === 'graded'
                                            ? 'Calificada'
                                            : 'Vencida sin entregar'}
                                </Typography>
                                <Typography><strong>Calificación:</strong> {tareaActual.grade || 0}/100</Typography>
                                <Typography style={{ marginTop: '10px' }}>
                                    <strong>Comentarios:</strong><br />
                                    {tareaActual.feedback || 'Tu tutor aún no ha dejado comentarios.'}
                                </Typography>
                            </Paper>
                        </>
                    )}
                </div>
            </Dialog>
        </div>
    );
}