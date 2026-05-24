import { useState, useEffect } from 'react';
import { Typography, Paper, Button, Chip, CircularProgress } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import ClassIcon from '@mui/icons-material/Class';
import EventIcon from '@mui/icons-material/Event';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import toast from 'react-hot-toast';

import '../../styles/App.css';

export default function VisitasRevisor() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSesiones = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/revisor/sesiones-monitoreo/${user.ID}`);
            const data = await res.json();
            if (data.success) {
                setSesiones(data.sesiones);
            } else {
                toast.error("Error al cargar agenda: " + data.message);
            }
        } catch (error) {
            console.error("Error de red:", error);
            toast.error("Error de conexión al servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.ID) fetchSesiones();
    }, [user?.ID]);

    const hoyIso = new Date().toISOString().split('T')[0];

    const sesionesHoy = sesiones.filter(s => s.date === hoyIso);
    const sesionesFuturas = sesiones.filter(s => s.date > hoyIso);

    const renderCard = (sesion, esHoy) => (
        <Paper key={sesion.id} elevation={0} style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            border: esHoy ? '2px solid #bae6fd' : '1px solid #e2e8f0', 
            backgroundColor: esHoy ? '#f0f9ff' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '15px'
        }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <Chip 
                        icon={<ClassIcon style={{ color: esHoy ? '#0284c7' : '#475569' }} fontSize="small" />} 
                        label={sesion.course} 
                        size="small" 
                        style={{ backgroundColor: esHoy ? '#e0f2fe' : '#f1f5f9', color: esHoy ? '#0369a1' : '#475569', fontWeight: 700 }} 
                    />
                    <Typography variant="body2" style={{ fontWeight: 800, color: esHoy ? '#ea580c' : '#64748b' }}>
                        {sesion.date} • {sesion.startTime.substring(0,5)}
                    </Typography>
                </div>
                
                <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '8px', lineHeight: 1.2 }}>
                    {sesion.topic}
                </Typography>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                    <AccountCircleIcon fontSize="small" />
                    <Typography variant="body2" style={{ fontWeight: 600 }}>Tutor: {sesion.tutorName}</Typography>
                </div>
            </div>

            <Button 
                variant={esHoy ? "contained" : "outlined"}
                fullWidth 
                startIcon={<VideocamIcon />}
                onClick={() => sesion.url ? window.open(sesion.url, '_blank') : toast.error("El tutor no adjuntó un enlace")}
                style={{ 
                    backgroundColor: esHoy ? '#0ea5e9' : 'transparent',
                    color: esHoy ? 'white' : '#68899D',
                    borderColor: esHoy ? 'transparent' : '#68899D',
                    textTransform: 'none', 
                    fontWeight: 700, 
                    borderRadius: '8px',
                    boxShadow: 'none',
                    marginTop: '10px'
                }}
            >
                Entrar a la Sala
            </Button>
        </Paper>
    );

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><CircularProgress /></div>;

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ marginBottom: '30px' }}>
                <div>
                    <h2 className="dashboard-title">Monitoreo de Clases</h2>
                    <p className="subtitleMainMS">
                        {isAdmin ? 'Supervisa las sesiones activas de todos los tutores.' : 'Visita y evalúa el desempeño en vivo de los tutores a tu cargo.'}
                    </p>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <Typography variant="h6" style={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <VideocamIcon /> Sesiones del Día de Hoy
                </Typography>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {sesionesHoy.length > 0 ? (
                        sesionesHoy.map(s => renderCard(s, true))
                    ) : (
                        <Typography style={{ color: '#64748b', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                            Tus tutores no tienen clases programadas para el día de hoy.
                        </Typography>
                    )}
                </div>
            </div>

            <div>
                <Typography variant="h6" style={{ fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <EventIcon /> Próximamente (Agenda General)
                </Typography>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {sesionesFuturas.length > 0 ? (
                        sesionesFuturas.map(s => renderCard(s, false))
                    ) : (
                        <Typography style={{ color: '#64748b', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                            No hay clases agendadas a futuro por el momento.
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
}