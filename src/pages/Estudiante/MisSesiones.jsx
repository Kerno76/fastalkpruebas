import { useState, useEffect } from 'react';
import { Typography, Paper, Button, CircularProgress, Chip, Divider } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ClassIcon from '@mui/icons-material/Class'; 
import toast from 'react-hot-toast';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function MisSesiones() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('Actuales'); 

    useEffect(() => {
        const fetchSesiones = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/student/sesiones/${user.ID}`);
                const data = await res.json();
                if (data.success) {
                    setSesiones(data.sesiones);
                } else {
                    toast.error("Error al cargar sesiones: " + data.message);
                }
            } catch (err) {
                console.error("Error:", err);
                toast.error("Error de conexión al cargar sesiones.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.ID) fetchSesiones();
    }, [user?.ID]);

    const formatDateBlock = (dateStr) => {
        if (!dateStr) return { mes: '---', dia: '--' };
        const fecha = new Date(`${dateStr}T00:00:00`); 
        const mes = fecha.toLocaleDateString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase();
        const dia = fecha.toLocaleDateString('es-ES', { day: '2-digit' });
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        return { mes, dia, diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1) };
    };

    const formatTime12h = (timeStr) => {
        if (!timeStr) return '--:--';
        const [hour, minute] = timeStr.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    const hoyISO = new Date().toISOString().split('T')[0];
    const proximasSesiones = sesiones.filter(item => item.date >= hoyISO);
    const sesionesPasadas = sesiones.filter(item => item.date < hoyISO);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><CircularProgress /></div>;
    }

    return (
        <div className='mainContent'>
            
            <div className="header-container" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title" style={{ margin: 0 }}>Mis Sesiones</h2>
                    <p className='subtitleMainMS' style={{ margin: 0 }}>Consulta tus enlaces de clase y el registro histórico.</p>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                    <Button 
                        startIcon={<ClassIcon />}
                        onClick={() => setViewMode('Actuales')}
                        style={{ 
                            backgroundColor: viewMode === 'Actuales' ? '#fff' : 'transparent',
                            color: viewMode === 'Actuales' ? '#0f172a' : '#64748b',
                            textTransform: 'none', fontWeight: 600, borderRadius: '8px', padding: '6px 16px',
                            boxShadow: viewMode === 'Actuales' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Actuales
                    </Button>
                    <Button 
                        startIcon={<HistoryIcon />}
                        onClick={() => setViewMode('Historial')}
                        style={{ 
                            backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent',
                            color: viewMode === 'Historial' ? '#0f172a' : '#64748b',
                            textTransform: 'none', fontWeight: 600, borderRadius: '8px', padding: '6px 16px',
                            boxShadow: viewMode === 'Historial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Historial
                    </Button>
                </div>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            {viewMode === 'Actuales' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {proximasSesiones.length > 0 ? proximasSesiones.map((item) => {
                        const dateInfo = formatDateBlock(item.date);
                        return (
                            <Paper key={item.id} elevation={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexGrow: 1 }}>
                                    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '12px 15px', minWidth: '75px', textAlign: 'center', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 800 }}>{dateInfo.mes}</Typography>
                                        <Typography style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 900, lineHeight: 1.1 }}>{dateInfo.dia}</Typography>
                                    </div>
                                    <Divider orientation="vertical" flexItem style={{ borderColor: '#e2e8f0' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <Typography style={{ fontSize: '1.25rem', fontWeight: 800 }}>{item.topic}</Typography>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                                                <AccessTimeIcon style={{ fontSize: '1.1rem' }} />
                                                <Typography style={{ fontSize: '0.95rem', fontWeight: 600 }}>{dateInfo.diaSemana}, {formatTime12h(item.time)}</Typography>
                                            </div>
                                            <Chip label={`${item.course} ${item.level ? `- ${item.level}` : ''}`} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 700 }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {item.url ? (
                                        <Button variant="contained" href={item.url} target="_blank" startIcon={<VideocamIcon />} style={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, boxShadow: 'none' }}>Unirse</Button>
                                    ) : (
                                        <Typography variant="body2" style={{ color: '#f59e0b', fontWeight: 600 }}>⏳ Enlace pendiente</Typography>
                                    )}
                                </div>
                            </Paper>
                        );
                    }) : <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay clases próximas.</Typography>}
                </div>
            )}

            {viewMode === 'Historial' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {sesionesPasadas.length > 0 ? sesionesPasadas.map((item) => {
                        const dateInfo = formatDateBlock(item.date);
                        return (
                            <Paper key={item.id} elevation={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px' }}>
                                        <Typography style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800 }}>{dateInfo.mes}</Typography>
                                        <Typography style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: 800 }}>{dateInfo.dia}</Typography>
                                    </div>
                                    <Divider orientation="vertical" flexItem style={{ borderColor: '#e2e8f0' }} />
                                    <div>
                                        <Typography style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>{item.topic}</Typography>
                                        <Typography style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatTime12h(item.time)} | {item.course} {item.level}</Typography>
                                    </div>
                                </div>
                                <Button variant="outlined" disabled size="small" style={{ textTransform: 'none', borderRadius: '8px', borderColor: '#cbd5e1', color: '#94a3b8' }}>Finalizada</Button>
                            </Paper>
                        );
                    }) : <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay historial disponible.</Typography>}
                </div>
            )}

        </div>
    );
}