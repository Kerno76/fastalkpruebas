// src/pages/Estudiante/MisSesiones.jsx

import { Typography, Paper, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { misSesiones } from "../../data/dataMisSesiones.js";

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function MisSesiones() {
    
    const courseColors = { 'Ingles': 'bg-ingles', 'Frances': 'bg-frances' };

    // Filtro de sesiones por su estatus
    const proximasSesiones = misSesiones.filter(item => item.status === 'upcoming');
    const sesionesPasadas = misSesiones.filter(item => item.status === 'past');

    return (
        <div className='mainContent'>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Mis Sesiones</h2>
                <p className='subtitleMainMS' style={{ margin: 0, fontSize: '15px' }}>
                    Consulta tus próximos enlaces de clase y el material de sesiones pasadas.
                </p>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px' }} />

            {/* Próximas clases */}
            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>
                Próximas Sesiones
            </Typography>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                {proximasSesiones.map((item) => (
                <Paper key={item.id} elevation={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid #e0e4e8', borderRadius: '12px', flexWrap: 'wrap', gap: '15px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px', minWidth: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
                            <Typography className='dateMS' style={{ fontWeight: 'bold', fontSize: '1.1rem'}}>{item.date}</Typography>
                            <Typography className='hourMS' style={{fontSize: '0.9rem' }}>{item.time}</Typography>
                        </div>
                        <div style={{ borderLeft: '2px solid #e0e4e8', height: '45px' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className={`cont-course ${courseColors[item.course] || 'bg-default'}`} style={{ width: 'fit-content', fontSize: '0.75rem' }}>
                                {item.course} - {item.level}
                            </span>
                            <Typography className='topicMS' style={{ fontSize: '0.95rem', fontWeight: '500' }}>{item.topic}</Typography>
                        </div>
                    </div>

                    <div>
                        <Button variant="contained" startIcon={<VideocamIcon />} style={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', padding: '8px 16px' }}>
                            Unirse a Sesión
                        </Button>
                    </div>

                </Paper>
                ))}
            </div>

            {/* Historial pasado */}
            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>
                Historial y Materiales
            </Typography>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sesionesPasadas.map((item) => (
                <Paper key={item.id} elevation={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid #e0e4e8', borderRadius: '12px', flexWrap: 'wrap', gap: '15px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px', minWidth: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
                            <Typography  className='dateMS' style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.date}</Typography>
                            <Typography  className='hourMS' style={{ fontSize: '0.9rem' }}>{item.time}</Typography>
                        </div>
                        <div style={{ borderLeft: '2px solid #e0e4e8', height: '45px' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className={`cont-course ${courseColors[item.course] || 'bg-default'}`} style={{ width: 'fit-content', fontSize: '0.75rem' }}>
                                {item.course} - {item.level}
                            </span>
                            <Typography className='topicMS' style={{ fontSize: '0.95rem', fontWeight: '500' }}>{item.topic}</Typography>
                        </div>
                    </div>

                    <div>
                        <Button 
                            variant="outlined" 
                            startIcon={<MenuBookIcon />} 
                            disabled={!item.material} 
                            style={{ 
                                textTransform: 'none', 
                                borderRadius: '8px', 
                                borderColor: item.material ? '#68899D' : '#e0e4e8', 
                                color: item.material ? '#68899D' : '#a0aab5' 
                            }}
                        >
                            {item.material ? 'Ver Material' : 'Sin material adjunto'}
                        </Button>
                    </div>

                </Paper>
                ))}
            </div>

        </div>
    );
}