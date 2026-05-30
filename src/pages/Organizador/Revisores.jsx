import { useState, useEffect } from 'react';
import { Typography, Avatar, Paper, Button, IconButton, Dialog, Chip, List, ListItem, ListItemAvatar, ListItemText as MuiListItemText, Divider, Select, MenuItem, OutlinedInput, Checkbox, Box, TextField, InputAdornment, FormControl, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SearchIcon from '@mui/icons-material/Search'; 
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');

    const [openDetalles, setOpenDetalles] = useState(false);
    const [openTutores, setOpenTutores] = useState(false);
    const [revisorSeleccionado, setRevisorSeleccionado] = useState(null);
    
    const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
    const [revisorParaToggle, setRevisorParaToggle] = useState(null);

    const [tutoresAsignados, setTutoresAsignados] = useState([]);
    const [tutoresDisponibles, setTutoresDisponibles] = useState([]);
    const [nuevosTutores, setNuevosTutores] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        Name: '',
        Phone: '',
        BirthDate: '',
        Career: '',
        Notes: ''
    });

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

    const handleAbrirConfirmacionToggle = (item, estadoActual, tutoresAsig) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive' && parseInt(tutoresAsig) > 0) {
            toast.error("No se puede desactivar: El revisor tiene tutores asignados a su cargo.", { icon: '⚠️' });
            return;
        }

        setRevisorParaToggle({
            id: item.ID,
            nombre: item.Name,
            nuevoEstado: nuevoEstado
        });
        setOpenConfirmToggle(true);
    };

    const handleEjecutarToggle = async () => {
        if (!revisorParaToggle) return;

        setOpenConfirmToggle(false);
        const { id, nuevoEstado } = revisorParaToggle;
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
        const rawRevisorData = Array.isArray(revisor.Reviewer) ? revisor.Reviewer[0] : (revisor.Reviewer || {});
        
        setEditFormData({
            Name: revisor.Name || '',
            Phone: rawRevisorData.Phone || '',
            BirthDate: revisor.BirthDate || '',
            Career: rawRevisorData.Career || '',
            Notes: rawRevisorData.Notes || ''
        });
        setIsEditing(false);
        setOpenDetalles(true);
    };

    const handleGuardarDetalles = async () => {
        const loadingToast = toast.loading('Guardando cambios...');
        try {
            const response = await fetch("http://localhost:8000/api/admin/editar-reviewer", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: revisorSeleccionado.ID,
                    ...editFormData
                })
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('Datos actualizados correctamente', { id: loadingToast });
                setIsEditing(false);
                setOpenDetalles(false);
                fetchRevisores();
            } else {
                toast.error(data.message || 'Error al guardar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
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

    const revisoresFiltrados = revisores.filter((item) => {
        const busqueda = searchTerm.toLowerCase();
        const matchesSearch = item.Name?.toLowerCase().includes(busqueda) || item.Email?.toLowerCase().includes(busqueda);
        
        const estadoActual = item.State || 'Active';
        const matchesEstado = filtroEstado === 'Todos' || estadoActual === filtroEstado;

        return matchesSearch && matchesEstado;
    }).sort((a, b) => {
        const estadoA = a.State || 'Active';
        const estadoB = b.State || 'Active';
        
        if (estadoA === 'Active' && estadoB === 'Inactive') return -1;
        if (estadoA === 'Inactive' && estadoB === 'Active') return 1;
        
        return (a.Name || '').localeCompare(b.Name || '');
    });

    const totalRevisores = revisores.length;
    const activosCount = revisores.filter(r => (r.State || 'Active') === 'Active').length;
    const inactivosCount = totalRevisores - activosCount;

    return (
        <div className='mainContent'>
            <div className="header-container">
                
                <h2 className="dashboard-title">
                    Gestión de Revisores
                </h2>

                <div className="header-controls">
                    
                    <div className="stats-divider">
                        <div className="stat-group">
                            <div className="stat-circle stat-total">
                                <Typography className="stat-number stat-text-total"> {totalRevisores}</Typography>
                            </div>
                            <Typography className="stat-label stat-label-total"> TOTAL</Typography>
                        </div>
                        
                        <div className="stat-group">
                            <div className="stat-circle stat-active">
                                <Typography className="stat-number stat-text-active">{activosCount}</Typography>
                            </div>
                            <Typography className="stat-label stat-label-active">ACTIVOS</Typography>
                        </div>

                        <div className="stat-group">
                            <div className="stat-circle stat-inactive">
                                <Typography className="stat-number stat-text-inactive">{inactivosCount}</Typography>
                            </div>
                            <Typography className="stat-label stat-label-inactive">INACTIVOS</Typography>
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    {isAdmin && (
                        <Button 
                            onClick={() => setOpenModal(true)} 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            className="btn-header-primary"
                        > 
                            Registrar nuevo revisor 
                        </Button>
                    )}
                    <ModalRevisor open={openModal} onClose={() => { setOpenModal(false); fetchRevisores(); }} />
                </div>
            </div>

            <hr className="divisor"/>

            <div className='actions'>
                <TextField 
                    placeholder="Buscar revisor por nombre o correo..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon style={{ color: '#64748b' }} />
                            </InputAdornment>
                        ),
                        style: { borderRadius: '12px', backgroundColor: '#fff', width: '350px' }
                    }}
                />

                <FormControl size="small" style={{ minWidth: 180 }}>
                    <Select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        displayEmpty
                        style={{ borderRadius: '12px', backgroundColor: '#fff' }}
                    >
                        <MenuItem value="Todos">Todos los estados</MenuItem>
                        <MenuItem value="Active">Activos</MenuItem>
                        <MenuItem value="Inactive">Inactivos</MenuItem>
                    </Select>
                </FormControl>
            </div>

            <div className='cards-grid'>
                {revisoresFiltrados.length > 0 ? (
                    revisoresFiltrados.map((item) => {
                        const rawReviewer = item.Reviewer || {};
                        const revData = Array.isArray(rawReviewer) ? rawReviewer[0] : rawReviewer; 
                        
                        const carrera = revData.Career || 'N/A';
                        const tutoresAsig = revData.AsignedTutors || '0';
                        const validaciones = revData.ValidationsCompleted || '0'; 
                        const estado = item.State || 'Active'; 

                        return (
                            <Paper 
                                key={item.ID} 
                                className="revisor-card" 
                                elevation={0}
                                style={{ 
                                    backgroundColor: estado === 'Inactive' ? '#f8fafc' : '#ffffff',
                                    border: estado === 'Inactive' ? '1px solid #e2e8f0' : '1px solid #e0e4e8',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%'
                                }}
                            >
                                <div className="card-top" style={{ alignItems: 'flex-start', flexGrow: 1 }}>
                                    <Avatar className="revisor-avatar" style={{ opacity: estado === 'Inactive' ? 0.4 : 1, filter: estado === 'Inactive' ? 'grayscale(100%)' : 'none' }}>
                                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                    </Avatar>

                                    <div className="revisor-data" style={{ width: '100%' }}>
                                        <div className='header-container-card'>
                                            <Typography className="revisor-name-title" style={{ 
                                                textDecoration: estado === 'Inactive' ? 'line-through' : 'none', 
                                                color: estado === 'Inactive' ? '#94a3b8' : '#1e293b' 
                                            }}>
                                                {item.Name}
                                            </Typography>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>{estado}</span>
                                                {isAdmin && (
                                                    <Tooltip title={estado === 'Active' ? 'Deshabilitar revisor' : 'Habilitar revisor'} arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            style={{ 
                                                                color: estado === 'Active' ? '#ef4444' : '#10b981', 
                                                                backgroundColor: estado === 'Active' ? 'transparent' : '#dcfce7',
                                                                padding: '4px' 
                                                            }} 
                                                            onClick={() => handleAbrirConfirmacionToggle(item, estado, tutoresAsig)}
                                                        >
                                                            {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div style={{ opacity: estado === 'Inactive' ? 0.5 : 1, filter: estado === 'Inactive' ? 'grayscale(100%)' : 'none' }}>
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
                                                        <span className="label">Bitácoras Calificadas</span>
                                                        <span className="cont-completedV">{validaciones}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bottom-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%', paddingTop: '15px' }}>
                                    <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleAbrirDetalles(item)}>Ver Detalles</button>
                                    <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', opacity: estado === 'Inactive' ? 0.5 : 1 }} disabled={estado === 'Inactive'} onClick={() => handleAbrirTutores(item)}>Ver Tutores</button>
                                </div>
                            </Paper>
                        );
                    })
                ) : (
                    <Typography style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px', color: '#64748b', fontStyle: 'italic' }}>
                        No se encontraron revisores con esos criterios.
                    </Typography>
                )}
            </div>

            <Dialog open={openConfirmToggle} onClose={() => setOpenConfirmToggle(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '24px', padding: '8px' } }}>
                <IconButton onClick={() => setOpenConfirmToggle(false)} style={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }}>
                    <CloseIcon />
                </IconButton>
                
                <div style={{ padding: '30px 20px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    
                    <div style={{ 
                        width: '85px', height: '85px', borderRadius: '50%', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        backgroundColor: revisorParaToggle?.nuevoEstado === 'Inactive' ? '#fee2e2' : '#dcfce7' 
                    }}>
                        {revisorParaToggle?.nuevoEstado === 'Inactive' ? (
                            <BlockIcon style={{ fontSize: 45, color: '#ef4444' }} />
                        ) : (
                            <CheckCircleIcon style={{ fontSize: 45, color: '#10b981' }} />
                        )}
                    </div>

                    <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                        ¿{revisorParaToggle?.nuevoEstado === 'Inactive' ? 'Desactivar' : 'Activar'} revisor?
                    </Typography>
                    
                    <Typography variant="body2" style={{ color: '#64748b', marginBottom: '35px', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        Estás a punto de cambiar el estado del revisor <strong style={{ color: '#0f172a' }}>{revisorParaToggle?.nombre}</strong>.
                        <br/>
                        {revisorParaToggle?.nuevoEstado === 'Inactive' 
                            ? "Al hacer esto, se le restringirá el acceso a la plataforma." 
                            : "El revisor recuperará el acceso normal a su cuenta."}
                    </Typography>
                    
                    <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setOpenConfirmToggle(false)} 
                            style={{ 
                                textTransform: 'none', fontWeight: 700, flex: 1, borderColor: '#e2e8f0', color: '#64748b', borderRadius: '12px', padding: '10px' 
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleEjecutarToggle} 
                            style={{ 
                                textTransform: 'none', 
                                fontWeight: 700, 
                                flex: 1, 
                                backgroundColor: revisorParaToggle?.nuevoEstado === 'Inactive' ? '#ef4444' : '#10b981',
                                boxShadow: 'none',
                                borderRadius: '12px',
                                padding: '10px'
                            }}
                        >
                            Sí, {revisorParaToggle?.nuevoEstado === 'Inactive' ? 'desactivar' : 'activar'}
                        </Button>
                    </div>
                </div>
            </Dialog>

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
                                <TextField 
                                    label="Nombre Completo" 
                                    name="Name" 
                                    value={editFormData.Name} 
                                    onChange={e => setEditFormData({...editFormData, Name: e.target.value})} 
                                    disabled={!isEditing} 
                                    size="small" 
                                    fullWidth 
                                />
                                <TextField 
                                    label="Teléfono" 
                                    name="Phone" 
                                    value={editFormData.Phone} 
                                    onChange={e => setEditFormData({...editFormData, Phone: e.target.value})} 
                                    disabled={!isEditing} 
                                    size="small" 
                                    fullWidth 
                                />
                                <TextField 
                                    label="Fecha de Nacimiento" 
                                    type="date" 
                                    name="BirthDate" 
                                    value={editFormData.BirthDate} 
                                    onChange={e => setEditFormData({...editFormData, BirthDate: e.target.value})} 
                                    disabled={!isEditing} 
                                    size="small" 
                                    fullWidth 
                                    InputLabelProps={{ shrink: true }} 
                                />
                                <TextField 
                                    label="Carrera" 
                                    name="Career" 
                                    value={editFormData.Career} 
                                    onChange={e => setEditFormData({...editFormData, Career: e.target.value})} 
                                    disabled={!isEditing} 
                                    size="small" 
                                    fullWidth 
                                />
                                <TextField 
                                    label="Bitácoras Calificadas" 
                                    value={(Array.isArray(revisorSeleccionado.Reviewer) ? revisorSeleccionado.Reviewer[0]?.ValidationsCompleted : revisorSeleccionado.Reviewer?.ValidationsCompleted) || '0'} 
                                    disabled 
                                    size="small" 
                                    fullWidth 
                                />
                                <TextField 
                                    label="Fecha de Registro" 
                                    value={(Array.isArray(revisorSeleccionado.Reviewer) ? revisorSeleccionado.Reviewer[0]?.DateJoined : revisorSeleccionado.Reviewer?.DateJoined) || 'N/A'} 
                                    disabled 
                                    size="small" 
                                    fullWidth 
                                />
                            </div>

                            <TextField 
                                label="Notas" 
                                name="Notes" 
                                value={editFormData.Notes} 
                                onChange={e => setEditFormData({...editFormData, Notes: e.target.value})} 
                                disabled={!isEditing} 
                                size="small" 
                                fullWidth 
                                multiline 
                                rows={3} 
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                {isAdmin && !isEditing && (
                                    <Button variant="contained" onClick={() => setIsEditing(true)} style={{ backgroundColor: '#8a045d', textTransform: 'none', fontWeight: 600 }}>
                                        Editar Datos
                                    </Button>
                                )}
                                {isAdmin && isEditing && (
                                    <>
                                        <Button variant="outlined" onClick={() => setIsEditing(false)} style={{ textTransform: 'none', fontWeight: 600 }}>
                                            Cancelar
                                        </Button>
                                        <Button variant="contained" color="success" onClick={handleGuardarDetalles} style={{ textTransform: 'none', fontWeight: 600 }}>
                                            Guardar Cambios
                                        </Button>
                                    </>
                                )}
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