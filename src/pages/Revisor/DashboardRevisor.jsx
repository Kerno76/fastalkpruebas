// src/pages/Revisor/DashboardRevisor.jsx
import { useState, useEffect } from 'react';
import { 
    Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, Chip, Snackbar, Alert, Select, 
    MenuItem, TextField, Box 
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { evidenciasPendientes } from "../../data/dataRevisor.js";

import '../../styles/App.css';

export default function DashboardRevisor() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    
    const [evidencias, setEvidencias] = useState(evidenciasPendientes);
    const [filtroStatus, setFiltroStatus] = useState('Pending');
    const [busquedaAdmin, setBusquedaAdmin] = useState("");
    const [openAlert, setOpenAlert] = useState(false);

    // Filtrado dinámico: Admin ve todo o busca, Revisor solo lo asignado
    const evidenciasFiltradas = evidencias.filter((item) => {
        const coincideStatus = item.status === filtroStatus;
        
        if (isAdmin) {
            // El Admin ve todo lo que coincida con el status y la búsqueda de tutor
            return coincideStatus && (busquedaAdmin === "" || item.tutor.toLowerCase().includes(busquedaAdmin.toLowerCase()));
        }
        // El Revisor solo ve lo que coincida con el status y su propio nombre
        return coincideStatus && item.revisorAsignado === user?.Name;
    });

    const handleAprobar = (id) => {
        const nuevasEvidencias = evidencias.map(item => 
            item.id === id ? { ...item, status: 'Approved' } : item
        );
        setEvidencias(nuevasEvidencias);
        setOpenAlert(true); 
    };

    return (
        <div className='mainContent'>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {isAdmin ? "Control Global de Aprobaciones" : "Aprobaciones Pendientes"}
                    </h2>
                    <p className='--subtitle-main' style={{ margin: 0, fontSize: '0.95rem' }}>
                        {isAdmin ? "Panel de supervisión para acreditar las horas de todos los tutores." : "Revisa las bitácoras y evidencias enviadas por tus tutores asignados."}
                    </p>
                </div>

                <Select 
                    value={filtroStatus} 
                    onChange={(e) => setFiltroStatus(e.target.value)} 
                    size="small" 
                    style={{ backgroundColor: 'white', minWidth: '160px', borderRadius: '8px' }}
                >
                    <MenuItem value="Pending">Pendientes</MenuItem>
                    <MenuItem value="Approved">Aprobadas</MenuItem>
                </Select>
            </div>

            {/* Buscador exclusivo para el Admin */}
            {isAdmin && (
                <Box sx={{ mb: 4, p: 2, bgcolor: '#f0f4f8', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SearchIcon style={{ color: '#64748b' }} />
                    <TextField 
                        fullWidth 
                        variant="outlined" 
                        size="small" 
                        placeholder="Buscar por nombre del tutor..."
                        value={busquedaAdmin}
                        onChange={(e) => setBusquedaAdmin(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                    />
                </Box>
            )}

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            <TableContainer component={Paper} elevation={0} style={{ borderRadius: '12px', border: '1px solid #e0e4e8', backgroundColor: 'var(--bg-card)' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead style={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Tutor & Curso</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Fecha</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Tema</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b' }}>Horas</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b', textAlign: 'center' }}>Estatus</TableCell>
                            <TableCell style={{ fontWeight: 'bold', color: '#4f566b', textAlign: 'center' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {evidenciasFiltradas.map((row) => (
                            <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>
                                    <Typography className='tut-info' style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{row.tutor}</Typography>
                                    <Typography className='course-aprob' style={{ fontSize: '0.85rem' }}>{row.course}</Typography>
                                </TableCell>
                                
                                <TableCell className='topic-date'>{row.date}</TableCell>
                                <TableCell className='topic-date'>{row.topic}</TableCell>
                                <TableCell style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                                    {row.duration} {row.duration === 1 ? 'hr' : 'hrs'}
                                </TableCell>
                                
                                <TableCell align="center">
                                    <Chip 
                                        label={row.status === 'Pending' ? "Pendiente" : "Aprobada"} 
                                        size="small" 
                                        style={{ 
                                            backgroundColor: row.status === 'Pending' ? '#e2e8f0' : '#dcfce3', 
                                            color: row.status === 'Pending' ? '#64748b' : '#16a34a', 
                                            fontWeight: 'bold' 
                                        }} 
                                    />
                                </TableCell>
                                
                                <TableCell align="center">
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<VisibilityIcon />} 
                                            href={row.evidenceLink} 
                                            target="_blank"
                                            style={{ textTransform: 'none', borderRadius: '6px', color: '#68899D', borderColor: '#68899D' }}
                                        >
                                            Ver Evidencia
                                        </Button>
                                        
                                        {/* El Admin solo puede ver, el Revisor puede aprobar */}
                                        {row.status === 'Pending' && !isAdmin && (
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                startIcon={<CheckIcon />} 
                                                onClick={() => handleAprobar(row.id)}
                                                style={{ textTransform: 'none', borderRadius: '6px', backgroundColor: '#2ecc71', boxShadow: 'none' }}
                                            >
                                                Aprobar
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {evidenciasFiltradas.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#8792a2' }}>
                        No hay bitácoras en esta sección.
                    </div>
                )}
            </TableContainer>

            <Snackbar 
                open={openAlert} 
                autoHideDuration={3000} 
                onClose={() => setOpenAlert(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenAlert(false)} severity="success" sx={{ width: '100%', borderRadius: '8px' }}>
                    ¡Horas aprobadas y sumadas al tutor con éxito!
                </Alert>
            </Snackbar>
        </div>
    );
}