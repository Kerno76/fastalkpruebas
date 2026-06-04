import { useState, useEffect } from 'react';
import { CalendarWidget } from "../../components/CalendarWidget";
import '../../styles/App.css';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; 
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Typography, Avatar, Paper, Dialog, IconButton, Button, TextField, Chip, Tooltip } from '@mui/material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

const getNotifStyle = (type) => {
    switch(type) {
        case 'MaterialSubido': return { icon: <CloudUploadIcon />, bg: '#e0f2fe', color: '#0284c7' };
        case 'SesionRevisada': return { icon: <CheckCircleIcon />, bg: '#dcfce7', color: '#16a34a' };
        case 'SessionAgendada': return { icon: <EventAvailableIcon />, bg: '#f3e8ff', color: '#9333ea' };
        case 'AlertaAdmin': return { icon: <NotificationsActiveIcon />, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: <NotificationsActiveIcon />, bg: '#f1f5f9', color: '#475569' };
    }
};

const getStatIcon = (title) => {
    if (title.includes('Estudiantes')) return <PeopleIcon style={{ color: '#3b82f6' }} />;
    if (title.includes('Tutores')) return <SchoolIcon style={{ color: '#8b5cf6' }} />;
    if (title.includes('Cursos')) return <ClassIcon style={{ color: '#10b981' }} />;
    return <PeopleIcon />;
};

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const adminId = user?.ID;

    const [stats, setStats] = useState([
        { title: "Estudiantes Activos", amount: 0 },
        { title: "Tutores Activos", amount: 0 },
        { title: "Cursos Activos", amount: 0 }
    ]);
    const [notificaciones, setNotificaciones] = useState([]);
    const [openNotifModal, setOpenNotifModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);

    const [eventosBD, setEventosBD] = useState([]); 
    const [fechasPuntitos, setFechasPuntitos] = useState([]);
    const [openEventModal, setOpenEventModal] = useState(false);
    const [modalMode, setModalMode] = useState('list'); 
    const [eventosDelDia, setEventosDelDia] = useState([]); 
    
    const [newEventData, setNewEventData] = useState({ id: null, title: '', date: dayjs(), time: dayjs(), description: '' });

    const fetchData = async () => {
        if (!adminId) return;
        try {
            const resStats = await fetch('http://localhost:8000/api/admin/dashboard-summary');
            const dataStats = await resStats.json();
            if (dataStats.success) setStats(dataStats.stats);

            const resNotif = await fetch(`http://localhost:8000/api/admin/notificaciones/${adminId}`);
            const dataNotif = await resNotif.json();
            if (dataNotif.success) setNotificaciones(dataNotif.notificaciones);

            const resEvents = await fetch(`http://localhost:8000/api/admin/eventos/${adminId}`);
            const dataEvents = await resEvents.json();
            
            if (dataEvents.success) {
                const ahora = dayjs(); 
                
                const eventosFuturos = dataEvents.eventos.filter(e => {
                    const fechaEvento = dayjs(`${e.Date} ${e.Time}`);
                    return fechaEvento.isAfter(ahora);
                });

                setEventosBD(eventosFuturos); 
                
                const unicas = [...new Set(eventosFuturos.map(e => e.Date))];
                setFechasPuntitos(unicas);
            }
            
        } catch (error) { console.error("Error cargando dashboard:", error); }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000); 
        return () => clearInterval(intervalId);
    }, [adminId]);

    const handleOpenNotification = async (notif) => {
        setSelectedNotif(notif);
        setOpenNotifModal(true);

        if (!notif.IsRead) {
            try {
                await fetch(`http://localhost:8000/api/admin/notificaciones/leer/${notif.NotificationID}`, { method: 'PUT' });
                setNotificaciones(prev => prev.map(n => n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n));
            } catch (error) { console.error(error); }
        }
    };

    const handleDateSelect = (newDate) => {
        const fechaFormateada = newDate.format('YYYY-MM-DD');
        setNewEventData({ id: null, title: '', date: newDate, time: dayjs().startOf('hour').add(1, 'hour'), description: '' });

        const eventosHoy = eventosBD.filter(e => e.Date === fechaFormateada);
        
        if (eventosHoy.length > 0) {
            setEventosDelDia(eventosHoy);
            setModalMode('list');
        } else {
            setModalMode('create');
        }
        setOpenEventModal(true);
    };

    const handleEditEvent = (evento) => {
        setNewEventData({
            id: evento.EventID,
            title: evento.Title,
            date: dayjs(evento.Date),
            time: dayjs(`${evento.Date}T${evento.Time}`),
            description: evento.Description || ''
        });
        setModalMode('create');
    };

    const handleDeleteEvent = async (eventId) => {
        if(!window.confirm("¿Estás seguro de que deseas eliminar este evento?")) return;
        
        const loadingId = toast.loading("Eliminando...");
        try {
            await fetch(`http://localhost:8000/api/admin/eventos/${eventId}`, { method: 'DELETE' });
            toast.success("Evento eliminado", { id: loadingId });
            fetchData();
            setOpenEventModal(false);
        } catch (error) {
            toast.error("Error al eliminar", { id: loadingId });
        }
    };

    const handleSaveEvent = async () => {
        const { id, title, date, time, description } = newEventData;

        if (!date || !date.isValid()) return toast.error("Falta seleccionar la fecha válida.");
        if (!time || !time.isValid()) return toast.error("Falta seleccionar una hora válida.");
        if (!title || title.trim() === '') return toast.error("Falta agregar el título del evento.");
        
        const loadingId = toast.loading(id ? "Actualizando evento..." : "Agendando evento...");
        
        const dateStr = date.format('YYYY-MM-DD');
        const timeStr = time.format('HH:mm');
        const isEditing = id !== null;
        const url = isEditing ? `http://localhost:8000/api/admin/eventos/${id}` : `http://localhost:8000/api/admin/eventos`;

        try {
            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    AdminID: adminId,
                    Title: title.trim(),
                    Date: dateStr,
                    Time: timeStr,
                    Description: (description || '').trim() 
                })
            });
            const data = await response.json();
            if(!data.success) throw new Error(data.message);

            fetchData();
            toast.success(isEditing ? `Evento actualizado` : `Evento agendado con éxito`, { id: loadingId });
            setOpenEventModal(false);
        } catch (error) {
            toast.error("Error al guardar evento", { id: loadingId });
        }
    };

    const savedPrefs = JSON.parse(localStorage.getItem(`notifPrefs_${user?.ID}`)) || {
        sesiones: true, tareas: true, alertas: true, 
        revisiones: true, entregas: true, bitacoras: true, cursos: true
    };
    const currentUserRole = user?.Rol || 'Admin';

    const notificacionesFiltradas = notificaciones.filter((item) => {
        if (currentUserRole === 'Student') {
            if (['SessionAgendada', 'ReporteIncidencia'].includes(item.Type) && !savedPrefs.sesiones) return false;
            if (item.Type === 'AsignacionCurso' && !savedPrefs.tareas) return false;
            if (item.Type === 'AlertaAdmin' && !savedPrefs.alertas) return false;
        }
        else if (currentUserRole === 'Tutor') {
            if (item.Type === 'SessionRevisada' && !savedPrefs.revisiones) return false;
            if (item.Type === 'MaterialSubido' && !savedPrefs.entregas) return false;
            if (item.Type === 'AlertaAdmin' && !savedPrefs.alertas) return false;
        }
        else if (currentUserRole === 'Reviewer') {
            if (item.Type === 'MaterialSubido' && !savedPrefs.bitacoras) return false;
        }
        else if (currentUserRole === 'Admin') {
            if (item.Type === 'AlertaAdmin' && !savedPrefs.cursos) return false;
            if (item.Type === 'MaterialSubido' && !savedPrefs.bitacoras) return false;
        }
        return true; 
    });

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="mainContent">
                <h2 id="Title">Panel Principal</h2>
                <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está el resumen general de FasTalk.</p>

                <div className="dashboard-cards-grid">
                    {stats.map((stat, index) => (
                    <div key={index} className="dash-card">
                        <div className="dash-card-header">
                        <h1>{stat.title}</h1>
                        <span className="icon-wrapper" style={{ backgroundColor: '#f8fafc', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                            {getStatIcon(stat.title)}
                        </span>
                        </div>
                        <div className="stat-container">
                        <span className="stat-number-dash">{stat.amount}</span>
                        <span className="stat-label-dash">Total en sistema</span>
                        </div>
                        <p className="card-footer-text" style={{ color: '#64748b' }}>Cálculo en tiempo real</p>
                    </div>
                    ))}
                </div>

                <div className="bottomSection">
                    <div className="recentActivity">
                        <h2 style={{ marginBottom: '15px' }}>Actividad Reciente</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '10px' }}>
                            {notificacionesFiltradas.length > 0 ? notificacionesFiltradas.map((item) => {
                                const style = getNotifStyle(item.Type);
                                let timeString = 'Fecha no disponible';
                                try {
                                    if (item.CreatedAt) {
                                        const localDate = new Date(item.CreatedAt.replace(' ', 'T') + 'Z');
                                        timeString = localDate.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                                    }
                                } catch(e) { console.warn("Fecha inválida"); }

                                return (
                                    <Paper 
                                        key={item.NotificationID} 
                                        className={`activity-card ${!item.IsRead ? 'unread' : ''}`} 
                                        elevation={0}
                                        onClick={() => handleOpenNotification(item)}
                                        style={{ cursor: 'pointer', flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: '12px' }}
                                    >
                                        <Avatar style={{ backgroundColor: style.bg, color: style.color }}>{style.icon}</Avatar>
                                        <Box className="activity-info">
                                            <Typography className="activity-title">{item.Title}</Typography>
                                            <Typography className="activity-desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.Message}
                                            </Typography>
                                        </Box>
                                        <Typography className="activity-time">{timeString}</Typography>
                                        {!item.IsRead && <div className="unread-dot" style={{ backgroundColor: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', marginLeft: '10px' }}></div>}
                                    </Paper>
                                );
                            }) : (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                                    Aún no hay actividad reciente en el sistema.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="calendar">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0 }}>Agenda General</h2>
                            <Button 
                                size="small" variant="contained" startIcon={<AddIcon />} 
                                onClick={() => {
                                    setNewEventData({ id: null, title: '', date: dayjs(), time: dayjs().startOf('hour').add(1, 'hour'), description: '' });
                                    setModalMode('create');
                                    setOpenEventModal(true);
                                }}
                                style={{ textTransform: 'none', borderRadius: '8px', backgroundColor: '#1e293b', boxShadow: 'none' }}
                            >
                                Agendar
                            </Button>
                        </div>
                        <Paper elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '10px', marginRight: '10px'}}>
                            <Typography variant="caption" style={{ display: 'block', textAlign: 'center', color: '#94a3b8', marginBottom: '5px' }}>
                                Haz clic en un día para ver o agregar eventos
                            </Typography>
                            <CalendarWidget fechasAgendadas={fechasPuntitos} onDateSelect={handleDateSelect} />
                        </Paper>
                    </div>
                </div>

                <Dialog open={openEventModal} onClose={() => setOpenEventModal(false)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '20px', padding: '15px' } }}>
                    <div style={{ padding: '20px', position: 'relative' }}>
                        <IconButton onClick={() => setOpenEventModal(false)} style={{ position: 'absolute', right: 0, top: 0, color: '#94a3b8' }}>
                            <CloseIcon />
                        </IconButton>

                        {modalMode === 'list' ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Avatar style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}><EventNoteIcon /></Avatar>
                                    <div>
                                        <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>Eventos del día</Typography>
                                        <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>{newEventData.date.format('YYYY-MM-DD')}</Typography>
                                    </div>
                                </div>

                                <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {eventosDelDia.map(e => (
                                        <Paper key={e.EventID} elevation={0} style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                                <div>
                                                    <Typography variant="subtitle1" style={{ fontWeight: 800, color: '#0f172a' }}>{e.Title}</Typography>
                                                    <Chip label={e.Time?.substring(0,5)} size="small" style={{ backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 800, marginTop: '4px' }} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <Tooltip title="Editar">
                                                        <IconButton size="small" onClick={() => handleEditEvent(e)}><EditIcon fontSize="small" style={{ color: '#64748b' }}/></IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton size="small" onClick={() => handleDeleteEvent(e.EventID)}><DeleteIcon fontSize="small" style={{ color: '#ef4444' }}/></IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            {e.Description && <Typography variant="body2" style={{ color: '#475569', marginTop: '8px' }}>{e.Description}</Typography>}
                                        </Paper>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Button variant="outlined" fullWidth onClick={() => setOpenEventModal(false)} style={{ textTransform: 'none', borderRadius: '10px', color: '#64748b', borderColor: '#e2e8f0' }}>Cerrar</Button>
                                    <Button variant="contained" fullWidth onClick={() => { 
                                        setNewEventData({ id: null, title: '', date: newEventData.date, time: dayjs().startOf('hour').add(1, 'hour'), description: '' }); 
                                        setModalMode('create'); 
                                    }} style={{ backgroundColor: '#f59e0b', textTransform: 'none', borderRadius: '10px', boxShadow: 'none', fontWeight: 700 }}>Agendar otro evento</Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                                    <Avatar style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}><EditCalendarIcon /></Avatar>
                                    <div>
                                        <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
                                            {newEventData.id ? 'Editar Evento' : 'Agendar Evento'}
                                        </Typography>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <DatePicker 
                                            label="Fecha" 
                                            value={newEventData.date}
                                            onChange={(newVal) => setNewEventData(prev => ({ ...prev, date: newVal }))}
                                            sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f8fafc' } }}
                                        />
                                        <TimePicker 
                                            label="Hora" 
                                            value={newEventData.time}
                                            onChange={(newVal) => setNewEventData(prev => ({ ...prev, time: newVal }))}
                                            sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f8fafc' } }}
                                        />
                                    </div>
                                    <TextField 
                                        name="title" label="Título del Evento" fullWidth placeholder="Ej. Junta de revisión de tutores" 
                                        value={newEventData.title} onChange={(e) => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
                                        InputProps={{ style: { borderRadius: '10px', backgroundColor: '#f8fafc' } }}
                                    />
                                    <TextField 
                                        name="description" label="Descripción / Notas adicionales" fullWidth multiline rows={3}
                                        value={newEventData.description} onChange={(e) => setNewEventData(prev => ({ ...prev, description: e.target.value }))}
                                        InputProps={{ style: { borderRadius: '10px', backgroundColor: '#f8fafc' } }}
                                    />
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        {eventosDelDia.length > 0 && !newEventData.id && (
                                            <Button variant="outlined" onClick={() => setModalMode('list')} style={{ textTransform: 'none', borderRadius: '10px', color: '#64748b', borderColor: '#e2e8f0', flex: 1 }}>Volver a la lista</Button>
                                        )}
                                        {newEventData.id && (
                                            <Button variant="outlined" onClick={() => setOpenEventModal(false)} style={{ textTransform: 'none', borderRadius: '10px', color: '#64748b', borderColor: '#e2e8f0', flex: 1 }}>Cancelar</Button>
                                        )}
                                        <Button variant="contained" onClick={handleSaveEvent} style={{ backgroundColor: '#1e293b', textTransform: 'none', fontWeight: 800, padding: '12px', borderRadius: '10px', boxShadow: 'none', flex: 2 }}>
                                            {newEventData.id ? 'Actualizar Evento' : 'Guardar Evento'}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Dialog>

                <Dialog open={openNotifModal} onClose={() => setOpenNotifModal(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '20px', padding: '10px' } }}>
                    {selectedNotif && (
                        <div style={{ padding: '20px', position: 'relative' }}>
                            <IconButton onClick={() => setOpenNotifModal(false)} style={{ position: 'absolute', right: 5, top: 5, color: '#94a3b8' }}><CloseIcon /></IconButton>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                <Avatar style={{ backgroundColor: getNotifStyle(selectedNotif.Type).bg, color: getNotifStyle(selectedNotif.Type).color, width: 50, height: 50 }}>
                                    {getNotifStyle(selectedNotif.Type).icon}
                                </Avatar>
                                <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{selectedNotif.Title}</Typography>
                            </div>
                            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-start' }}>
                                <Typography variant="caption" style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                    {new Date(selectedNotif.CreatedAt.replace(' ', 'T') + 'Z').toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                                </Typography>
                            </div>
                            <Typography variant="body1" style={{ color: '#475569', lineHeight: 1.6, marginBottom: '10px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                {selectedNotif.Message}
                            </Typography>
                        </div>
                    )}
                </Dialog>
            </div>
        </LocalizationProvider>
    )
}