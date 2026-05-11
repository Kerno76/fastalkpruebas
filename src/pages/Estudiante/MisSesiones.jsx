import { useState, useEffect } from 'react';
import { Typography, Paper, Button, CircularProgress } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryIcon from '@mui/icons-material/History';
import toast from 'react-hot-toast';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function MisSesiones() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);

    const courseColors = { 
        'Inglés': 'bg-ingles', 
        'Francés': 'bg-frances' 
    };

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

    const hoyISO = new Date().toISOString().split('T')[0];
    
    const proximasSesiones = sesiones.filter(item => item.date >= hoyISO);
    
    const sesionesPasadas = sesiones.filter(item => item.date < hoyISO);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><CircularProgress /></div>;
    }

    return (
        <div className='mainContent'>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Mis Sesiones</h2>
                <p className='subtitleMainMS' style={{ margin: 0, fontSize: '15px' }}>
                    Consulta tus próximos enlaces de clase y el registro de las que ya tomaste.
                </p>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>
                Próximas Sesiones
            </Typography>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                {proximasSesiones.length > 0 ? proximasSesiones.map((item) => (
                    <Paper key={item.id} elevation={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid #e0e4e8', borderRadius: '12px', flexWrap: 'wrap', gap: '15px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '25px', minWidth: '300px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
                                <Typography className='dateMS' style={{ fontWeight: 'bold', fontSize: '1.1rem'}}>{item.date}</Typography>
                                <Typography className='hourMS' style={{fontSize: '0.9rem', color: '#64748b' }}>{item.time}</Typography>
                            </div>
                            <div style={{ borderLeft: '2px solid #e0e4e8', height: '45px' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span className={`cont-course ${courseColors[item.language] || 'bg-ingles'}`} style={{ width: 'fit-content', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                    {item.course} - {item.level}
                                </span>
                                <Typography className='topicMS' style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1e293b' }}>{item.topic}</Typography>
                            </div>
                        </div>

                        <div>
                            {item.url ? (
                                <Button 
                                    variant="contained" 
                                    href={item.url} 
                                    target="_blank" 
                                    startIcon={<VideocamIcon />} 
                                    style={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, boxShadow: 'none' }}
                                >
                                    Unirse a Sesión
                                </Button>
                            ) : (
                                <Typography variant="caption" style={{ color: '#94a3b8', fontStyle: 'italic' }}>Enlace pendiente...</Typography>
                            )}
                        </div>

                    </Paper>
                )) : (
                    <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>No tienes clases programadas próximamente.</Typography>
                )}
            </div>

            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>
                Historial de Sesiones
            </Typography>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sesionesPasadas.length > 0 ? sesionesPasadas.map((item) => (
                    <Paper key={item.id} elevation={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e0e4e8', borderRadius: '12px', flexWrap: 'wrap', gap: '15px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '25px', minWidth: '300px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
                                <Typography className='dateMS' style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#64748b' }}>{item.date}</Typography>
                                <Typography className='hourMS' style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{item.time}</Typography>
                            </div>
                            <div style={{ borderLeft: '2px solid #e2e8f0', height: '45px' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span className={`cont-course ${courseColors[item.language] || 'bg-ingles'}`} style={{ width: 'fit-content', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, opacity: 0.8 }}>
                                    {item.course} - {item.level}
                                </span>
                                <Typography className='topicMS' style={{ fontSize: '0.95rem', fontWeight: '500', color: '#475569' }}>{item.topic}</Typography>
                            </div>
                        </div>

                        <div>
                            <Button 
                                variant="outlined" 
                                startIcon={<HistoryIcon />} 
                                disabled
                                style={{ 
                                    textTransform: 'none', 
                                    borderRadius: '8px', 
                                    borderColor: '#cbd5e1', 
                                    color: '#94a3b8',
                                    fontWeight: 600
                                }}
                            >
                                Sesión Finalizada
                            </Button>
                        </div>

                    </Paper>
                )) : (
                    <Typography style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aún no tienes un historial de clases pasadas.</Typography>
                )}
            </div>

        </div>
    );
}