import { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert, Box, Avatar, Dialog, IconButton, Grid, TextField, InputAdornment, FormControlLabel, Checkbox } from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import '../../styles/App.css';
import '../../styles/Tutor/RegistroSesiones.css'; 
import '../../styles/Tutor/TutorDashboard.css'; 

const getNotifStyle = (type) => {
    switch(type) {
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#f3e8ff', color: '#9333ea' };
        case 'AlertaAdmin': return { icon: <NotificationsActiveIcon />, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

const getCleanComment = (comments) => {
    if (!comments) return 'Sin comentarios adicionales.';
    const split = comments.split('Comentarios: ');
    return split.length > 1 ? split[1] : comments;
};

const getEvaluador = (comments) => {
    if (!comments) return '-';
    const match = comments.match(/Evaluado por: (.*?)\n/);
    return match ? match[1] : '-';
};

export default function DashboardRevisor() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isReviewer = user?.Rol === 'Reviewer';
    const isAdmin = user?.Rol === 'Admin';
    const userId = user?.ID;

    const [evidencias, setEvidencias] = useState([]);
    const [viewMode, setViewMode] = useState('Pendientes'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [validationsCount, setValidationsCount] = useState(0);
    
    const [inlineComments, setInlineComments] = useState({});
    
    const [openAlert, setOpenAlert] = useState({ show: false, message: '', type: 'success' });
    const [notificaciones, setNotificaciones] = useState([]);
    
    const [openNotifModal, setOpenNotifModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);

    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null);

    const [evalModal, setEvalModal] = useState({ open: false, row: null, status: '', comments: '', allowResubmit: true });

    const fetchData = async () => {
        if (!userId) return;

        try {
            const apiUrl = isAdmin 
                ? `http://localhost:8000/api/admin/todas-bitacoras`
                : `http://localhost:8000/api/revisor/bitacoras/${userId}`;

            const resBit = await fetch(apiUrl);
            const dataBit = await resBit.json();
            if (dataBit.success) setEvidencias(dataBit.bitacoras);
        } catch (err) { console.error("Error cargando bitácoras:", err); }

        try {
            const resNotif = await fetch(`http://localhost:8000/api/revisor/notificaciones/${userId}`);
            const dataNotif = await resNotif.json();
            if (dataNotif.success) setNotificaciones(dataNotif.notificaciones);
        } catch (err) { console.error("Error cargando notificaciones:", err); }

        if (isReviewer) {
            try {
                const resStats = await fetch(`http://localhost:8000/api/revisor/stats/${userId}`);
                const dataStats = await resStats.json();
                if (dataStats.success) setValidationsCount(dataStats.validationsCompleted);
            } catch (err) { console.error("Error cargando stats de revisor:", err); }
        }
    };

    useEffect(() => { 
        fetchData(); 
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [userId, isAdmin]);

    const openEvalModalDialog = (row, status) => {
        const rowComment = inlineComments[row.id] || '';
        setEvalModal({ open: true, row, status, comments: rowComment, allowResubmit: true });
    };

    const closeEvalModal = () => {
        setEvalModal({ open: false, row: null, status: '', comments: '', allowResubmit: true });
    };

    const handleEvaluarSubmit = async () => {
        const { row, status, comments, allowResubmit } = evalModal;
        try {
            const res = await fetch("http://localhost:8000/api/revisor/evaluar-bitacora", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SessionID: row.id,
                    TutorID: row.tutorId,
                    ReviewerID: userId, 
                    NewStatus: status,
                    Topic: row.topic,
                    ReviewerComments: comments,
                    allowResubmit: allowResubmit
                })
            });
            const data = await res.json();
            if (data.success) {
                setOpenAlert({ show: true, message: `Sesión marcada como ${status}`, type: status === 'Aprobado' ? 'success' : 'error' });
                
                setInlineComments(prev => {
                    const next = { ...prev };
                    delete next[row.id];
                    return next;
                });
                
                closeEvalModal();
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleOpenNotification = async (notif) => {
        setSelectedNotif(notif);
        setOpenNotifModal(true);
        if (!notif.IsRead) {
            try {
                await fetch(`http://localhost:8000/api/revisor/notificaciones/leer/${notif.NotificationID}`, { method: 'PUT' });
                setNotificaciones(prev => prev.map(n => n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n));
            } catch (error) { console.error(error); }
        }
    };

    const openDetails = (row) => {
        setSessionDetails(row);
        setOpenDetailsModal(true);
    };

    let evidenciasMostradas = evidencias.filter(item => {
        if (viewMode === 'Pendientes') return item.status === 'Pendiente';
        return item.status !== 'Pendiente'; 
    });

    if (searchTerm.trim() !== '') {
        const busqueda = searchTerm.toLowerCase();
        evidenciasMostradas = evidenciasMostradas.filter(e => 
            e.tutor.toLowerCase().includes(busqueda) || 
            e.topic.toLowerCase().includes(busqueda) ||
            e.course.toLowerCase().includes(busqueda)
        );
    }

    return (
        <div className='mainContent' style={{ paddingBottom: '50px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {isAdmin ? 'Gestión Global de Bitácoras' : 'Aprobaciones Pendientes'}
                    </h2>
                    <p className='--subtitle-main' style={{ margin: 0, fontSize: '0.95rem' }}>
                        {isAdmin 
                            ? 'Monitorea el trabajo de todos los tutores y el estatus de sus revisiones.' 
                            : 'Revisa las bitácoras enviadas por tus tutores asignados.'}
                    </p>
                    
                    {isReviewer && (
                        <div style={{ marginTop: '5px' }}>
                            <Chip 
                                icon={<CheckCircleIcon style={{ color: '#16a34a' }} />} 
                                label={`${validationsCount} Bitácoras Evaluadas`} 
                                size="small"
                                style={{ backgroundColor: '#dcfce3', color: '#166534', fontWeight: 700 }} 
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {isAdmin && (
                        <TextField 
                            placeholder="Buscar tutor, curso o tema..."
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon style={{ color: '#64748b' }} />
                                    </InputAdornment>
                                ),
                                style: { borderRadius: '10px', backgroundColor: '#fff', width: '250px' }
                            }}
                        />
                    )}

                    <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                        <Button 
                            startIcon={<PendingActionsIcon />}
                            onClick={() => setViewMode('Pendientes')}
                            style={{ 
                                backgroundColor: viewMode === 'Pendientes' ? '#fff' : 'transparent',
                                color: viewMode === 'Pendientes' ? '#0f172a' : '#64748b',
                                textTransform: 'none', fontWeight: 600, borderRadius: '8px', boxShadow: viewMode === 'Pendientes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
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
                                textTransform: 'none', fontWeight: 600, borderRadius: '8px', boxShadow: viewMode === 'Historial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Historial
                        </Button>
                    </div>
                </div>
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
                            
                            {viewMode === 'Pendientes' && (
                                <TableCell style={{ fontWeight: 'bold', color: '#4f566b', width: '25%' }}>Comentarios</TableCell>
                            )}

                            {viewMode === 'Historial' && (
                                <TableCell style={{ fontWeight: 'bold', color: '#4f566b', textAlign: 'center' }}>Evaluador</TableCell>
                            )}
                            
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b', textAlign: 'center' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {evidenciasMostradas.map((row) => (
                            <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                
                                <TableCell>
                                    <Typography className='tut-info' style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{row.tutor}</Typography>
                                    <Typography className='course-aprob' style={{ fontSize: '0.85rem', color: '#64748b' }}>{row.course}</Typography>
                                    {isAdmin && viewMode === 'Historial' && (
                                        <Typography style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 'bold', marginTop: '4px' }}>Rev Asignado: {row.revisorName}</Typography>
                                    )}
                                </TableCell>
                                
                                <TableCell className='topic-date'>
                                    {row.date}
                                    <Typography style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '4px' }}>{row.duration} hrs</Typography>
                                </TableCell>
                                
                                <TableCell style={{ maxWidth: '250px' }}>
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

                                {viewMode === 'Pendientes' && (
                                    <TableCell>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            placeholder="Notas de evaluación..."
                                            size="small"
                                            value={inlineComments[row.id] || ''}
                                            onChange={(e) => setInlineComments({ ...inlineComments, [row.id]: e.target.value })}
                                            sx={{ 
                                                backgroundColor: '#f8fafc', 
                                                borderRadius: '8px', 
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '& .MuiInputBase-input': { fontSize: '0.85rem' }
                                            }}
                                        />
                                    </TableCell>
                                )}

                                {viewMode === 'Historial' && (
                                    <TableCell align="center">
                                        <Typography style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                            {getEvaluador(row.reviewerComments)}
                                        </Typography>
                                    </TableCell>
                                )}
                                
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <Button 
                                                    variant="contained" 
                                                    size="small" 
                                                    onClick={() => openEvalModalDialog(row, 'Aprobado')}
                                                    style={{ textTransform: 'none', borderRadius: '6px', backgroundColor: '#10b981', boxShadow: 'none', minWidth: '40px', padding: '4px' }}
                                                >
                                                    <CheckIcon fontSize="small"/>
                                                </Button>
                                                <Button 
                                                    variant="contained" 
                                                    size="small" 
                                                    onClick={() => openEvalModalDialog(row, 'Rechazado')}
                                                    style={{ textTransform: 'none', borderRadius: '6px', backgroundColor: '#ef4444', boxShadow: 'none', minWidth: '40px', padding: '4px' }}
                                                >
                                                    <CloseIcon fontSize="small"/>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {evidenciasMostradas.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#8792a2' }}>
                        No hay bitácoras en esta sección.
                    </div>
                )}
            </TableContainer>

            <div className="bottomSection" style={{ gridTemplateColumns: '1fr', marginTop: '30px' }}>
                <div className="recentActivity" style={{ width: '100%' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>
                        Actividad Reciente
                    </h2>

                    <div 
                        style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            maxHeight: '450px',
                            overflowY: 'auto',
                            paddingRight: '6px'
                        }}
                    >
                        {notificaciones.length > 0 ? notificaciones.map((item) => {
                            const style = getNotifStyle(item.Type);
                            const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                            const timeString = localDate.toLocaleString('es-MX', { 
                                day: '2-digit', 
                                month: 'short', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });

                            return (
                                <Paper 
                                    key={item.NotificationID} 
                                    className={`activity-card ${!item.IsRead ? 'unread' : ''}`} 
                                    elevation={0} 
                                    onClick={() => handleOpenNotification(item)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Avatar 
                                        style={{ 
                                            backgroundColor: style.bg, 
                                            color: style.color, 
                                            width: 40, 
                                            height: 40 
                                        }}
                                    >
                                        {style.icon}
                                    </Avatar>

                                    <Box className="activity-info">
                                        <Typography className="activity-title">
                                            {item.Title}
                                        </Typography>

                                        <Typography 
                                            className="activity-desc" 
                                            style={{ 
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {item.Message}
                                        </Typography>
                                    </Box>

                                    <Typography className="activity-time">
                                        {timeString}
                                    </Typography>

                                    {!item.IsRead && (
                                        <div 
                                            className="unread-dot" 
                                            style={{ 
                                                backgroundColor: '#ef4444',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                marginLeft: '10px'
                                            }}
                                        />
                                    )}
                                </Paper>
                            );
                        }) : (
                            <p 
                                style={{ 
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                    padding: '20px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px'
                                }}
                            >
                                Aún no tienes notificaciones.
                            </p>
                        )}
                    </div>
                </div>
            </div>

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
                            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                                {selectedNotif.Title}
                            </Typography>
                        </div>
                        
                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-start' }}>
                            <Typography variant="caption" style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                {new Date(selectedNotif.CreatedAt.replace(' ', 'T') + 'Z').toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                            </Typography>
                        </div>

                        <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.6, marginBottom: '25px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {selectedNotif.Message}
                        </Typography>
                    </div>
                )}
            </Dialog>

            <Dialog open={evalModal.open} onClose={closeEvalModal} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
                <Box p={2}>
                    <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                        Confirmar Evaluación ({evalModal.status})
                    </Typography>
                    <Typography variant="body2" style={{ color: '#64748b', marginBottom: '20px' }}>
                        Verifica tus comentarios antes de enviarlos. {evalModal.status === 'Rechazado' ? 'Este campo es altamente recomendado para rechazos.' : '(Opcional)'}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Escribe tus comentarios aquí..."
                        value={evalModal.comments}
                        onChange={(e) => setEvalModal({ ...evalModal, comments: e.target.value })}
                        style={{ marginBottom: '20px' }}
                    />
                    
                    {evalModal.status === 'Rechazado' && (
                        <FormControlLabel
                            control={<Checkbox checked={evalModal.allowResubmit} onChange={(e) => setEvalModal({...evalModal, allowResubmit: e.target.checked})} />}
                            label={<Typography variant="body2" style={{ fontWeight: 600, color: '#1e293b' }}>Permitir que el tutor reenvíe la bitácora corregida</Typography>}
                            style={{ marginBottom: '20px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', margin: '0 0 20px 0' }}
                        />
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={closeEvalModal} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            color={evalModal.status === 'Aprobado' ? 'success' : 'error'} 
                            onClick={handleEvaluarSubmit} 
                            style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                        >
                            {evalModal.status === 'Aprobado' ? 'Aprobar Bitácora' : 'Rechazar Bitácora'}
                        </Button>
                    </div>
                </Box>
            </Dialog>

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

                        {sessionDetails.reviewerComments && (
                            <>
                                <Typography style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a', marginTop: '32px' }}>Notas de Evaluación</Typography>
                                <div style={{ backgroundColor: sessionDetails.status === 'Rechazado' ? '#fee2e2' : '#f1f5f9', padding: '24px', borderRadius: '12px', border: sessionDetails.status === 'Rechazado' ? '1px solid #fca5a5' : '1px solid #cbd5e1', marginBottom: '32px' }}>
                                    
                                    <Typography style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
                                        {getEvaluador(sessionDetails.reviewerComments)}
                                    </Typography>
                                    
                                    <Typography style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: sessionDetails.status === 'Rechazado' ? '#991b1b' : '#334155' }}>
                                        {getCleanComment(sessionDetails.reviewerComments)}
                                    </Typography>
                                </div>
                            </>
                        )}

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