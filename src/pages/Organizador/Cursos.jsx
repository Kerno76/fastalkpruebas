import { useState, useEffect } from 'react';
import { Typography, Button, IconButton, Paper, Dialog, Select, MenuItem, FormControl, Box, Chip, OutlinedInput, Checkbox, ListItemText, Divider, Avatar, List, ListItem, ListItemAvatar, ListItemText as MuiListItemText, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search'; 
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import ClassIcon from '@mui/icons-material/Class';
import toast from 'react-hot-toast';
import ModalCursos from '../../components/Modals/ModalCursos';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

import '../../styles/App.css';
import '../../styles/Organizador/Cursos.css';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 },
    },
};

const getCourseStatus = (curso) => {
    if (curso.Status === 'Past') return 'Past';
    if (curso.Status === 'Canceled') return 'Canceled';

    if (!curso.StartDate || !curso.EndDate) return 'Upcoming';
    
    const today = new Date();
    const start = new Date(curso.StartDate);
    const end = new Date(curso.EndDate);
    
    if (today > end) return 'Past';
    if (today >= start && today <= end) return 'Active';
    return 'Upcoming';
};

export default function ControlCursos() {
    const [openModalCursos, setOpenModalCursos] = useState(false);
    const [rawCursos, setRawCursos] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
    const [alumnosInscritos, setAlumnosInscritos] = useState([]);
    const [tutoresList, setTutoresList] = useState([]);
    
    const [openDetalles, setOpenDetalles] = useState(false);
    const [openAlumnos, setOpenAlumnos] = useState(false);
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [alumnosNuevos, setAlumnosNuevos] = useState([]);
    const [alumnoAEliminar, setAlumnoAEliminar] = useState(null);

    const [viewMode, setViewMode] = useState('Actuales'); 

    const [filtros, setFiltros] = useState({ año: 'Todos', idioma: 'Todos', nivel: 'Todos', estado: 'Todos' });
    const [searchTerm, setSearchTerm] = useState(''); 

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        Name: '',
        Period: '',
        Language: '',
        Level: '',
        StartDate: '',
        EndDate: '',
        TutorID: ''
    });

    const fetchCursos = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/cursos-list");
            const data = await response.json();
            if (data && data.success && Array.isArray(data.cursos)) {
                setRawCursos(data.cursos);
            } else if (Array.isArray(data)) {
                setRawCursos(data); 
            } else {
                setRawCursos([]);
            }
        } catch (error) {
            console.error("Error al obtener cursos:", error);
            setRawCursos([]);
        }
    };

    const fetchEstudiantesDisp = async () => {
        try {
            const resStudents = await fetch("http://localhost:8000/api/admin/estudiantes-disponibles");
            const dataStudents = await resStudents.json();
            if (Array.isArray(dataStudents)) setEstudiantesDisponibles(dataStudents);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTutores = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/admin/tutores");
            const data = await response.json();
            if (Array.isArray(data)) setTutoresList(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAlumnosInscritos = async (courseId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/curso-alumnos/${courseId}`);
            const data = await response.json();
            if (data && data.success && Array.isArray(data.alumnos)) {
                setAlumnosInscritos(data.alumnos);
            } else {
                setAlumnosInscritos([]);
            }
        } catch (error) {
            console.error("Error al obtener alumnos inscritos:", error);
            setAlumnosInscritos([]);
        }
    };

    useEffect(() => {
        fetchCursos();
        fetchEstudiantesDisp();
        fetchTutores();
    }, []);

    useEffect(() => {
        let filtrados = Array.isArray(rawCursos) ? [...rawCursos] : [];

        if (viewMode === 'Actuales') {
            filtrados = filtrados.filter(c => getCourseStatus(c) === 'Active' || getCourseStatus(c) === 'Upcoming');
        } else {
            filtrados = filtrados.filter(c => getCourseStatus(c) === 'Past' || getCourseStatus(c) === 'Canceled');
        }

        if (filtros.año !== 'Todos') {
            filtrados = filtrados.filter(c => c.StartDate && new Date(c.StartDate).getFullYear().toString() === filtros.año);
        }
        if (filtros.idioma !== 'Todos') {
            filtrados = filtrados.filter(c => c.Language && c.Language.toUpperCase() === filtros.idioma.toUpperCase());
        }
        if (filtros.nivel !== 'Todos') {
            filtrados = filtrados.filter(c => c.Level === filtros.nivel);
        }
        if (filtros.estado !== 'Todos') {
            filtrados = filtrados.filter(c => getCourseStatus(c) === filtros.estado);
        }

        if (searchTerm.trim() !== '') {
            const busqueda = searchTerm.toLowerCase();
            filtrados = filtrados.filter(c => 
                c.Name?.toLowerCase().includes(busqueda) || 
                c.tutorName?.toLowerCase().includes(busqueda)
            );
        }
        
        setTimelineData(formatData(filtrados));
    }, [filtros, rawCursos, searchTerm, viewMode]); 

    const handleFilterChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    const formatData = (cursosArray) => {
        if (!Array.isArray(cursosArray)) return [];
        
        const grouped = {};
        
        cursosArray.forEach(curso => {
            const start = curso.StartDate ? new Date(curso.StartDate) : null;
            const end = curso.EndDate ? new Date(curso.EndDate) : null;
            const year = start && !isNaN(start) ? start.getFullYear().toString() : 'Desconocido';
            
            const status = getCourseStatus(curso);

            let durText = "Sin definir";
            if (start && end && !isNaN(start) && !isNaN(end)) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                durText = diffDays > 30 ? `${Math.floor(diffDays / 30)} meses` : `${Math.floor(diffDays / 7)} semanas`;
            }

            const langName = curso.Language ? curso.Language.toUpperCase() : 'OTROS';
            const levelName = curso.Level || 'N/A';
            
            if (!grouped[year]) grouped[year] = {};
            if (!grouped[year][langName]) {
                grouped[year][langName] = { 
                    name: langName, 
                    iconUrl: langName === 'INGLÉS' ? 'https://flagcdn.com/us.svg' : langName === 'FRANCÉS' ? 'https://flagcdn.com/fr.svg' : '', 
                    levels: {} 
                };
            }
            if (!grouped[year][langName].levels[levelName]) grouped[year][langName].levels[levelName] = [];
            
            grouped[year][langName].levels[levelName].push({ 
                id: curso.CourseID, 
                name: curso.Name || 'Sin Nombre', 
                period: curso.Period ? `(${curso.Period})` : '', 
                status, 
                dur: durText, 
                students: curso.studentCount || 0, 
                level: levelName, 
                raw: curso 
            });
        });

        return Object.keys(grouped).sort((a, b) => {
            if (a === 'Desconocido') return 1;
            if (b === 'Desconocido') return -1;
            return b - a;
        }).map(year => ({ 
            year, 
            languages: Object.values(grouped[year]).map(lang => ({ 
                ...lang, 
                sortedLevels: Object.keys(lang.levels).sort().map(lvl => ({ levelName: lvl, cursos: lang.levels[lvl] })) 
            })) 
        }));
    };

    const getStatusClass = (status) => status === 'Active' ? 'status-active' : status === 'Upcoming' ? 'status-upcoming' : 'status-past';

    const handleAbrirDetalles = (curso) => { 
        setCursoSeleccionado(curso); 
        setEditFormData({
            Name: curso.raw?.Name || '',
            Period: curso.raw?.Period || '',
            Language: curso.raw?.Language || '',
            Level: curso.raw?.Level || '',
            StartDate: curso.raw?.StartDate || '',
            EndDate: curso.raw?.EndDate || '',
            TutorID: curso.raw?.TutorID || ''
        });
        setIsEditing(false);
        setOpenDetalles(true); 
    };

    const handleAbrirAlumnos = (curso) => { 
        setCursoSeleccionado(curso); 
        setAlumnosNuevos([]); 
        fetchAlumnosInscritos(curso.id); 
        setOpenAlumnos(true); 
    };

    const handleGuardarDetalles = async () => {
        const loadingToast = toast.loading('Guardando cambios...');
        try {
            const response = await fetch("http://localhost:8000/api/admin/editar-curso", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: cursoSeleccionado.id,
                    ...editFormData
                })
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('Curso actualizado correctamente', { id: loadingToast });
                setIsEditing(false);
                setOpenDetalles(false);
                fetchCursos();
            } else {
                toast.error(data.message || 'Error al guardar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
    };

    const handleAddAlumnos = async () => {
        if (alumnosNuevos.length === 0) return;
        const loadingToast = toast.loading('Enrolando nuevos alumnos...');
        try {
            const response = await fetch("http://localhost:8000/api/admin/enroll-students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId: cursoSeleccionado.id, studentIds: alumnosNuevos })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('¡Alumnos integrados!', { id: loadingToast });
                setAlumnosNuevos([]);
                fetchAlumnosInscritos(cursoSeleccionado.id);
                fetchCursos();
                fetchEstudiantesDisp();
            } else throw new Error(data.message);
        } catch (error) { toast.error(error.message || 'Error de conexión', { id: loadingToast }); }
    };

    const handleRemoveAlumno = async () => {
        if (!alumnoAEliminar) return;
        const loadingToast = toast.loading('Removiendo alumno...');
        try {
            const response = await fetch("http://localhost:8000/api/admin/remover-alumno-curso", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId: cursoSeleccionado.id, studentId: alumnoAEliminar.ID })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Alumno removido del curso', { id: loadingToast });
                setAlumnoAEliminar(null);
                fetchAlumnosInscritos(cursoSeleccionado.id);
                fetchCursos();
                fetchEstudiantesDisp();
            } else throw new Error(data.message);
        } catch (error) { toast.error(error.message || 'Error de conexión', { id: loadingToast }); }
    };

    const estudiantesFiltrados = cursoSeleccionado && Array.isArray(estudiantesDisponibles) 
        ? estudiantesDisponibles.filter(est => {
            const estLang = est.Language ? est.Language.toUpperCase() : '';
            const curLang = cursoSeleccionado.raw?.Language ? cursoSeleccionado.raw.Language.toUpperCase() : '';
            return estLang === curLang;
        }) 
        : [];

    const añosDisponibles = [...new Set(
        Array.isArray(rawCursos) 
        ? rawCursos.map(c => c.StartDate && !isNaN(new Date(c.StartDate)) ? new Date(c.StartDate).getFullYear().toString() : 'Desconocido').filter(a => a !== 'Desconocido')
        : []
    )].sort((a, b) => b - a);

    const isPastCourse = cursoSeleccionado?.status === 'Past' || cursoSeleccionado?.status === 'Canceled';

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h2 className="dashboard-title" style={{ margin: 0 }}>Gestión de Cursos</h2>
                </div>

                <div className="header-actions">
                    
                    <div className='toggle-group'>
                        <Button 
                            startIcon={<ClassIcon />}
                            onClick={() => setViewMode('Actuales')}
                            style={{ 
                                backgroundColor: viewMode === 'Actuales' ? '#fff' : 'transparent',
                                color: viewMode === 'Actuales' ? '#0f172a' : '#64748b',
                                textTransform: 'none', fontWeight: 600, borderRadius: '8px', 
                                boxShadow: viewMode === 'Actuales' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Actuales
                        </Button>
                        <Button 
                            startIcon={<HistoryIcon />}
                            onClick={() => setViewMode('Historial')}
                            style={{ 
                                backgroundColor: viewMode === 'Historial' ? '#fff' : 'transparent',
                                color: viewMode === 'Historial' ? '#0f172a' : '#64748b',
                                textTransform: 'none', fontWeight: 600, borderRadius: '8px', 
                                boxShadow: viewMode === 'Historial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Historial
                        </Button>
                    </div>

                    <Button onClick={() => setOpenModalCursos(true)} variant="contained" startIcon={<AddIcon />} style={{ backgroundColor: '#68899D', textTransform: 'none', borderRadius: '8px', fontWeight: 600, padding: '8px 16px' }}>
                        Nuevo Curso
                    </Button>
                    <ModalCursos open={openModalCursos} onClose={() => { setOpenModalCursos(false); fetchCursos(); fetchEstudiantesDisp(); }} />
                </div>
            </div>

            <hr className="divisor"/>

            <div className="filters-container">
                
                <TextField 
                    placeholder="Buscar por curso o tutor..."
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
                        style: { borderRadius: '10px', backgroundColor: '#fff', minWidth: '280px' }
                    }}
                />

                {['año', 'idioma', 'nivel', 'estado'].map((f) => {
                    if (viewMode === 'Historial' && f === 'estado') return null;

                    return (
                        <div key={f} style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="filter-label" style={{ marginRight: '8px' }}>{f.charAt(0).toUpperCase() + f.slice(1)}:</span>
                            <FormControl size="small" style={{ minWidth: 100 }}>
                                <Select name={f} value={filtros[f]} onChange={handleFilterChange} sx={{ borderRadius: '10px', backgroundColor: '#fff' }}>
                                    <MenuItem value="Todos">Todos</MenuItem>
                                    {f === 'año' && añosDisponibles.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                    {f === 'idioma' && ['INGLÉS', 'FRANCÉS'].map(i => <MenuItem key={i} value={i}>{i.charAt(0) + i.slice(1).toLowerCase()}</MenuItem>)}
                                    {f === 'nivel' && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                    {f === 'estado' && [['Active', 'Activos'], ['Upcoming', 'Próximos']].map(s => <MenuItem key={s[0]} value={s[0]}>{s[1]}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </div>
                    );
                })}
            </div>

            <div className="cursos-timeline">
                {timelineData.length === 0 ? (
                    <Typography variant="body1" color="textSecondary" align="center" style={{ marginTop: '40px', fontStyle: 'italic' }}>
                        No se encontraron cursos en la sección de {viewMode}.
                    </Typography>
                ) : (
                    timelineData.map((yearBlock) => (
                        <div key={yearBlock.year} className="year-section">
                            <div className="year-divider"><span>---------</span> {yearBlock.year} <span>---------</span></div>
                            <div className="language-grid">
                                {yearBlock.languages.map((lang) => (
                                    <div key={lang.name} className="language-column">
                                        <div className="language-header">
                                            <div className={`lang-icon-wrapper ${lang.name === 'INGLÉS' ? 'bg-icon-ingles' : 'bg-icon-frances'}`}>
                                                {lang.iconUrl && <img src={lang.iconUrl} className="lang-svg-icon" alt={lang.name} />}
                                            </div>
                                            <h3 className="lang-title">{lang.name}</h3>
                                        </div>
                                        {lang.sortedLevels.map((lvlBlock) => (
                                            <div key={lvlBlock.levelName} style={{ marginBottom: '35px' }}>
                                                <div className="level-header-container"><span className="level-badge-title">NIVEL {lvlBlock.levelName}</span><hr className="level-divider-line" /></div>
                                                <div className="cursos-grid">
                                                    {lvlBlock.cursos.map((curso) => (
                                                        <Paper key={curso.id} className={`curso-card ${curso.status === 'Past' ? 'card-past' : ''}`} elevation={0}>
                                                            <div className="curso-header">
                                                                <div><span className="curso-name">{curso.name}</span>{curso.period && <div className="curso-period"> {curso.period}</div>}</div>
                                                                <span className={`curso-status ${getStatusClass(curso.status)}`}>{curso.status}</span>
                                                            </div>
                                                            <div className="curso-stats-row">
                                                                <div className="stat-item"><span className="stat-value">{curso.dur}</span><span className="stat-label">Duración</span></div>
                                                                <div className="stat-item"><span className="stat-value">{curso.students}</span><span className="stat-label">Alumnos</span></div>
                                                                <div className="curso-badges"><span className="badge badge-level" style={{ padding: '4px 10px' }}>{curso.level}</span></div>
                                                            </div>
                                                            <div className="curso-actions">
                                                                <button onClick={() => handleAbrirDetalles(curso)} className="btn-curso-outline">Detalles</button>
                                                                <button onClick={() => handleAbrirAlumnos(curso)} className="btn-curso-solid">Alumnos</button>
                                                            </div>
                                                        </Paper>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenDetalles(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Detalles del Curso</Typography>
                    {cursoSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {isPastCourse && (
                                <div style={{ backgroundColor: '#fff7ed', padding: '10px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                                    <Typography variant="body2" style={{ color: '#9a3412', fontWeight: 600, textAlign: 'center' }}>
                                        Este curso ha finalizado y se encuentra en modo Solo Lectura.
                                    </Typography>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                <TextField 
                                    label="Nombre del Curso" 
                                    name="Name" 
                                    value={editFormData.Name} 
                                    onChange={e => setEditFormData({...editFormData, Name: e.target.value})} 
                                    disabled={!isEditing || isPastCourse} 
                                    size="small" 
                                    fullWidth 
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <TextField 
                                    label="Periodo (Ej. Ene - Jun)" 
                                    name="Period" 
                                    value={editFormData.Period} 
                                    onChange={e => setEditFormData({...editFormData, Period: e.target.value})} 
                                    disabled={!isEditing || isPastCourse} 
                                    size="small" 
                                    fullWidth 
                                />
                                <TextField 
                                    select 
                                    label="Nivel" 
                                    name="Level" 
                                    value={editFormData.Level} 
                                    onChange={e => setEditFormData({...editFormData, Level: e.target.value})} 
                                    disabled={!isEditing || isPastCourse} 
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
                                    select 
                                    label="Idioma" 
                                    name="Language" 
                                    value={editFormData.Language} 
                                    onChange={(e) => {
                                        if (isEditing && cursoSeleccionado.students > 0) {
                                            toast.error('No se puede cambiar el idioma porque hay alumnos inscritos.', { icon: '⚠️' });
                                            return;
                                        }
                                        setEditFormData({...editFormData, Language: e.target.value});
                                    }} 
                                    disabled={!isEditing || isPastCourse} 
                                    size="small" 
                                    fullWidth
                                >
                                    <MenuItem value="Inglés">Inglés</MenuItem>
                                    <MenuItem value="Francés">Francés</MenuItem>
                                </TextField>
                                <TextField 
                                    select 
                                    label="Tutor Asignado" 
                                    name="TutorID" 
                                    value={editFormData.TutorID || ''} 
                                    onChange={e => setEditFormData({...editFormData, TutorID: e.target.value})} 
                                    disabled={!isEditing || isPastCourse} 
                                    size="small" 
                                    fullWidth
                                >
                                    <MenuItem value=""><em>Sin Asignar</em></MenuItem>
                                    {tutoresList.filter(t => t.Tutors && t.Tutors.Language === editFormData.Language).map(tutor => (
                                        <MenuItem key={tutor.ID} value={tutor.ID}>{tutor.Name}</MenuItem>
                                    ))}
                                </TextField>
                                
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker 
                                        label="Fecha y Hora de Inicio"
                                        value={editFormData.StartDate ? dayjs(editFormData.StartDate) : null}
                                        onChange={(newValue) => setEditFormData(prev => ({ ...prev, StartDate: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' }))}
                                        disabled={!isEditing || isPastCourse}
                                        slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                                    />
                                </LocalizationProvider>
                                
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker 
                                        label="Fecha y Hora de Fin"
                                        value={editFormData.EndDate ? dayjs(editFormData.EndDate) : null}
                                        onChange={(newValue) => setEditFormData(prev => ({ ...prev, EndDate: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' }))}
                                        disabled={!isEditing || isPastCourse}
                                        slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                                    />
                                </LocalizationProvider>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                {!isEditing ? (
                                    <Button 
                                        variant="contained" 
                                        onClick={() => setIsEditing(true)} 
                                        disabled={isPastCourse}
                                        style={{ backgroundColor: isPastCourse ? '#cbd5e1' : '#68899D', textTransform: 'none', fontWeight: 600 }}
                                    >
                                        {isPastCourse ? 'Histórico' : 'Editar Curso'}
                                    </Button>
                                ) : (
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

            <Dialog open={openAlumnos} onClose={() => setOpenAlumnos(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
                <IconButton onClick={() => setOpenAlumnos(false)} className="close-button"><CloseIcon /></IconButton>
                <div className="modal-content">
                    <Typography className="modal-title">Gestión de Estudiantes</Typography>
                    {cursoSeleccionado && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {isPastCourse && (
                                <div style={{ backgroundColor: '#fff7ed', padding: '10px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                                    <Typography variant="body2" style={{ color: '#9a3412', fontWeight: 600, textAlign: 'center' }}>
                                        Este curso ha finalizado. La lista de alumnos es histórica y de solo lectura.
                                    </Typography>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <div>
                                    <Typography variant="caption" style={{ color: '#0369a1', fontWeight: 800 }}>{cursoSeleccionado.name}</Typography>
                                    <Typography variant="h6" style={{ color: '#0c4a6e', fontWeight: 800 }}>{alumnosInscritos.length} Alumnos Inscritos</Typography>
                                </div>
                                <GroupsIcon style={{ color: '#0ea5e9', fontSize: '40px' }} />
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                <List dense>
                                    {alumnosInscritos.map((al) => (
                                        <ListItem 
                                            key={al.ID}
                                            secondaryAction={
                                                !isPastCourse ? (
                                                    <IconButton edge="end" aria-label="delete" onClick={() => setAlumnoAEliminar(al)}>
                                                        <DeleteIcon style={{ color: '#ef4444' }} />
                                                    </IconButton>
                                                ) : null
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Avatar 
                                                    src={al.AvatarUrl || undefined} 
                                                    sx={{ width: 32, height: 32 }}
                                                >
                                                    {!al.AvatarUrl && <AccountCircleIcon />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <MuiListItemText primary={al.Name || 'Desconocido'} primaryTypographyProps={{ style: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--student-label)' } }} />
                                        </ListItem>
                                    ))}
                                    {alumnosInscritos.length === 0 && <Typography variant="body2" align="center" style={{ padding: '10px', color: '#94a3b8' }}>No hay alumnos inscritos.</Typography>}
                                </List>
                            </div>

                            {!isPastCourse && (
                                <>
                                    <Divider />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <Typography variant="body2" style={{ fontWeight: 800, color: 'var(--text-main, #1e293b)'}}>Integrar nuevos alumnos</Typography>
                                        <Select multiple fullWidth displayEmpty value={alumnosNuevos} onChange={(e) => setAlumnosNuevos(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)} input={<OutlinedInput sx={{ borderRadius: '12px' }} />} renderValue={(selected) => selected.length === 0 ? <em>Selecciona alumnos disponibles</em> : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(v => <Chip key={v} label={estudiantesFiltrados.find(s => s.ID === v)?.Name || 'Alumno'} size="small" color="primary" />)}</Box>} MenuProps={MenuProps}>
                                            {estudiantesFiltrados.map((s) => <MenuItem key={s.ID} value={s.ID}><Checkbox checked={alumnosNuevos.indexOf(s.ID) > -1} /><ListItemText primary={`${s.Name} (Nivel Real: ${s.CurrentLevel})`} /></MenuItem>)}
                                            {estudiantesFiltrados.length === 0 && <MenuItem disabled>No hay alumnos de este idioma disponibles</MenuItem>}
                                        </Select>
                                    </div>
                                </>
                            )}

                            <div className="modal-actions">
                                <Button onClick={() => setOpenAlumnos(false)} className="btn-cancel">Cerrar</Button>
                                {!isPastCourse && (
                                    <Button onClick={handleAddAlumnos} variant="contained" className="btn-save" disabled={alumnosNuevos.length === 0}>Añadir Seleccionados</Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog open={!!alumnoAEliminar} onClose={() => setAlumnoAEliminar(null)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
                <Box p={2} textAlign="center">
                    <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                        Confirmar Eliminación
                    </Typography>
                    <Typography variant="body2" style={{ color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                        ¿Estás seguro de que deseas remover a <strong>{alumnoAEliminar?.Name}</strong> del curso <strong>{cursoSeleccionado?.name}</strong>?
                    </Typography>
                    
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setAlumnoAEliminar(null)} 
                            style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={handleRemoveAlumno} 
                            style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                        >
                            Sí, remover
                        </Button>
                    </div>
                </Box>
            </Dialog>

        </div>
    );
}