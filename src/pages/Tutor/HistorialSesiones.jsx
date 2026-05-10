import React, { useState, useEffect } from 'react';
import '../../styles/Tutor/HistorialSesiones.css';
import '../../styles/App.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, IconButton, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function HistorialSesiones() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    const [historial, setHistorial] = useState([]);

    useEffect(() => {
        if (user?.ID) {
            const endpoint = isAdmin 
                ? `http://localhost:8000/api/admin/historial-global` 
                : `http://localhost:8000/api/tutor/historial-sesiones/${user.ID}`;
                
            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setHistorial(data.sesiones);
                })
                .catch(err => console.error("Error al cargar historial:", err));
        }
    }, [user?.ID, isAdmin]);

    const getStatusChip = (status) => {
        switch(status) {
            case 'Completed': return <Chip label="Completada" color="success" size="small" />;
            case 'Absent': return <Chip label="Inasistencia" color="error" size="small" />;
            case 'Canceled': return <Chip label="Cancelada" color="error" size="small" />;
            case 'Reviewed': return <Chip label="Revisada" color="info" size="small" />;
            case 'Scheduled': return <Chip label="Pendiente de Bitácora" color="warning" size="small" />;
            default: return <Chip label={status} size="small" />;
        }
    };

    return (
        <div className="histo" style={{ padding: '20px' }}>
            <h2 id="Title">Historial de Sesiones</h2>
            <p id="dashboard-subtitle">{isAdmin ? "Registro global de todas las sesiones." : "Tus sesiones impartidas desglosadas aquí mismo."}</p>

            <Box className='sess' sx={{ mt: 4, mb: 4 }}>
                <TableContainer component={Paper} sx={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                    <Table sx={{ minWidth: 650 }} aria-label="historial table">
                        <TableHead className='cabecera'>
                            <TableRow>
                                <TableCell className='headerText'>Fecha y Hora</TableCell>
                                <TableCell className='headerText'>Curso</TableCell>
                                <TableCell className='headerText'>Tema</TableCell>
                                <TableCell className='headerText'>Duración</TableCell>
                                <TableCell className='headerText'>Estado</TableCell>
                                <TableCell className='headerText'>Revisión</TableCell>
                                <TableCell className='headerText'>Evidencia</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {historial.length > 0 ? historial.map((row) => (
                                <TableRow key={row.SessionID} className="fila-cuerpo">
                                    <TableCell>{row.Date} - {row.StartTime}</TableCell>
                                    <TableCell>{row.courseName}</TableCell>
                                    <TableCell className="tema-destacado">{row.Topic}</TableCell>
                                    <TableCell>{row.Duration} hr</TableCell>
                                    <TableCell>{getStatusChip(row.Status)}</TableCell>
                                    <TableCell>
                                        <span style={{ 
                                            fontWeight: 600, 
                                            color: row.ReviewerStatus === 'Aprobado' ? '#16a34a' : 
                                                  row.ReviewerStatus === 'Rechazado' ? '#dc2626' : 
                                                  row.ReviewerStatus === 'Pendiente' ? '#ca8a04' : '#94a3b8' 
                                        }}>
                                            {row.ReviewerStatus || 'No iniciada'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton color="primary" onClick={() => row.EvidencePhoto ? window.open(row.EvidencePhoto, '_blank') : alert("Sin evidencia adjunta")}>
                                            <SearchIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" style={{ padding: '30px' }}>No hay registros en el historial.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </div>
    );
}