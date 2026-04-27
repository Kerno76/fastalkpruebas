import { useState } from 'react';
import { Typography, Button, TextField, Box } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import { misTareas } from "../../data/dataMisTareas.js";

import '../../styles/App.css';
import '../../styles/Estudiante/EstudianteDashboard.css'; 

export default function MisTareas() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    
    const [busquedaAdmin, setBusquedaAdmin] = useState("");

    // Filtrado dinámico según Rol y búsqueda
    const tareasFiltradas = misTareas.filter((tarea) => {
        if (isAdmin) {
            return busquedaAdmin === "" || 
                tarea.estudiante?.toLowerCase().includes(busquedaAdmin.toLowerCase());
        }
        return tarea.estudiante === user?.Name;
    });

    const tareasPendientes = tareasFiltradas.filter(item => item.status === 'pending');
    const tareasPasadas = tareasFiltradas.filter(item => item.status === 'submitted' || item.status === 'graded');

    return (
        <div className='mainContent'>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 className="dashboard-title" style={{ marginTop: 0 }}>
                    {isAdmin ? "Panel Global de Tareas" : "Mis Tareas"}
                </h2>
                <p id="dashboard-subtitle" style={{ margin: 0 }}>
                    {isAdmin ? "Auditoría de asignaciones y entregas de todos los alumnos." : "Revisa tus asignaciones, sube tus evidencias y consulta tu retroalimentación."}
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
                        placeholder="Buscar tareas por nombre de estudiante..."
                        value={busquedaAdmin}
                        onChange={(e) => setBusquedaAdmin(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                    />
                </Box>
            )}

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>
                Tareas por vencer
            </Typography>

            <div className='dashboard-cards-grid'>
                {tareasPendientes.map((item) => (
                <div key={item.id} className="dash-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                        {isAdmin && <Typography style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#3b82f6'}}>ALUMNO: {item.estudiante}</Typography>}
                        <Typography style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            {item.title}
                        </Typography>
                        <Typography style={{ fontSize: '0.85rem', color: '#e74c3c', fontWeight: '600' }}>
                            Vence: {item.deadlineDate} - {item.deadlineTime}
                        </Typography>
                        <a href={item.materialLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#3b82f6', textDecoration: 'none' }}>
                            {item.materialLink ? "📎 Ver material adjunto" : "Sin material"}
                        </a>
                    </div>
                    <div style={{ marginTop: '25px' }}>
                        <Button variant="contained" disabled={isAdmin} fullWidth startIcon={<UploadFileIcon />} style={{ backgroundColor: isAdmin ? '#cbd5e1' : '#3b82f6', textTransform: 'none', borderRadius: '8px' }}>
                            {isAdmin ? "Solo lectura" : "Subir Tarea"}
                        </Button>
                    </div>
                </div>
                ))}
            </div>

            <Typography variant="h6" style={{ fontWeight: 'bold', color: 'var(--text-main)', marginTop: '20px', marginBottom: '15px' }}>
                Historial de tareas
            </Typography>

            <div className='dashboard-cards-grid'>
                {tareasPasadas.map((item) => (
                <div key={item.id} className="dash-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                        {isAdmin && <Typography style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#3b82f6'}}>ALUMNO: {item.estudiante}</Typography>}
                        <Typography style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            {item.title}
                        </Typography>
                        <Typography style={{ fontSize: '0.85rem', color: '#68899D', fontWeight: '600' }}>
                            Entregada el: {item.deadlineDate}
                        </Typography>
                    </div>
                    <div style={{ marginTop: '25px' }}>
                        <Button variant="outlined" fullWidth startIcon={item.status === 'submitted' ? <CheckCircleIcon /> : <VisibilityIcon />} style={{ textTransform: 'none', borderRadius: '8px', color: '#68899D', borderColor: '#68899D' }}>
                            {item.status === 'submitted' ? "En revisión" : "Ver Retroalimentación"}
                        </Button>
                    </div>
                </div>
                ))}
            </div>
        </div>
    );
}