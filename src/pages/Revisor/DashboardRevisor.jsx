import { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert, Select, MenuItem, Box, Avatar, Dialog, IconButton, Grid } from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 

import '../../styles/App.css';
import '../../styles/Tutor/RegistroSesiones.css'; 
import '../../styles/Tutor/TutorDashboard.css'; 

const getNotifStyle = (type) => {
    switch(type) {
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#f3e8ff', color: '#9333ea' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

export default function DashboardRevisor() {
    const user = JSON.parse(localStorage.getItem('user'));
    const reviewerId = user?.ID;

    const [evidencias, setEvidencias] = useState([]);
    const [filtro, setFiltro] = useState('Pendiente');
    
    const [openAlert, setOpenAlert] = useState({ show: false, message: '', type: 'success' });
    const [notificaciones, setNotificaciones] = useState([]);
    const [openNotifModal, setOpenNotifModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);

    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null);

    const fetchData = async () => {
        if (!reviewerId) return;
        try {
            const resBit = await fetch(`http://localhost:8000/api/revisor/bitacoras/${reviewerId}`);
            const dataBit = await resBit.json();
            if (dataBit.success) setEvidencias(dataBit.bitacoras);
        } catch (err) { console.error("Error cargando bitácoras:", err); }

        try {
            const resNotif = await fetch(`http://localhost:8000/api/tutor/notificaciones/${reviewerId}`);
            const dataNotif = await resNotif.json();
            if (dataNotif.success) setNotificaciones(dataNotif.notificaciones);
        } catch (err) { console.error("Error cargando notificaciones:", err); }
    };

    useEffect(() => { fetchData(); }, [reviewerId]);

    const handleEvaluar = async (row, nuevoEstado) => {
        try {
            const res = await fetch("http://localhost:8000/api/revisor/evaluar-bitacora", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SessionID: row.id,
                    TutorID: row.tutorId,
                    ReviewerID: reviewerId,
                    NewStatus: nuevoEstado,
                    Topic: row.topic
                })
            });
            const data = await res.json();
            if (data.success) {
                setOpenAlert({ show: true, message: `Sesión marcada como ${nuevoEstado}`, type: nuevoEstado === 'Aprobado' ? 'success' : 'error' });
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleOpenNotification = async (notif) => {
        setSelectedNotif(notif);
        setOpenNotifModal(true);
        if (!notif.IsRead) {
            try {
                await fetch(`http://localhost:8000/api/tutor/notificaciones/leer/${notif.NotificationID}`, { method: 'PUT' });
                setNotificaciones(prev => prev.map(n => n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n));
            } catch (error) { console.error(error); }
        }
    };

    const openDetails = (row) => {
        setSessionDetails(row);
        setOpenDetailsModal(true);
    };

    const evidenciasMostradas = evidencias.filter(item => item.status === filtro);

    return (
        <div className='mainContent' style={{ paddingBottom: '50px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Aprobaciones Pendientes</h2>
                    <p className='--subtitle-main' style={{ margin: 0, fontSize: '0.95rem' }}>
                        Revisa las bitacoras enviadas por tus tutores asignados para acreditar sus horas.
                    </p>
                </div>

                <Select 
                    value={filtro} 
                    onChange={(e) => setFiltro(e.target.value)} 
                    size="small" 
                    style={{ backgroundColor: 'white', minWidth: '160px', borderRadius: '8px' }}
                >
                    <MenuItem value="Pendiente">Pendientes</MenuItem>
                    <MenuItem value="Aprobado">Aprobadas</MenuItem>
                    <MenuItem value="Rechazado">Rechazadas</MenuItem>
                </Select>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            <TableContainer component={Paper} elevation={0} style={{ borderRadius: '12px', border: '1px solid #e0e4e8', backgroundColor: 'var(--bg-card)', marginBottom: '40px' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead style={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Tutor y Curso</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Fecha</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Tema y Resumen</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b', textAlign: 'center' }}>Estatus</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b', textAlign: 'center' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {evidenciasMostradas.map((row) => (
                            <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                
                                <TableCell>
                                    <Typography className='tut-info' style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{row.tutor}</Typography>
                                    <Typography className='course-aprob' style={{ fontSize: '0.85rem', color: '#64748b' }}>{row.course}</Typography>
                                    <Typography style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '4px' }}>{row.duration} horas</Typography>
                                </TableCell>
                                
                                <TableCell className='topic-date'>{row.date}</TableCell>
                                
                                <TableCell style={{ maxWidth: '300px' }}>
                                    <Typography style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>{row.topic}</Typography>
                                    <Typography style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {row.description}
                                    </Typography>
                                </TableCell>
                                
                                <TableCell align="center">
                                    {row.status === 'Pendiente' && <Chip label="Pendiente" size="small" style={{ backgroundColor: '#e2e8f0', color: '#64748b', fontWeight: 'bold' }} />}
                                    {row.status === 'Aprobado' && <Chip label="Aprobado" size="small" style={{ backgroundColor: '#dcfce3', color: '#16a34a', fontWeight: 'bold' }} />}
                                    {row.status === 'Rechazado' && <Chip label="Rechazado" size="small" style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 'bold' }} />}
                                </TableCell>
                                
                                <TableCell align="center">
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<AssignmentIcon />} 
                                            onClick={() => openDetails(row)}
                                            style={{ textTransform: 'none', borderRadius: '6px', color: '#68899D', borderColor: '#68899D' }}
                                        >
                                            Detalles
                                        </Button>

                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<VisibilityIcon />} 
                                            href={row.evidenceLink} 
                                            target="_blank"
                                            style={{ textTransform: 'none', borderRadius: '6px', color: '#68899D', borderColor: '#68899D' }}
                                        >
                                            Evidencia
                                        </Button>
                                        
                                        {row.status === 'Pendiente' && (
                                            <>
                                                <Button 
                                                    variant="contained" 
                                                    size="small" 
                                                    onClick={() => handleEvaluar(row, 'Aprobado')}
                                                    style={{ textTransform: 'none', borderRadius: '6px', backgroundColor: '#10b981', boxShadow: 'none', minWidth: '40px', padding: '4px' }}
                                                >
                                                    <CheckIcon fontSize="small"/>
                                                </Button>
                                                <Button 
                                                    variant="contained" 
                                                    size="small" 
                                                    onClick={() => handleEvaluar(row, 'Rechazado')}
                                                    style={{ textTransform: 'none', borderRadius: '6px', backgroundColor: '#ef4444', boxShadow: 'none', minWidth: '40px', padding: '4px' }}
                                                >
                                                    <CloseIcon fontSize="small"/>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {evidenciasMostradas.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#8792a2' }}>
                        No hay bitacoras en esta seccion.
                    </div>
                )}
            </TableContainer>

            <div className="bottomSection" style={{ gridTemplateColumns: '1fr', marginTop: '30px' }}>
                <div className="recentActivity" style={{ width: '100%' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Actividad Reciente</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {notificaciones.length > 0 ? notificaciones.map((item) => {
                            const style = getNotifStyle(item.Type);
                            const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                            const timeString = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <Paper key={item.NotificationID} className={`activity-card ${!item.IsRead ? 'unread' : ''}`} elevation={0} onClick={() => handleOpenNotification(item)}>
                                    <Avatar style={{ backgroundColor: style.bg, color: style.color, width: 40, height: 40 }}>
                                        {style.icon}
                                    </Avatar>
                                    <Box className="activity-info">
                                        <Typography className="activity-title">{item.Title}</Typography>
                                        <Typography className="activity-desc">{item.Message}</Typography>
                                    </Box>
                                    <Typography className="activity-time">{timeString}</Typography>
                                    {!item.IsRead && <div className="unread-dot"></div>}
                                </Paper>
                            );
                        }) : (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>Aun no tienes notificaciones.</p>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={openDetailsModal} onClose={() => setOpenDetailsModal(false)} maxWidth="md" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                {sessionDetails && (
                    <div style={{ padding: '32px', position: 'relative', color: '#1e293b' }}>
                        <IconButton onClick={() => setOpenDetailsModal(false)} style={{ position: 'absolute', right: 16, top: 16 }}>
                            <CloseIcon />
                        </IconButton>
                        
                        <Typography variant="h5" style={{ fontWeight: 800, marginBottom: '24px', color: '#0f172a' }}>Detalles de Bitácora</Typography>
                        
                        <Grid container spacing={3} style={{ marginBottom: '24px' }}>
                            <Grid item xs={6} sm={4} md={2}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Tutor</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.tutor}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Curso</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.course}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4.2}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Fecha y Hora</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.date} • {sessionDetails.startTime}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={4} md={1.3}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Duración</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem', color: '#3b82f6' }}>{sessionDetails.duration} hrs</Typography>
                            </Grid>
                            <Grid item xs={6} sm={8} md={2.5}>
                                <Typography style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Tema Central</Typography>
                                <Typography style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessionDetails.topic}</Typography>
                            </Grid>
                        </Grid>

                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 24px 0' }} />

                        <Typography style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Desarrollo de la Clase</Typography>
                        
                        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                            <Typography style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Resumen de lo impartido</Typography>
                            <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap', color: '#334155' }}>
                                {sessionDetails.description}
                            </Typography>

                            <Typography style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Planeación Próxima Clase</Typography>
                            <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#334155' }}>
                                {sessionDetails.nextSession || 'Sin especificar'}
                            </Typography>
                        </div>

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
                                            <TableCell colSpan={3} align="center" style={{ color: '#94a3b8', padding: '24px' }}>No hay lista de asistencia adjunta.</TableCell>
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

            <Dialog open={openNotifModal} onClose={() => setOpenNotifModal(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
                {selectedNotif && (
                    <div style={{ padding: '20px', position: 'relative' }}>
                        <IconButton onClick={() => setOpenNotifModal(false)} style={{ position: 'absolute', right: 10, top: 10 }}>
                            <CloseIcon />
                        </IconButton>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <Avatar style={{ backgroundColor: getNotifStyle(selectedNotif.Type).bg, color: getNotifStyle(selectedNotif.Type).color, width: 50, height: 50 }}>
                                {getNotifStyle(selectedNotif.Type).icon}
                            </Avatar>
                            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{selectedNotif.Title}</Typography>
                        </div>
                        
                        <span className="notif-modal-date">{new Date(selectedNotif.CreatedAt.replace(' ', 'T') + 'Z').toLocaleString()}</span>
                        
                        <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.6, marginBottom: '25px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {selectedNotif.Message}
                        </Typography>
                    </div>
                )}
            </Dialog>

            <Snackbar 
                open={openAlert.show} 
                autoHideDuration={3000} 
                onClose={() => setOpenAlert({ ...openAlert, show: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenAlert({ ...openAlert, show: false })} severity={openAlert.type} sx={{ width: '100%', borderRadius: '8px' }}>
                    {openAlert.message}
                </Alert>
            </Snackbar>

        </div>
    );
}