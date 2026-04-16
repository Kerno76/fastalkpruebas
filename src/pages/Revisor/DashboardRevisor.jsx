// src/pages/Revisor/DashboardRevisor.jsx

import { useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert, Select, MenuItem } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { evidenciasPendientes } from "../../data/dataRevisor.js";

import '../../styles/App.css';

export default function DashboardRevisor() {
  
    // Estados para datos, filtros y la alerta flotante
    const [evidencias, setEvidencias] = useState(evidenciasPendientes);
    const [filtro, setFiltro] = useState('Pending');
    const [openAlert, setOpenAlert] = useState(false);

    // Cambiamos el estado de la fila 
    const handleAprobar = (id) => {
        const nuevasEvidencias = evidencias.map(item => 
            item.id === id ? { ...item, status: 'Approved' } : item
        );
        setEvidencias(nuevasEvidencias);
        setOpenAlert(true); 
    };

    const evidenciasMostradas = evidencias.filter(item => item.status === filtro);

    return (
        <div className='mainContent'>
            
            {/* Encabezado con Dropdown de filtro */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Aprobaciones Pendientes</h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                        Revisa las bitácoras y evidencias enviadas por tus tutores asignados para acreditar sus horas.
                    </p>
                </div>

                <Select 
                    value={filtro} 
                    onChange={(e) => setFiltro(e.target.value)} 
                    size="small" 
                    style={{ backgroundColor: 'white', minWidth: '160px', borderRadius: '8px' }}
                >
                    <MenuItem value="Pending">Pendientes</MenuItem>
                    <MenuItem value="Approved">Aprobadas</MenuItem>
                </Select>
            </div>

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
                        {evidenciasMostradas.map((row) => (
                            <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                
                                <TableCell>
                                    <Typography style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>{row.tutor}</Typography>
                                    <Typography style={{ color: '#8792a2', fontSize: '0.85rem' }}>{row.course}</Typography>
                                </TableCell>
                                
                                <TableCell style={{ color: '#555' }}>{row.date}</TableCell>
                                <TableCell style={{ color: '#555' }}>{row.topic}</TableCell>
                                <TableCell style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                                    {row.duration} {row.duration === 1 ? 'hr' : 'hrs'}
                                </TableCell>
                                
                                <TableCell align="center">
                                    {row.status === 'Pending' ? (
                                        <Chip label="Pendiente" size="small" style={{ backgroundColor: '#e2e8f0', color: '#64748b', fontWeight: 'bold' }} />
                                    ) : (
                                        <Chip label="Aprobada" size="small" style={{ backgroundColor: '#dcfce3', color: '#16a34a', fontWeight: 'bold' }} />
                                    )}
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
                                        
                                        {/* Esconder el botón de Aprobar si ya fue aprobada */}
                                        {row.status === 'Pending' && (
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

                {evidenciasMostradas.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#8792a2' }}>
                        No hay bitácoras en esta sección.
                    </div>
                )}
            </TableContainer>

            {/* Mensaje de Éxito Flotante */}
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