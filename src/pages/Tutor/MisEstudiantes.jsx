import { Typography, Avatar, Paper } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { studentsR } from "../../data/dataEstudiantes.js";
// Estilos
import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function MisEstudiantes() {
    
    const courseColors = {
        'Ingles': 'bg-ingles',
        'Frances': 'bg-frances'
    };

    return (
        <div className='mainContent'>
            
            {/* Encabezado principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Mis Estudiantes</h2>
                <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                    Aquí puedes ver el progreso y gestionar a los alumnos que tienes asignados.
                </p>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px' }} />

            <div className='cards-grid'>
                
                {/* Renderizado dinámico usando la data global */}
                {studentsR.map((item) => (
                <Paper key={item.id} className="student-card" elevation={0} style={{ backgroundColor: 'var(--bg-card)', borderColor: '#e0e4e8' }}>
                    
                    <div className="card-top">
                        <Avatar className="student-avatar">
                            <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                        </Avatar>

                        <div className="student-data">
                            <Typography className="student-name-title" style={{ marginBottom: '10px' }}>{item.name}</Typography>
                            
                            <div className="info-row">
                                <span className="label">Nivel</span>
                                <span className="cont-level">{item.level}</span>
                                <span className="label" style={{marginLeft: '10px'}}>Curso</span>
                                <span className={`cont-course ${courseColors[item.course] || 'bg-default'}`}>{item.course}</span>
                            </div>

                            {/* Estadísticas individuales con valores por defecto (fallbacks) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px' }}>
                                <Typography variant="body2" style={{ fontSize: '0.85rem', color: '#555' }}>
                                    Horas dadas: <strong style={{ color: '#2c3e50' }}>{item.horasTotales || '0 hrs'}</strong>
                                </Typography>
                                <Typography variant="body2" style={{ fontSize: '0.85rem', color: '#555' }}>
                                    Última sesión: <strong style={{ color: '#2c3e50' }}>{item.ultimaSesion || 'Sin registro'}</strong>
                                </Typography>
                            </div>
                        </div>
                    </div>

                    {/* Acciones directas del tutor */}
                    <div className="bottom-actions" style={{ marginTop: '5px' }}>
                        <button className="details">Ver Expediente</button>
                        <button className="assign" style={{ backgroundColor: '#4caf50', boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)' }}>Agendar Clase</button>
                        <button className="assign">Dejar Tarea</button>
                    </div>

                </Paper>
                ))}
            </div>
        </div>
    );
}