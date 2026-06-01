import { useState, useEffect } from 'react';
import { Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, TextField, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HistoryIcon from '@mui/icons-material/History';
import toast from 'react-hot-toast';
import '../../styles/App.css';

export default function RevisionFinalCursos() {
    const [cursos, setCursos] = useState([]);
    const [viewMode, setViewMode] = useState('Pendientes');
    const [rejectModal, setRejectModal] = useState({ open: false, courseId: null, comments: '' });

    const fetchCursosRevision = async () => {
        try {
            const endpoint = viewMode === 'Pendientes' ? 'cursos-pendientes-cierre' : 'historial-cursos-cerrados';
            const res = await fetch(`http://localhost:8000/api/admin/${endpoint}`);
            const data = await res.json();
            if (data.success) {
                setCursos(data.cursos);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCursosRevision();
    }, [viewMode]);

    const handleCerrarCurso = async (cursoId) => {
        const loadingToast = toast.loading('Procesando cierre y actualización de niveles...');
        try {
            const res = await fetch("http://localhost:8000/api/admin/cerrar-curso", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId: cursoId })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('¡Curso cerrado exitosamente!', { id: loadingToast });
                fetchCursosRevision();
            } else {
                toast.error(data.message || 'Error al cerrar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
    };

    const handleRechazarCurso = async () => {
        if (!rejectModal.comments.trim()) {
            toast.error('Debes incluir un comentario indicando qué corregir.');
            return;
        }

        const loadingToast = toast.loading('Devolviendo evaluación al tutor...');
        try {
            const res = await fetch("http://localhost:8000/api/admin/rechazar-evaluacion", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId: rejectModal.courseId, adminComments: rejectModal.comments })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Evaluación devuelta exitosamente.', { id: loadingToast });
                setRejectModal({ open: false, courseId: null, comments: '' });
                fetchCursosRevision();
            } else {
                toast.error(data.message || 'Error al rechazar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
    };

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title">Cierre de Cursos (Revisión Admin)</h2>
                    <p className="--subtitle-main">
                        {viewMode === 'Pendientes'
                            ? 'Verifica las calificaciones otorgadas por los tutores para promover a los alumnos.'
                            : 'Consulta el archivo histórico de los cursos que ya aprobaste y cerraste.'}
                    </p>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                    <Button 
                        startIcon={<PendingActionsIcon />}
                        onClick={() => setViewMode('Pendientes')}
                        style={{ 
                            backgroundColor: viewMode === 'Pendientes' ? '#fff' : 'transparent',
                            color: viewMode === 'Pendientes' ? '#0f172a' : '#64748b',
                            textTransform: 'none', fontWeight: 600, borderRadius: '8px', 
                            boxShadow: viewMode === 'Pendientes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Pendientes
                    </Button>
                    <Button 
                        startIcon={<HistoryIcon />}
                        onClick={() => setViewMode('Historial')}
                        style={{ 
                            backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent',
                            color: viewMode === 'Historial' ? '#0f172a' : '#64748b',
                            textTransform: 'none', fontWeight: 600, borderRadius: '8px', 
                            boxShadow: viewMode === 'Historial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Historial
                    </Button>
                </div>
            </div>

            {cursos.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--student-card, #f8fafc)', borderRadius: '12px', color: '#64748b' }}>
                    <CheckCircleIcon style={{ fontSize: 40, color: '#10b981', marginBottom: '10px' }} />
                    <Typography variant="h6" style= {{color: 'var(--text-main, #1e293b)'}}>Sin cursos en esta sección</Typography>
                    <Typography style= {{color: 'var(--text-main, #1e293b)'}}>
                        {viewMode === 'Pendientes' 
                            ? 'Ningún tutor ha enviado reportes finales recientemente.' 
                            : 'No hay cursos históricos registrados.'}
                    </Typography>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {cursos.map((curso) => (
                        <Paper key={curso.CourseID} elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', backgroundColor: viewMode === 'Pendientes' ? '#fff7ed' : '#f8fafc', borderBottom: viewMode === 'Pendientes' ? '1px solid #fed7aa' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Typography variant="h6" style={{ fontWeight: 800, color: viewMode === 'Pendientes' ? '#9a3412' : '#1e293b' }}>{curso.Name}</Typography>
                                    <Typography variant="body2" style={{ color: viewMode === 'Pendientes' ? '#c2410c' : '#64748b', fontWeight: 600, marginBottom: '5px' }}>Tutor: {curso.tutorName}</Typography>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Chip label={`Enseña: Nivel ${curso.Level}`} size="small" style={{ backgroundColor: viewMode === 'Pendientes' ? '#ffedd5' : '#e2e8f0', color: viewMode === 'Pendientes' ? '#c2410c' : '#475569', fontWeight: 600 }} />
                                    </div>
                                </div>
                                {viewMode === 'Pendientes' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button variant="outlined" color="error" onClick={() => setRejectModal({ open: true, courseId: curso.CourseID, comments: '' })} style={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                                            Rechazar
                                        </Button>
                                        <Button variant="contained" color="success" onClick={() => handleCerrarCurso(curso.CourseID)} style={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                                            Aprobar y Cerrar
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
                            <TableContainer>
                                <Table>
                                    <TableHead style={{ backgroundColor: '#fff' }}>
                                        <TableRow>
                                            <TableCell style={{ fontWeight: 700, color: '#475569' }}>Alumno</TableCell>
                                            <TableCell style={{ fontWeight: 700, color: '#475569' }}>Nivel de Origen</TableCell>
                                            <TableCell style={{ fontWeight: 700, color: '#475569' }}>Calificación Final</TableCell>
                                            <TableCell style={{ fontWeight: 700, color: '#475569', width: '40%' }}>Comentarios del Tutor</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {curso.alumnos.map((alumno) => (
                                            <TableRow key={alumno.StudentID}>
                                                <TableCell style={{ fontWeight: 600, color: '#334155' }}>{alumno.Name}</TableCell>
                                                <TableCell><Chip label={alumno.CurrentLevel} size="small" variant="outlined" /></TableCell>
                                                <TableCell>
                                                    <Typography style={{ fontWeight: 800, color: alumno.FinalGrade >= 70 ? '#16a34a' : '#ef4444' }}>
                                                        {alumno.FinalGrade} / 100
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" style={{ color: '#475569' }}>
                                                        {alumno.FinalTutorComments || <em>Sin comentarios</em>}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    ))}
                </div>
            )}

            <Dialog open={rejectModal.open} onClose={() => setRejectModal({ open: false, courseId: null, comments: '' })} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
                <Box p={2}>
                    <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                        Devolver Evaluación
                    </Typography>
                    <Typography variant="body2" style={{ color: '#64748b', marginBottom: '20px' }}>
                        Indica claramente al tutor qué calificaciones o comentarios deben ser corregidos.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Ej. Faltan las justificaciones del alumno reprobado..."
                        value={rejectModal.comments}
                        onChange={(e) => setRejectModal({ ...rejectModal, comments: e.target.value })}
                        style={{ marginBottom: '20px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={() => setRejectModal({ open: false, courseId: null, comments: '' })} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="error" onClick={handleRechazarCurso} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
                            Devolver al Tutor
                        </Button>
                    </div>
                </Box>
            </Dialog>
        </div>
    );
}