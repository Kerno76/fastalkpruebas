import { Typography, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { misTareas } from "../../data/dataMisTareas.js";

import '../../styles/App.css';
import '../../styles/Estudiante/EstudianteDashboard.css'; 

export default function MisTareas() {
    
    // Friltro de tareas en dos grupos según su estatus
    const tareasPendientes = misTareas.filter(item => item.status === 'pending');
    const tareasPasadas = misTareas.filter(item => item.status === 'submitted' || item.status === 'graded');

    return (
        <div className='mainContent'>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 className="dashboard-title" style={{ marginTop: 0 }}>Mis Tareas</h2>
                <p id="dashboard-subtitle" style={{ margin: 0 }}>
                    Revisa tus asignaciones, sube tus evidencias y consulta tu retroalimentación.
                </p>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            {/* Tareas Activas */}
            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>
                Tareas por vencer
            </Typography>

            <div className='dashboard-cards-grid'>
                {tareasPendientes.map((item) => (
                <div key={item.id} className="dash-card">
                    
                    {/* Información principal de la tarea */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                        <Typography style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            {item.title}
                        </Typography>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                            <Typography style={{ fontSize: '0.85rem', color: '#e74c3c', fontWeight: '600' }}>
                                Vence: {item.deadlineDate} - {item.deadlineTime}
                            </Typography>
                        </div>

                        {/* Enlace al material proporcionado por el tutor */}
                        {item.materialLink ? (
                            <a href={item.materialLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                                📎 Ver material adjunto
                            </a>
                        ) : (
                            <Typography style={{ fontSize: '0.9rem', color: '#a0aab5', fontStyle: 'italic' }}>
                                Sin material adjunto
                            </Typography>
                        )}
                    </div>

                    {/* Botón dinámico según el estado (1 intento) */}
                    <div style={{ marginTop: '25px' }}>
                        <Button variant="contained" fullWidth startIcon={<UploadFileIcon />} style={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', padding: '10px' }}>
                            Subir Tarea
                        </Button>
                    </div>

                </div>
                ))}
            </div>

            {/* Historial (Entregadas y Calificadas) */}
            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginTop: '20px', marginBottom: '15px' }}>
                Historial de tareas
            </Typography>

            <div className='dashboard-cards-grid'>
                {tareasPasadas.map((item) => (
                <div key={item.id} className="dash-card">
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                        <Typography style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            {item.title}
                        </Typography>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                            <Typography style={{ fontSize: '0.85rem', color: '#68899D', fontWeight: '600' }}>
                                Entregada el: {item.deadlineDate}
                            </Typography>
                        </div>

                        {item.materialLink ? (
                            <a href={item.materialLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                                📎 Ver material adjunto
                            </a>
                        ) : (
                            <Typography style={{ fontSize: '0.9rem', color: '#a0aab5', fontStyle: 'italic' }}>
                                Sin material adjunto
                            </Typography>
                        )}
                    </div>

                    <div style={{ marginTop: '25px' }}>
                        {item.status === 'submitted' && (
                            <Button variant="outlined" fullWidth startIcon={<CheckCircleIcon />} disabled style={{ textTransform: 'none', borderRadius: '8px', padding: '10px', color: '#2ecc71', borderColor: '#2ecc71' }}>
                                Entregado (En revisión)
                            </Button>
                        )}

                        {item.status === 'graded' && (
                            <Button variant="outlined" fullWidth startIcon={<VisibilityIcon />} style={{ textTransform: 'none', borderRadius: '8px', padding: '10px', color: '#68899D', borderColor: '#68899D' }}>
                                Ver Retroalimentación
                            </Button>
                        )}
                    </div>

                </div>
                ))}
            </div>

        </div>
    );
}