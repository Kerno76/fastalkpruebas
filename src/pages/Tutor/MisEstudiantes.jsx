import { useState } from 'react';
import { Typography, Avatar, Paper, TextField, Box } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import { studentsR } from "../../data/dataEstudiantes.js";

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function MisEstudiantes() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    const courseColors = { 'Ingles': 'bg-ingles', 'Frances': 'bg-frances' };

    const [busquedaAdmin, setBusquedaAdmin] = useState("");

    // Filtrado: Admin ve todo o busca, Tutor solo ve sus alumnos asignados
    const estudiantesFiltrados = studentsR.filter((item) => {
        if (isAdmin) {
            return busquedaAdmin === "" || 
                item.name.toLowerCase().includes(busquedaAdmin.toLowerCase()) ||
                item.tutorAsignado?.toLowerCase().includes(busquedaAdmin.toLowerCase());
        }
        return item.tutorAsignado === user?.Name;
    });

    return (
        <div className='mainContent'>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {isAdmin ? "Directorio Global de Estudiantes" : "Mis Estudiantes"}
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                    {isAdmin ? "Modo Administrador: Supervisión de todos los alumnos y sus tutores." : "Aquí puedes ver el progreso y gestionar a los alumnos que tienes asignados."}
                </p>
            </div>

            {/* Buscador exclusivo para el Admin */}
            {isAdmin && (
                <Box sx={{ mb: 4, p: 2, bgcolor: '#f0f4f8', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SearchIcon style={{ color: '#64748b' }} />
                    <TextField 
                        fullWidth 
                        variant="outlined" 
                        size="small" 
                        placeholder="Buscar por nombre de alumno o tutor responsable..."
                        value={busquedaAdmin}
                        onChange={(e) => setBusquedaAdmin(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                    />
                </Box>
            )}

            <hr className="divisor" style={{ marginBottom: '25px' }} />

            <div className='cards-grid'>
                {estudiantesFiltrados.map((item) => (
                <Paper key={item.id} className="student-card" elevation={0} style={{ backgroundColor: 'var(--bg-card)', borderColor: '#e0e4e8' }}>
                    
                    <div className="card-top">
                        <Avatar className="student-avatar">
                            <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                        </Avatar>

                        <div className="student-data">
                            {isAdmin && (
                                <Typography style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>
                                    Tutor: {item.tutorAsignado || 'Sin asignar'}
                                </Typography>
                            )}
                            <Typography className="student-name-title" style={{ marginBottom: '10px' }}>{item.name}</Typography>
                            
                            <div className="info-row">
                                <span className="label">Nivel</span>
                                <span className="cont-level">{item.level}</span>
                                <span className="label" style={{marginLeft: '10px'}}>Curso</span>
                                <span className={`cont-course ${courseColors[item.course] || 'bg-default'}`}>{item.course}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px' }}>
                                <Typography className='myStudents-info' variant="body2" style={{ fontSize: '0.85rem' }}>
                                    Horas dadas: <strong className='info-stud'>{item.horasTotales || '0 hrs'}</strong>
                                </Typography>
                                <Typography className='myStudents-info' variant="body2" style={{ fontSize: '0.85rem' }}>
                                    Última sesión: <strong className='info-stud'>{item.ultimaSesion || 'Sin registro'}</strong>
                                </Typography>
                            </div>
                        </div>
                    </div>

                    <div className="bottom-actions" style={{ marginTop: '5px' }}>
                        <button className="details">Ver Expediente</button>
                        {/* El admin puede ver expedientes pero no agendar clases directamente desde aquí */}
                        {!isAdmin && (
                            <>
                                <button className="assign" style={{ backgroundColor: '#4caf50', boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)' }}>Agendar Clase</button>
                                <button className="assign">Dejar Tarea</button>
                            </>
                        )}
                    </div>

                </Paper>
                ))}
            </div>

            {estudiantesFiltrados.length === 0 && (
                <Typography style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>
                    No se encontraron estudiantes con los criterios de búsqueda.
                </Typography>
            )}
        </div>
    );
}