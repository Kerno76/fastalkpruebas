import { useState, useEffect } from 'react';
import { Typography, Button, IconButton, Paper, Dialog, Select, MenuItem, FormControl, Box, Chip, OutlinedInput, Checkbox, ListItemText, Divider, Avatar, List, ListItem, ListItemAvatar, ListItemText as MuiListItemText, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search'; 
import toast from 'react-hot-toast';
import ModalCursos from '../../components/Modals/ModalCursos';

import '../../styles/App.css';
import '../../styles/Organizador/Cursos.css';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 },
    },
};

export default function ControlCursos() {
    const [openModalCursos, setOpenModalCursos] = useState(false);
    const [rawCursos, setRawCursos] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
    const [alumnosInscritos, setAlumnosInscritos] = useState([]);
    
    const [openDetalles, setOpenDetalles] = useState(false);
    const [openAlumnos, setOpenAlumnos] = useState(false);
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [alumnosNuevos, setAlumnosNuevos] = useState([]);

    const [filtros, setFiltros] = useState({ anio: 'Todos', idioma: 'Todos', nivel: 'Todos', estado: 'Todos' });
    const [searchTerm, setSearchTerm] = useState(''); 

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
            if (Array.isArray(dataStudents)) {
                setEstudiantesDisponibles(dataStudents);
            } else {
                setEstudiantesDisponibles([]);
            }
        } catch (error) {
            console.error("Error al obtener estudiantes:", error);
            setEstudiantesDisponibles([]);
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
    }, []);

    useEffect(() => {
        let filtrados = Array.isArray(rawCursos) ? [...rawCursos] : [];

        if (filtros.anio !== 'Todos') {
            filtrados = filtrados.filter(c => c.StartDate && new Date(c.StartDate).getFullYear().toString() === filtros.anio);
        }
        if (filtros.idioma !== 'Todos') {
            filtrados = filtrados.filter(c => c.Language && c.Language.toUpperCase() === filtros.idioma.toUpperCase());
        }
        if (filtros.nivel !== 'Todos') {
            filtrados = filtrados.filter(c => c.Level === filtros.nivel);
        }
        if (filtros.estado !== 'Todos') {
            filtrados = filtrados.filter(c => {
                if (!c.StartDate || !c.EndDate) return false;
                const today = new Date();
                const end = new Date(c.EndDate);
                const start = new Date(c.StartDate);
                let status = 'Upcoming';
                if (today > end) status = 'Past';
                else if (today >= start && today <= end) status = 'Active';
                return status === filtros.estado;
            });
        }

        if (searchTerm.trim() !== '') {
            const busqueda = searchTerm.toLowerCase();
            filtrados = filtrados.filter(c => 
                c.Name?.toLowerCase().includes(busqueda) || 
                c.tutorName?.toLowerCase().includes(busqueda)
            );
        }
        
        setTimelineData(formatData(filtrados));
    }, [filtros, rawCursos, searchTerm]); 

    const handleFilterChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    const formatData = (cursosArray) => {
        if (!Array.isArray(cursosArray)) return [];
        
        const grouped = {};
        const today = new Date();
        
        cursosArray.forEach(curso => {
            const start = curso.StartDate ? new Date(curso.StartDate) : null;
            const end = curso.EndDate ? new Date(curso.EndDate) : null;
            const year = start && !isNaN(start) ? start.getFullYear().toString() : 'Desconocido';
            
            let status = 'Upcoming';
            if (start && end) {
                if (today > end) status = 'Past'; 
                else if (today >= start && today <= end) status = 'Active';
            }

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

    const handleAbrirDetalles = (curso) => { setCursoSeleccionado(curso); setOpenDetalles(true); };
    const handleAbrirAlumnos = (curso) => { setCursoSeleccionado(curso); setAlumnosNuevos([]); fetchAlumnosInscritos(curso.id); setOpenAlumnos(true); };

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
                setOpenAlumnos(false);
                fetchCursos();
                fetchEstudiantesDisp();
            } else throw new Error(data.message);
        } catch (error) { toast.error(error.message || 'Error de conexión', { id: loadingToast }); }
    };

    const estudiantesFiltrados = cursoSeleccionado && Array.isArray(estudiantesDisponibles) 
        ? estudiantesDisponibles.filter(est => {
            const estLang = est.Language ? est.Language.toUpperCase() : '';
            const curLang = cursoSeleccionado.raw?.Language ? cursoSeleccionado.raw.Language.toUpperCase() : '';
            return estLang === curLang && est.CurrentLevel === cursoSeleccionado.level;
        }) 
        : [];

    const aniosDisponibles = [...new Set(
        Array.isArray(rawCursos) 
        ? rawCursos.map(c => c.StartDate && !isNaN(new Date(c.StartDate)) ? new Date(c.StartDate).getFullYear().toString() : 'Desconocido').filter(a => a !== 'Desconocido')
        : []
    )].sort((a, b) => b - a);

    return (
        <div className='mainContent'>
            <div className="header-container">
                <h2 className="dashboard-title">Gestión de Cursos</h2>
                <div className="header-actions">
                    <Button onClick={() => setOpenModalCursos(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary">Registrar Nuevo Curso</Button>
                    <ModalCursos open={openModalCursos} onClose={() => { setOpenModalCursos(false); fetchCursos(); fetchEstudiantesDisp(); }} />
                    <IconButton className="btn-secondary"><UploadFileIcon style={{ fontSize: '30px', color: '#68899D' }} /></IconButton>
                </div>
            </div>

            <hr className="divisor"/>

            <div className="filters-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                
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

                {['anio', 'idioma', 'nivel', 'estado'].map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="filter-label" style={{ marginRight: '8px' }}>{f.charAt(0).toUpperCase() + f.slice(1)}:</span>
                        <FormControl size="small" style={{ minWidth: 100 }}>
                            <Select name={f} value={filtros[f]} onChange={handleFilterChange} sx={{ borderRadius: '10px', backgroundColor: '#fff' }}>
                                <MenuItem value="Todos">Todos</MenuItem>
                                {f === 'anio' && aniosDisponibles.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                {f === 'idioma' && ['INGLÉS', 'FRANCÉS'].map(i => <MenuItem key={i} value={i}>{i.charAt(0) + i.slice(1).toLowerCase()}</MenuItem>)}
                                {f === 'nivel' && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                {f === 'estado' && [['Active', 'Activos'], ['Upcoming', 'Próximos'], ['Past', 'Pasados']].map(s => <MenuItem key={s[0]} value={s[0]}>{s[1]}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </div>
                ))}
            </div>

            <div className="cursos-timeline">
                {timelineData.length === 0 ? (
                    <Typography variant="body1" color="textSecondary" align="center" style={{ marginTop: '40px' }}>
                        No se encontraron cursos con los filtros o búsqueda seleccionada.
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
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Typography variant="h5" style={{ fontWeight: 800, color: '#1e293b' }}>{cursoSeleccionado.name}</Typography>
                                <Typography variant="body2" style={{ color: '#64748b', fontWeight: 600, marginBottom: '10px' }}>{cursoSeleccionado.period}</Typography>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Chip label={cursoSeleccionado.raw?.Language || 'N/A'} size="small" variant="outlined" />
                                    <Chip label={`Nivel ${cursoSeleccionado.level}`} size="small" color="primary" />
                                    <Chip label={cursoSeleccionado.status} size="small" className={getStatusClass(cursoSeleccionado.status)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tutor Titular</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{cursoSeleccionado.raw?.tutorName || 'Sin Asignar'}</Typography>
                                </Paper>
                                <Paper elevation={0} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Duración</Typography>
                                    <Typography variant="body1" style={{ fontWeight: 700, color: '#334155' }}>{cursoSeleccionado.dur}</Typography>
                                </Paper>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                                <EventIcon fontSize="small" />
                                <Typography variant="body2"><strong>{cursoSeleccionado.raw?.StartDate || 'N/A'}</strong> al <strong>{cursoSeleccionado.raw?.EndDate || 'N/A'}</strong></Typography>
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
                                        <ListItem key={al.ID}>
                                            <ListItemAvatar><Avatar sx={{ width: 32, height: 32 }}><AccountCircleIcon /></Avatar></ListItemAvatar>
                                            <MuiListItemText primary={al.Name || 'Desconocido'} primaryTypographyProps={{ style: { fontWeight: 600, fontSize: '0.9rem' } }} />
                                        </ListItem>
                                    ))}
                                    {alumnosInscritos.length === 0 && <Typography variant="body2" align="center" style={{ padding: '10px', color: '#94a3b8' }}>No hay alumnos inscritos aún.</Typography>}
                                </List>
                            </div>

                            <Divider />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Typography variant="body2" style={{ fontWeight: 800, color: '#1e293b' }}>Integrar nuevos alumnos</Typography>
                                <Select multiple fullWidth displayEmpty value={alumnosNuevos} onChange={(e) => setAlumnosNuevos(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)} input={<OutlinedInput sx={{ borderRadius: '12px' }} />} renderValue={(selected) => selected.length === 0 ? <em>Selecciona alumnos disponibles</em> : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(v => <Chip key={v} label={estudiantesFiltrados.find(s => s.ID === v)?.Name || 'Alumno'} size="small" color="primary" />)}</Box>} MenuProps={MenuProps}>
                                    {estudiantesFiltrados.map((s) => <MenuItem key={s.ID} value={s.ID}><Checkbox checked={alumnosNuevos.indexOf(s.ID) > -1} /><ListItemText primary={s.Name} /></MenuItem>)}
                                    {estudiantesFiltrados.length === 0 && <MenuItem disabled>No hay más alumnos de este nivel disponibles</MenuItem>}
                                </Select>
                            </div>

                            <div className="modal-actions">
                                <Button onClick={() => setOpenAlumnos(false)} className="btn-cancel">Cerrar</Button>
                                <Button onClick={handleAddAlumnos} variant="contained" className="btn-save" disabled={alumnosNuevos.length === 0}>Añadir Seleccionados</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}