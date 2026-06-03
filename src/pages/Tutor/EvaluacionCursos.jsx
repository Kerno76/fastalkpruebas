import { useState, useEffect } from 'react';
import { Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HistoryIcon from '@mui/icons-material/History';
import toast from 'react-hot-toast';
import '../../styles/App.css';

export default function EvaluacionCursos() {
    const user = JSON.parse(localStorage.getItem('user'));
    const tutorId = user?.ID;

    const [cursos, setCursos] = useState([]);
    const [viewMode, setViewMode] = useState('Pendientes'); 

    const fetchCursosEvaluar = async () => {
        try {
            const endpoint = viewMode === 'Pendientes' ? 'cursos-por-evaluar' : 'historial-evaluaciones-tutor';
            const res = await fetch(`http://localhost:8000/api/tutor/${endpoint}/${tutorId}`);
            const data = await res.json();
            if (data.success) {
                setCursos(data.cursos);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCursosEvaluar();
    }, [tutorId, viewMode]); 

    const handleCalificacionChange = (cursoIndex, alumnoIndex, field, value) => {
        const nuevosCursos = [...cursos];
        nuevosCursos[cursoIndex].alumnos[alumnoIndex][field] = value;
        setCursos(nuevosCursos);
    };

    const isCursoCompleto = (curso) => {
        if (!curso.alumnos || curso.alumnos.length === 0) return false;
        return curso.alumnos.every(a => 
            a.FinalGrade !== '' && 
            a.FinalGrade !== null && 
            a.FinalGrade >= 0 &&
            a.FinalGrade <= 100 &&
            a.FinalTutorComments && 
            a.FinalTutorComments.trim() !== ''
        );
    };

    const handleEnviarEvaluacion = async (cursoIndex) => {
        const curso = cursos[cursoIndex];
        const loadingToast = toast.loading('Enviando evaluaciones al administrador...');

        try {
            const res = await fetch("http://localhost:8000/api/tutor/enviar-evaluacion-curso", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: curso.CourseID,
                    tutorId: tutorId,
                    evaluaciones: curso.alumnos
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('¡Evaluación enviada con éxito!', { id: loadingToast });
                fetchCursosEvaluar(); 
            } else {
                toast.error(data.message || 'Error al enviar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
    };

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title">Evaluación Final de Cursos</h2>
                    <p className="--subtitle-main">
                        {viewMode === 'Pendientes' 
                            ? 'Asigna la calificación final y comentarios a los alumnos de los cursos que acaban de terminar.'
                            : 'Consulta el archivo histórico de las evaluaciones que ya has enviado.'}
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
                    <Typography variant="h6" style= {{color: 'var(--text-main, #1e293b)'}}>Todo al día</Typography>
                    <Typography style= {{color: 'var(--text-main, #1e293b)'}}>No tienes cursos en esta sección por el momento.</Typography>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {cursos.map((curso, cIndex) => {
                        const completado = isCursoCompleto(curso);

                        return (
                            <Paper key={curso.CourseID} elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                {/* ALERTA DE RECHAZO DEL ADMIN */}
                                {curso.AdminComments && viewMode === 'Pendientes' && (
                                    <Alert severity="error" style={{ borderBottom: '1px solid #fecaca' }}>
                                        <strong>Corrección solicitada por Administración:</strong> {curso.AdminComments}
                                    </Alert>
                                )}

                                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b' }}>{curso.Name}</Typography>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                            <Chip label={curso.Language} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }} />
                                            <Chip label={`Nivel: ${curso.Level}`} size="small" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                                            {viewMode === 'Pendientes' ? (
                                                <Chip label="Pendiente de Calificar" size="small" style={{ backgroundColor: '#fef08a', color: '#854d0e', fontWeight: 600 }} />
                                            ) : (
                                                <Chip label="Evaluación Finalizada" size="small" style={{ backgroundColor: '#dcfce3', color: '#16a34a', fontWeight: 600 }} />
                                            )}
                                        </div>
                                    </div>
                                    {viewMode === 'Pendientes' && (
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            onClick={() => handleEnviarEvaluacion(cIndex)} 
                                            disabled={!completado} 
                                            style={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                                        >
                                            {completado ? "Enviar Reporte Final" : "Faltan datos"}
                                        </Button>
                                    )}
                                </div>
                                
                                <TableContainer>
                                    <Table>
                                        <TableHead style={{ backgroundColor: '#fff' }}>
                                            <TableRow>
                                                <TableCell style={{ fontWeight: 700, color: '#475569' }}>Alumno</TableCell>
                                                <TableCell style={{ fontWeight: 700, color: '#475569' }}>Nivel Actual</TableCell>
                                                <TableCell style={{ fontWeight: 700, color: '#475569', width: '150px' }}>Calificación Final</TableCell>
                                                <TableCell style={{ fontWeight: 700, color: '#475569', width: '40%' }}>Comentarios del Tutor</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {curso.alumnos.length > 0 ? curso.alumnos.map((alumno, aIndex) => (
                                                <TableRow key={alumno.StudentID}>
                                                    <TableCell style={{ fontWeight: 600, color: '#334155' }}>{alumno.Name}</TableCell>
                                                    <TableCell><Chip label={alumno.CurrentLevel} size="small" variant="outlined" /></TableCell>
                                                    <TableCell>
                                                        {viewMode === 'Pendientes' ? (
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                placeholder="0"
                                                                value={alumno.FinalGrade}
                                                                onChange={(e) => handleCalificacionChange(cIndex, aIndex, 'FinalGrade', e.target.value)}
                                                                inputProps={{ min: 0, max: 100 }}
                                                                fullWidth
                                                                error={alumno.FinalGrade === '' || alumno.FinalGrade === null}
                                                            />
                                                        ) : (
                                                            <Typography style={{ fontWeight: 800, color: alumno.FinalGrade >= 70 ? '#16a34a' : '#ef4444' }}>
                                                                {alumno.FinalGrade} / 100
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {viewMode === 'Pendientes' ? (
                                                            <TextField
                                                                size="small"
                                                                placeholder="Recomendaciones, observaciones..."
                                                                value={alumno.FinalTutorComments}
                                                                onChange={(e) => handleCalificacionChange(cIndex, aIndex, 'FinalTutorComments', e.target.value)}
                                                                multiline
                                                                rows={2}
                                                                fullWidth
                                                                error={!alumno.FinalTutorComments || alumno.FinalTutorComments.trim() === ''}
                                                            />
                                                        ) : (
                                                            <Typography variant="body2" style={{ color: '#475569' }}>
                                                                {alumno.FinalTutorComments}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" style={{ color: '#94a3b8' }}>No hay alumnos inscritos en este curso.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        );
                    })}
                </div>
            )}
        </div>
    );
}