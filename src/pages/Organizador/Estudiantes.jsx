import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Button, IconButton, Dialog, Chip, Select, MenuItem, OutlinedInput, FormControl, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import ClassIcon from '@mui/icons-material/Class';
import SearchIcon from '@mui/icons-material/Search'; 
import toast from 'react-hot-toast'; 
import ModalEstudiante from '../../components/Modals/ModalEstudiante';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css';

export default function ControlEstudiantes() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';

    const [estudiantes, setEstudiantes] = useState([]);
    const [cursosDisponibles, setCursosDisponibles] = useState([]);
    const [openModal, setOpenModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');

    const [openDetalles, setOpenDetalles] = useState(false);
    const [openAsignar, setOpenAsignar] = useState(false);
    const [openVerCurso, setOpenVerCurso] = useState(false);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
    const [cursoElegido, setCursoElegido] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        Name: '',
        Phone: '',
        BirthDate: '',
        Language: '',
        CurrentLevel: '',
        Notes: ''
    });

    const fetchEstudiantes = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/estudiantes-list");
            const data = await response.json();
            if (Array.isArray(data)) setEstudiantes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCursos = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/cursos-list");
            const data = await response.json();
            if (data.success) setCursosDisponibles(data.cursos);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { 
        fetchEstudiantes(); 
        fetchCursos();
    }, []);

    const handleToggleEstado = async (id, estadoActual, tutorAsignado, estaEnrolado) => {
        const nuevoEstado = estadoActual === 'Active' ? 'Inactive' : 'Active';

        if (nuevoEstado === 'Inactive' && estaEnrolado && tutorAsignado !== 'Sin asignar') {
            toast.error("No se puede desactivar: El estudiante tiene un curso activo.", { icon: '⚠️' });
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
                toast.success(`Estudiante marcado como ${nuevoEstado}`, { id: loadingToast });
                fetchEstudiantes(); 
            } else {
                toast.error(data.message || "Error al cambiar estado", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Error de conexión al servidor", { id: loadingToast });
        }
    };

    const handleAbrirDetalles = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        const rawStudentList = estudiante.Students || {};
        const estData = Array.isArray(rawStudentList) ? (rawStudentList[0] || {}) : rawStudentList;

        setEditFormData({
            Name: estudiante.Name || '',
            Phone: estData.Phone || '',
            BirthDate: estudiante.BirthDate || '',
            Language: estData.Language || '',
            CurrentLevel: estData.CurrentLevel || '',
            Notes: estData.Notes || ''
        });
        setIsEditing(false);
        setOpenDetalles(true);
    };

    const handleGuardarDetalles = async () => {
        const loadingToast = toast.loading('Guardando cambios...');
        try {
            const response = await fetch("http://localhost:8000/api/admin/editar-estudiante", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: estudianteSeleccionado.ID,
                    ...editFormData
                })
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('Datos actualizados correctamente', { id: loadingToast });
                setIsEditing(false);
                setOpenDetalles(false);
                fetchEstudiantes();
            } else {
                toast.error(data.message || 'Error al guardar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
    };

    const handleAbrirAsignar = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setCursoElegido('');
        setOpenAsignar(true);
    };

    const handleAbrirVerCurso = (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        setOpenVerCurso(true);
    };

    const handleGuardarAsignacion = async () => {
        if (!cursoElegido) return;
        const loadingToast = toast.loading('Asignando curso al estudiante...');

        try {
            const response = await fetch("http://localhost:8000/api/admin/enroll-students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: cursoElegido,
                    studentIds: [estudianteSeleccionado.ID]
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Curso asignado con éxito', { id: loadingToast });
                setOpenAsignar(false);
                fetchEstudiantes();
                fetchCursos();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Error de conexión', { id: loadingToast });
        }
    };

    const courseColors = { 'Inglés': 'bg-ingles', 'Francés': 'bg-frances' };

    const estudianteRaw = estudianteSeleccionado?.Students;
    const estData = Array.isArray(estudianteRaw) ? (estudianteRaw[0] || {}) : (estudianteRaw || {});
    const estIdioma = estData?.Language || '';
    const estNivel = estData?.CurrentLevel || '';

    // --- FILTRO CORREGIDO: SOLO CURSOS ACTIVOS O PRÓXIMOS ---
    const cursosCompatibles = cursosDisponibles.filter(c => 
        c.Language?.toUpperCase() === estIdioma.toUpperCase() &&
        c.Status !== 'Past' 
    );

    const estudiantesFiltrados = estudiantes.filter((item) => {
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

    const totalEstudiantes = estudiantes.length;
    const activosCount = estudiantes.filter(e => (e.State || 'Active') === 'Active').length;
    const inactivosCount = totalEstudiantes - activosCount;

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ margin: '0 0 20px 0', alignItems: 'center', width: '100%', display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
                    <h2 className="dashboard-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', lineHeight: 1, margin: 0 }}>
                        Gestión de Estudiantes
                    </h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px', height: '35px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{totalEstudiantes}</Typography>
                            </div>
                            <Typography style={{ fontWeight: 800, color: '#64748b', fontSize: '0.85rem', letterSpacing: '0.5px' }}>TOTAL</Typography>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803d' }}>{activosCount}</Typography>
                            </div>
                            <Typography style={{ fontWeight: 800, color: '#166534', fontSize: '0.85rem', letterSpacing: '0.5px' }}>ACTIVOS</Typography>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography style={{ fontWeight: 800, fontSize: '0.95rem', color: '#b91c1c' }}>{inactivosCount}</Typography>
                            </div>
                            <Typography style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.85rem', letterSpacing: '0.5px' }}>INACTIVOS</Typography>
                        </div>
                    </div>
                </div>

                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isAdmin && (
                        <Button 
                            onClick={() => setOpenModal(true)} 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            style={{ backgroundColor: '#68899D', textTransform: 'none', borderRadius: '8px', fontWeight: 600, padding: '8px 16px', boxShadow: 'none', whiteSpace: 'nowrap' }}
                        > 
                            Registrar nuevo estudiante 
                        </Button>
                    )}
                    <ModalEstudiante open={openModal} onClose={() => { setOpenModal(false); fetchEstudiantes(); }} />
                </div>
            </div>

            <hr className="divisor" style={{ marginBottom: '20px', border: 'none', borderTop: '1px solid #e2e8f0' }}/>
            
            <div className='actions' style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '25px', gap: '15px' }}>
                <TextField 
                    placeholder="Buscar estudiante por nombre o correo..."
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
                {estudiantesFiltrados.length > 0 ? (
                    estudiantesFiltrados.map((item) => {
                        const rawStudentList = item.Students || {};
                        const studentDataList = Array.isArray(rawStudentList) ? (rawStudentList[0] || {}) : rawStudentList; 
                        
                        const idioma = studentDataList?.Language || 'N/A';
                        const nivel = studentDataList?.CurrentLevel || 'N/A';
                        const estado = item.State || 'Active'; 
                        
                        // --- LÓGICA CORREGIDA PARA ESTADO ENROLADO ---
                        // Verificamos si tiene un curso Y si no es un curso del pasado
                        const estadoCurso = item.cursoData?.Status;
                        const estaEnrolado = item.cursoData && estadoCurso !== 'Past'; 
                        const tutorAsignado = estaEnrolado ? (item.tutorAsignado || 'Sin asignar') : 'Sin asignar'; 

                        return (
                            <Paper 
                                key={item.ID} 
                                className="student-card" 
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
                                <div className="card-top" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    
                                    <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                                        <Avatar className="student-avatar" style={{ opacity: estado === 'Inactive' ? 0.4 : 1, filter: estado === 'Inactive' ? 'grayscale(100%)' : 'none' }}>
                                            <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                                        </Avatar>

                                        <div className="student-data" style={{ width: '100%' }}>
                                            <div className='header-container-card'>
                                                
                                                <Typography className="student-name-title" style={{ 
                                                    textDecoration: estado === 'Inactive' ? 'line-through' : 'none', 
                                                    color: estado === 'Inactive' ? '#94a3b8' : '#1e293b' 
                                                }}>
                                                    {item.Name}
                                                </Typography>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                    <span className={`status ${estado === 'Inactive' ? 'status-inactive' : ''}`}>{estado}</span>
                                                    
                                                    {isAdmin && (
                                                        <IconButton 
                                                            size="small" 
                                                            style={{ 
                                                                color: estado === 'Active' ? '#ef4444' : '#10b981', 
                                                                backgroundColor: estado === 'Active' ? 'transparent' : '#dcfce7',
                                                                padding: '4px' 
                                                            }} 
                                                            onClick={() => handleToggleEstado(item.ID, estado, tutorAsignado, estaEnrolado)}
                                                        >
                                                            {estado === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                        </IconButton>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ opacity: estado === 'Inactive' ? 0.5 : 1, filter: estado === 'Inactive' ? 'grayscale(100%)' : 'none' }}>
                                                <div className="info-grid">
                                                    <div className="info-row-card">
                                                        <div className="info-item">
                                                            <span className="label">Nivel</span>
                                                            <span className="cont-level">{nivel}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Curso</span>
                                                            <span className={`cont-course ${courseColors[idioma] || 'bg-default'}`}>{idioma}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="tutor-row" style={{ marginTop: '0' }}>
                                                    <Typography variant="body2" style={{ color: '#4f566b' }}>
                                                        Tutor Asignado: <strong>{tutorAsignado}</strong>
                                                    </Typography>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bottom-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%', paddingTop: '15px' }}>
                                    <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleAbrirDetalles(item)}>Ver Detalles</button>
                                    
                                    {/* --- MOSTRAR ASIGNAR CURSO SI NO ESTÁ ENROLADO ACTUALMENTE --- */}
                                    {estaEnrolado ? (
                                        <button className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', backgroundColor: '#f9fafb', color: '#4f566b', border: '1px solid #e0e4e8', opacity: estado === 'Inactive' ? 0.5 : 1 }} disabled={estado === 'Inactive'} onClick={() => handleAbrirVerCurso(item)}>Ver Curso</button>
                                    ) : (
                                        <button className="assign" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', opacity: estado === 'Inactive' ? 0.5 : 1 }} onClick={() => handleAbrirAsignar(item)} disabled={estado === 'Inactive'}>Asignar Curso</button>
                                    )}
                                </div>
                            </Paper>
                        );
                    })
                ) : (
                    <Typography style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px', color: '#64748b', fontStyle: 'italic' }}>
                        No se encontraron estudiantes con esos criterios.
                    </Typography>
                )}
            </div>

            <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenDetalles(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Perfil del Estudiante</Typography>
                    
                    {estudianteSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Avatar sx={{ width: 64, height: 64, bgcolor: '#048A81' }}><AccountCircleIcon sx={{ fontSize: 40 }} /></Avatar>
                                <div>
                                    <Typography variant="h5" style={{ fontWeight: 800, color: '#1e293b' }}>{estudianteSeleccionado.Name}</Typography>
                                    <Typography variant="body2" style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{estudianteSeleccionado.Email}</Typography>
                                    <Chip label={estudianteSeleccionado.State || 'Active'} size="small" style={{ backgroundColor: estudianteSeleccionado.State === 'Inactive' ? '#fee2e2' : '#dcfce7', color: estudianteSeleccionado.State === 'Inactive' ? '#991b1b' : '#166534', fontWeight: 700 }} />
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
                                    select 
                                    label="Idioma Inscrito" 
                                    name="Language" 
                                    value={editFormData.Language || ''} 
                                    onChange={(e) => {
                                        if (isEditing && estudianteSeleccionado.cursoData && estudianteSeleccionado.cursoData.Status !== 'Past') {
                                            toast.error('No se puede cambiar el idioma mientras el estudiante esté asignado a un curso activo.', { icon: '⚠️' });
                                            return;
                                        }
                                        setEditFormData({...editFormData, Language: e.target.value});
                                    }} 
                                    disabled={!isEditing} 
                                    size="small" 
                                    fullWidth
                                >
                                    <MenuItem value="Inglés">Inglés</MenuItem>
                                    <MenuItem value="Francés">Francés</MenuItem>
                                </TextField>
                                <TextField 
                                    select 
                                    label="Nivel Actual" 
                                    name="CurrentLevel" 
                                    value={editFormData.CurrentLevel || ''} 
                                    onChange={e => setEditFormData({...editFormData, CurrentLevel: e.target.value})} 
                                    disabled={!isEditing} 
                                    size="small" 
                                    fullWidth
                                >
                                    <MenuItem value="A1">A1</MenuItem>
                                    <MenuItem value="A2">A2</MenuItem>
                                    <MenuItem value="B1">B1</MenuItem>
                                    <MenuItem value="B2">B2</MenuItem>
                                    <MenuItem value="C1">C1</MenuItem>
                                    <MenuItem value="C2">C2</MenuItem>
                                </TextField>
                                <TextField 
                                    label="Fecha de Registro" 
                                    value={estData?.DateJoined || 'N/A'} 
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

                            <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Estatus de Enrolamiento</Typography>
                                <Typography variant="body1" style={{ fontWeight: 700, color: estudianteSeleccionado.cursoData && estudianteSeleccionado.cursoData.Status !== 'Past' ? '#15803d' : '#b45309', marginTop: '5px' }}>
                                    {estudianteSeleccionado.cursoData && estudianteSeleccionado.cursoData.Status !== 'Past' 
                                        ? `Asignado al curso: ${estudianteSeleccionado.cursoData.Name}` 
                                        : 'Aún no tiene curso activo asignado'}
                                </Typography>
                            </Paper>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                {isAdmin && !isEditing && (
                                    <Button variant="contained" onClick={() => setIsEditing(true)} style={{ backgroundColor: '#68899D', textTransform: 'none', fontWeight: 600 }}>
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

            <Dialog open={openAsignar} onClose={() => setOpenAsignar(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenAsignar(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Asignar Curso</Typography>
                    
                    {estudianteSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <Typography variant="body2" style={{ color: '#0369a1', fontWeight: 700 }}>Asignando a:</Typography>
                                <Typography variant="h6" style={{ color: '#0c4a6e', fontWeight: 800 }}>{estudianteSeleccionado.Name}</Typography>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <Chip label={estIdioma || 'N/A'} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 600 }} />
                                    <Chip label={`Nivel Real: ${estNivel || 'N/A'} `} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 600 }} />
                                </div>
                            </div>

                            <div className="form-group" style={{ width: '100%' }}>
                                <label>Cursos Compatibles Disponibles (Activos / Próximos)</label>
                                <FormControl fullWidth>
                                    <Select displayEmpty value={cursoElegido} onChange={(e) => setCursoElegido(e.target.value)} input={<OutlinedInput sx={{ borderRadius: '12px' }} />}>
                                        <MenuItem value="" disabled>Selecciona un curso</MenuItem>
                                        {cursosCompatibles.map((c) => (
                                            <MenuItem key={c.CourseID} value={c.CourseID}>
                                                {c.Name} {c.Period ? `(${c.Period})` : ''} - Nivel: {c.Level} - Tutor: {c.tutorName}
                                            </MenuItem>
                                        ))}
                                        {cursosCompatibles.length === 0 && (
                                            <MenuItem disabled>No hay cursos de {estIdioma} disponibles.</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className="modal-actions">
                                <Button onClick={() => setOpenAsignar(false)} className="btn-cancel">Cancelar</Button>
                                <Button onClick={handleGuardarAsignacion} variant="contained" className="btn-save" disabled={!cursoElegido}>Enrolar Estudiante</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog open={openVerCurso} onClose={() => setOpenVerCurso(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenVerCurso(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Curso Actual</Typography>
                    
                    {estudianteSeleccionado?.cursoData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                                <div>
                                    <Typography variant="body2" style={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inscrito en:</Typography>
                                    <Typography variant="h5" style={{ color: '#15803d', fontWeight: 800 }}>{estudianteSeleccionado.cursoData?.Name || 'N/A'}</Typography>
                                    <Typography variant="body2" style={{ color: '#166534', fontWeight: 600 }}>Periodo: {estudianteSeleccionado.cursoData?.Period || 'N/A'}</Typography>
                                </div>
                                <ClassIcon style={{ color: '#22c55e', fontSize: '40px' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tutor Titular</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estudianteSeleccionado.cursoData?.tutorName || 'N/A'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Estado del Curso</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{estudianteSeleccionado.cursoData?.Status || 'N/A'}</Typography>
                                </Paper>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

        </div>
    );
}