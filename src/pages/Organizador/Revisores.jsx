import { useState, useEffect } from 'react';
import { Typography, Avatar, Paper, Button, IconButton, Dialog, Chip, List, ListItem, ListItemAvatar, ListItemText as MuiListItemText, Divider, Select, MenuItem, OutlinedInput, Checkbox, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import toast from 'react-hot-toast'; 
import ModalRevisor from '../../components/Modals/ModalRevisor';

import '../../styles/App.css';
import '../../styles/Organizador/Revisor.css';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } },
};

export default function ControlRevisores() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';

    const [revisores, setRevisores] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    
    const [openDetalles, setOpenDetalles] = useState(false);
    const [openTutores, setOpenTutores] = useState(false);
    const [revisorSeleccionado, setRevisorSeleccionado] = useState(null);
    
    const [tutoresAsignados, setTutoresAsignados] = useState([]);
    const [tutoresDisponibles, setTutoresDisponibles] = useState([]);
    const [nuevosTutores, setNuevosTutores] = useState([]);

    const fetchRevisores = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/revisores");
            const data = await response.json();
            if (Array.isArray(data)) setRevisores(data);
        } catch (error) {
            console.error("Error al obtener revisores:", error);
        }
    };

    const fetchTutoresDisponibles = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/tutores-sin-revisor");
            const data = await response.json();
            if (data.success && Array.isArray(data.tutores)) setTutoresDisponibles(data.tutores);
        } catch (error) {
            console.error("Error al obtener tutores disponibles:", error);
        }
    };

    const fetchTutoresDelRevisor = async (reviewerId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/revisor-tutores/${reviewerId}`);
            const data = await response.json();
            if (data.success && Array.isArray(data.tutores)) setTutoresAsignados(data.tutores);
        } catch (error) {
            console.error("Error al obtener tutores del revisor:", error);
        }
    };

    useEffect(() => { 
        fetchRevisores(); 
        fetchTutoresDisponibles();
    }, []);

    const handleToggleEstado = async (id, estadoActual, tutoresAsig) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive' && parseInt(tutoresAsig) > 0) {
            toast.error("No se puede desactivar: El revisor tiene tutores asignados a su cargo.", { icon: '⚠️' });
            return;
        }

        const loadingToast = toast.loading(`Cambiando estado a ${nuevoEstado}...`);

        try {
            const response = await fetch("http://localhost:8000/api/admin/cambiar-estado", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, newState: nuevoEstado })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Revisor marcado como ${nuevoEstado}`, { id: loadingToast });
                fetchRevisores(); 
            } else {
                toast.error(data.message || "Error al cambiar estado", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Error de conexión al servidor", { id: loadingToast });
        }
    };

    const handleAbrirDetalles = (revisor) => {
        setRevisorSeleccionado(revisor);
        setOpenDetalles(true);
    };

    const handleAbrirTutores = (revisor) => {
        setRevisorSeleccionado(revisor);
        setNuevosTutores([]);
        setTutoresAsignados([]);
        fetchTutoresDelRevisor(revisor.ID);
        setOpenTutores(true);
    };

    const handleAddTutores = async () => {
        if (nuevosTutores.length === 0) return;
        const loadingToast = toast.loading('Asignando tutores...');

        try {
            const response = await fetch("http://localhost:8000/api/admin/asignar-tutores-revisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviewerId: revisorSeleccionado.ID,
                    tutorIds: nuevosTutores
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Tutores asignados con éxito', { id: loadingToast });
                setOpenTutores(false);
                fetchRevisores();
                fetchTutoresDisponibles();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Error de conexión', { id: loadingToast });
        }
    };

    return (
        <div className='mainContent'>
            <div className="header-container">
                <h2 className="dashboard-title">Gestión de Revisores</h2>
                <div className="header-actions">
                    {isAdmin && (
                        <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary"> 
                            Registrar nuevo revisor 
                        </Button>
                    )}
                    <ModalRevisor open={openModal} onClose={() => { setOpenModal(false); fetchRevisores(); }} />
                    <IconButton className="btn-secondary"> 
                        <UploadFileIcon style={{ fontSize: '40px' }} /> 
                    </IconButton>                
                </div>
            </div>

            <hr className="divisor"/>

            <div className='cards-grid'>
                {revisores.map((item) => {
                    const rawReviewer = item.Reviewer || {};
                    const revData = Array.isArray(rawReviewer) ? rawReviewer[0] : rawReviewer; 
                    
                    const carrera = revData.Career || 'N/A';
                    const tutoresAsig = revData.AsignedTutors || '0';
                    const validaciones = revData.ValidationsCompleted || '0'; 
                    const estado = item.State || 'Active'; 

                    return (
                        <Paper key={item.ID} className="revisor-card" elevation={0}>
                            <div className="card-top" style={{ alignItems: 'flex-start' }}>
                                <Avatar className="revisor-avatar">
                                    <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                </Avatar>

                                <div className="revisor-data">
                                    <div className='header-container-card'>
                                        <Typography className="revisor-name-title">{item.Name}</Typography>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>{estado}</span>
                                            {isAdmin && (
                                                <IconButton size="small" style={{ color: estado === 'Active' ? '#ef4444' : '#10b981', padding: '2px' }} onClick={() => handleToggleEstado(item.ID, estado, tutoresAsig)}>
                                                    {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                </IconButton>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="info-grid">
                                        <div className="info-row-card">
                                            <div className="info-item">
                                                <span className="label">Carrera</span>
                                                <span className="cont-career">{carrera}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Tutores Asignados</span>
                                                <span className="cont-horasA">{tutoresAsig}</span>
                                            </div>
                                        </div>
                                        <div className="info-row-card">
                                            <div className="info-item">
                                                <span className="label">Validaciones</span>
                                                <span className="cont-completedV">{validaciones}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-actions" style={{ marginTop: '5px' }}>
                                <button className="details" onClick={() => handleAbrirDetalles(item)}>Ver Detalles</button>
                                <button className="details" onClick={() => handleAbrirTutores(item)}>Ver Tutores</button>
                                <button className="assign">Ver cola de trabajo</button>
                            </div>
                        </Paper>
                    );
                })}
            </div>

            <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenDetalles(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Perfil del Revisor</Typography>
                    
                    {revisorSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Avatar sx={{ width: 64, height: 64, bgcolor: '#8a045d' }}><AccountCircleIcon sx={{ fontSize: 40 }} /></Avatar>
                                <div>
                                    <Typography variant="h5" style={{ fontWeight: 800, color: '#1e293b' }}>{revisorSeleccionado.Name}</Typography>
                                    <Typography variant="body2" style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{revisorSeleccionado.Email}</Typography>
                                    <Chip label={revisorSeleccionado.State} size="small" style={{ backgroundColor: revisorSeleccionado.State === 'Active' ? '#dcfce7' : '#fee2e2', color: revisorSeleccionado.State === 'Active' ? '#166534' : '#991b1b', fontWeight: 700 }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Teléfono</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{(Array.isArray(revisorSeleccionado.Reviewer) ? revisorSeleccionado.Reviewer[0]?.Phone : revisorSeleccionado.Reviewer?.Phone) || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Fecha de Nacimiento</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{revisorSeleccionado.BirthDate || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Carrera</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{(Array.isArray(revisorSeleccionado.Reviewer) ? revisorSeleccionado.Reviewer[0]?.Career : revisorSeleccionado.Reviewer?.Career) || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Validaciones Hechas</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{(Array.isArray(revisorSeleccionado.Reviewer) ? revisorSeleccionado.Reviewer[0]?.ValidationsCompleted : revisorSeleccionado.Reviewer?.ValidationsCompleted) || '0'}</Typography>
                                </Paper>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog open={openTutores} onClose={() => setOpenTutores(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenTutores(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Tutores Asignados</Typography>
                    
                    {revisorSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdf4ff', padding: '15px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                                <div>
                                    <Typography variant="caption" style={{ color: '#86198f', fontWeight: 800 }}>REVISOR: {revisorSeleccionado.Name}</Typography>
                                    <Typography variant="h6" style={{ color: '#701a75', fontWeight: 800 }}>{tutoresAsignados.length} Tutores a cargo</Typography>
                                </div>
                                <SupervisorAccountIcon style={{ color: '#c026d3', fontSize: '40px' }} />
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                <List dense>
                                    {tutoresAsignados.map((tut) => (
                                        <ListItem key={tut.ID}>
                                            <ListItemAvatar><Avatar sx={{ width: 32, height: 32, bgcolor: '#048A81' }}><AccountCircleIcon /></Avatar></ListItemAvatar>
                                            <MuiListItemText primary={tut.Name} primaryTypographyProps={{ style: { fontWeight: 600, fontSize: '0.9rem' } }} />
                                        </ListItem>
                                    ))}
                                    {tutoresAsignados.length === 0 && <Typography variant="body2" align="center" style={{ padding: '10px', color: '#94a3b8' }}>No hay tutores asignados aún.</Typography>}
                                </List>
                            </div>

                            <Divider />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Typography variant="body2" style={{ fontWeight: 800, color: '#1e293b' }}>Asignar nuevos tutores</Typography>
                                <Select 
                                    multiple 
                                    fullWidth 
                                    displayEmpty 
                                    value={nuevosTutores} 
                                    onChange={(e) => setNuevosTutores(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)} 
                                    input={<OutlinedInput sx={{ borderRadius: '12px' }} />} 
                                    renderValue={(selected) => selected.length === 0 ? <em>Selecciona tutores sin revisor</em> : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(v => <Chip key={v} label={tutoresDisponibles.find(t => t.ID === v)?.Name || 'Tutor'} size="small" style={{backgroundColor: '#fdf4ff', color: '#86198f', fontWeight: 600}} />)}</Box>} 
                                    MenuProps={MenuProps}
                                >
                                    {tutoresDisponibles.map((t) => <MenuItem key={t.ID} value={t.ID}><Checkbox checked={nuevosTutores.indexOf(t.ID) > -1} /><MuiListItemText primary={t.Name} /></MenuItem>)}
                                    {tutoresDisponibles.length === 0 && <MenuItem disabled>No hay tutores disponibles</MenuItem>}
                                </Select>
                            </div>

                            <div className="modal-actions">
                                <Button onClick={() => setOpenTutores(false)} className="btn-cancel">Cerrar</Button>
                                <Button onClick={handleAddTutores} variant="contained" className="btn-save" disabled={nuevosTutores.length === 0} style={{ backgroundColor: '#8a045d' }}>Asignar Seleccionados</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}