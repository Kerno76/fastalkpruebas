import React, { useState, useEffect } from 'react';
import '../../styles/Tutor/HistorialSesiones.css';
import '../../styles/App.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, IconButton, Chip, Dialog, Typography, Grid, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';

export default function HistorialSesiones() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    const [historial, setHistorial] = useState([]);
    
    // Estados para el Modal de Detalles
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null);

    useEffect(() => {
        if (user?.ID) {
            const endpoint = isAdmin 
                ? `http://localhost:8000/api/admin/historial-global` 
                : `http://localhost:8000/api/tutor/historial-sesiones/${user.ID}`;
                
            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setHistorial(data.sesiones);
                })
                .catch(err => console.error("Error al cargar historial:", err));
        }
    }, [user?.ID, isAdmin]);

    const getStatusChip = (status) => {
        switch(status) {
            case 'Completed': return <Chip label="Completada" color="success" size="small" />;
            case 'Absent': return <Chip label="Inasistencia" color="error" size="small" />;
            case 'Canceled': return <Chip label="Cancelada" color="error" size="small" />;
            case 'Reviewed': return <Chip label="Revisada" color="info" size="small" />;
            case 'Scheduled': return <Chip label="Pendiente de Bitácora" color="warning" size="small" />;
            default: return <Chip label={status} size="small" />;
        }
    };

    const handleOpenDetails = (row) => {
        setSessionDetails(row);
        setOpenDetailsModal(true);
    };

    return (
        <div className="histo" style={{ padding: '20px' }}>
            <h2 id="Title">Historial de Sesiones</h2>
            <p id="dashboard-subtitle">{isAdmin ? "Registro global de todas las sesiones." : "Tus sesiones impartidas desglosadas aquí mismo."}</p>

            <Box className='sess' sx={{ mt: 4, mb: 4 }}>
                <TableContainer component={Paper} sx={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                    <Table sx={{ minWidth: 650 }} aria-label="historial table">
                        <TableHead className='cabecera'>
                            <TableRow>
                                <TableCell className='headerText'>Fecha y Hora</TableCell>
                                <TableCell className='headerText'>Curso</TableCell>
                                <TableCell className='headerText'>Tema</TableCell>
                                <TableCell className='headerText'>Duración</TableCell>
                                <TableCell className='headerText'>Estado</TableCell>
                                <TableCell className='headerText'>Revisión</TableCell>
                                <TableCell className='headerText' align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {historial.length > 0 ? historial.map((row) => (
                                <TableRow key={row.SessionID} className="fila-cuerpo">
                                    <TableCell>{row.Date} - {row.StartTime}</TableCell>
                                    <TableCell>{row.courseName}</TableCell>
                                    <TableCell className="tema-destacado">{row.Topic}</TableCell>
                                    <TableCell>{row.Duration} hr</TableCell>
                                    <TableCell>{getStatusChip(row.Status)}</TableCell>
                                    <TableCell>
                                        <span style={{ 
                                            fontWeight: 600, 
                                            color: row.ReviewerStatus === 'Aprobado' ? '#16a34a' : 
                                                  row.ReviewerStatus === 'Rechazado' ? '#dc2626' : 
                                                  row.ReviewerStatus === 'Pendiente' ? '#ca8a04' : '#94a3b8' 
                                        }}>
                                            {row.ReviewerStatus || 'No iniciada'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                startIcon={<AssignmentIcon />} 
                                                onClick={() => handleOpenDetails(row)}
                                                style={{ textTransform: 'none', borderRadius: '6px', color: '#68899D', borderColor: '#68899D' }}
                                            >
                                                Detalles
                                            </Button>
                                            <IconButton color="primary" onClick={() => row.EvidencePhoto ? window.open(row.EvidencePhoto, '_blank') : alert("Sin evidencia adjunta")}>
                                                <SearchIcon />
                                            </IconButton>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" style={{ padding: '30px' }}>No hay registros en el historial.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* MODAL DETALLES COMPLETOS DE LA SESIÓN */}
            <Dialog open={openDetailsModal} onClose={() => setOpenDetailsModal(false)} maxWidth="md" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                {sessionDetails && (
                    <div style={{ padding: '32px', position: 'relative', color: '#1e293b' }}>
                        <IconButton onClick={() => setOpenDetailsModal(false)} style={{ position: 'absolute', right: 16, top: 16 }}>
                            <CloseIcon />
                        </IconButton>
                        
                        <Typography variant="h5" style={{ fontWeight: 800, marginBottom: '24px', color: '#0f172a' }}>Detalles de Sesión</Typography>
                        
                        {/* 1. SECCIÓN DE INFORMACIÓN GENERAL */}
                        <Grid container spacing={3} style={{ marginBottom: '24px' }}>
                            <Grid item xs={6} sm={4} md={2.5}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Curso</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.courseName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4.2}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Fecha y Hora</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.Date} • {sessionDetails.StartTime}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={4} md={1.3}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Duración</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem', color: '#3b82f6' }}>{sessionDetails.Duration} hrs</Typography>
                            </Grid>
                            <Grid item xs={6} sm={8} md={4}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Tema Central</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.Topic}</Typography>
                            </Grid>
                        </Grid>

                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 24px 0' }} />

                        {/* 2. SECCIÓN DE DESARROLLO DE LA CLASE */}
                        <Typography style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Desarrollo de la Clase</Typography>
                        
                        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                            <Typography style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Resumen de lo impartido</Typography>
                            <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap', color: '#334155' }}>
                                {sessionDetails.Description || 'No se adjuntó descripción.'}
                            </Typography>

                            <Typography style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Planeación Próxima Clase</Typography>
                            <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#334155' }}>
                                {sessionDetails.NextSession || 'Sin especificar.'}
                            </Typography>
                        </div>

                        {/* 3. SECCIÓN DE ASISTENCIA */}
                        <Typography style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Asistencia e Incidentes</Typography>
                        
                        <TableContainer component={Paper} elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px' }}>
                            <Table size="small">
                                <TableHead style={{ backgroundColor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell style={{ fontWeight: 700, color: '#475569', width: '30%' }}>Alumno</TableCell>
                                        <TableCell style={{ fontWeight: 700, color: '#475569', width: '20%' }}>Asistencia</TableCell>
                                        <TableCell style={{ fontWeight: 700, color: '#475569', width: '50%' }}>Reporte / Incidente</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sessionDetails.estudiantes && sessionDetails.estudiantes.length > 0 ? (
                                        sessionDetails.estudiantes.map((est, idx) => (
                                            <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell style={{ fontWeight: 600, color: '#334155' }}>{est.Name}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={est.Attendance || 'Sin registro'} 
                                                        size="small" 
                                                        style={{ 
                                                            backgroundColor: est.Attendance === 'Presente' ? '#dcfce3' : est.Attendance === 'Retardo' ? '#fef08a' : '#fee2e2',
                                                            color: est.Attendance === 'Presente' ? '#16a34a' : est.Attendance === 'Retardo' ? '#ca8a04' : '#ef4444',
                                                            fontWeight: 'bold',
                                                            borderRadius: '6px'
                                                        }} 
                                                    />
                                                </TableCell>
                                                <TableCell style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                    {est.IncidentReport || ''} 
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" style={{ color: '#94a3b8', padding: '24px' }}>La lista de alumnos no se adjuntó en esta bitácora.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => setOpenDetailsModal(false)} style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none', fontWeight: 600, padding: '8px 24px', borderRadius: '8px' }}>
                                Cerrar Detalles
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}