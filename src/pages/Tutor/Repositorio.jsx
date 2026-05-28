import { useState, useEffect } from 'react';
import { Typography, Paper, Rating, Button, TextField, Box, Chip} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import toast from 'react-hot-toast';
import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 
import '../../styles/Tutor/Repositorio.css';


// ahora solo el admin puede editar el repositorio, los tutores solo ven sus materiales y no pueden eliminar ni editar, solo calificar y descargar

export default function Repositorio() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    const [materiales, setMateriales] = useState([]);
    const [filtroIdioma, setFiltroIdioma] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');
    const [busquedaAdmin, setBusquedaAdmin] = useState("");
    

    const fetchMateriales = async () => {
        if (!user?.ID) return;
        try {
            const res = await fetch(`http://localhost:8000/api/tutor/materiales/${user.ID}`);
            const data = await res.json();
            if (data.success) setMateriales(data.materiales);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchMateriales(); }, []);

    const materialesFiltrados = materiales.filter(mat => {
        const matchIdioma = filtroIdioma === '' || mat.Language?.toUpperCase() === filtroIdioma.toUpperCase();
        const matchNivel = filtroNivel === '' || mat.Level === filtroNivel;
        const matchSearch = !isAdmin || busquedaAdmin === "" || 
            (mat.Topic?.toLowerCase().includes(busquedaAdmin.toLowerCase()) || mat.tutorName?.toLowerCase().includes(busquedaAdmin.toLowerCase()));
        return matchIdioma && matchNivel && matchSearch;
    });

    const handleRating = async (id, newRating) => {
        if (!newRating || !user?.ID) return;
        try {
            const res = await fetch("http://localhost:8000/api/tutor/materiales/rating", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ MaterialID: id, TutorID: user.ID, Score: newRating })
            });
            const data = await res.json();
            if(data.success) {
                toast.success("¡Voto registrado!");
                fetchMateriales(); 
            }
        } catch (error) { toast.error("Error al calificar"); }
    };


    const handleDownload = async (url, topicName) => {
        const tid = toast.loading('Preparando descarga...');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${topicName.replace(/\s+/g, '_')}`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Descarga completada', { id: tid });
        } catch (error) {
            console.error("Error al descargar archivo como blob:", error);
            window.open(`${url}?download=`, '_blank');
            toast.success('Abriendo archivo...', { id: tid });
        }
    };

    return (
        <div className='mainContent'>
            <div className="header-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title">{isAdmin ? "Gestión Global" : "Repositorio"}</h2>
                    <p className="header-subtitle-students">Explora y califica los mejores recursos.</p>
                </div>
            </div>

            <div className="repo-filters-container">
                <select className="select-field" value={filtroIdioma} onChange={(e) => setFiltroIdioma(e.target.value)}>
                    <option value="">Todos los idiomas</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Francés">Francés</option>
                </select>
                <select className="select-field" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                    <option value="">Niveles</option>
                    {['A1','A2','B1','B2','C1','C2'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {isAdmin && (
                    <Box className="admin-search-box">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                        <TextField variant="standard" placeholder="Buscar..." value={busquedaAdmin} onChange={(e) => setBusquedaAdmin(e.target.value)} InputProps={{ disableUnderline: true }} />
                    </Box>
                )}
            </div>

            <div className='cards-grid'>
                {materialesFiltrados.map((item) => (
                    <Paper key={item.MaterialID} elevation={0} style={{ borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', transition: 'all 0.3s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DescriptionIcon style={{ color: '#0ea5e9', fontSize: '32px' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Typography style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', lineHeight: 1.2, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.Topic}>
                                    {item.Topic}
                                </Typography>
                                <Typography style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px' }}>
                                    Curso: {item.courseName || item.Courses?.Name || 'Material General'}
                                </Typography>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <Chip label={item.Language} size="small" style={{ backgroundColor: item.Language?.toUpperCase() === 'INGLÉS' ? '#e0e7ff' : '#fce7f3', color: item.Language?.toUpperCase() === 'INGLÉS' ? '#4f46e5' : '#db2777', fontWeight: 700, fontSize: '0.7rem' }} />
                                    <Chip label={`Nivel ${item.Level}`} size="small" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.7rem' }} />
                                </div>
                            </div>
                        </div>

                        <Typography variant="body2" style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '15px' }}>
                            Subido por: <strong style={{ color: '#334155' }}>{item.tutorName}</strong>
                        </Typography>

                        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <Typography style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>GLOBAL</Typography>
                                <Rating value={item.Rating || 0} readOnly size="small" precision={0.5} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0ea5e9', letterSpacing: '0.5px' }}>MI VOTO</Typography>
                                <Rating value={item.miVoto || 0} onChange={(e, nv) => handleRating(item.MaterialID, nv)} size="small" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="outlined" fullWidth onClick={() => window.open(item.FileUrl, '_blank', 'noopener,noreferrer')} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#cbd5e1' }}>
                                Ver
                            </Button>
                            <Button variant="contained" fullWidth onClick={() => handleDownload(item.FileUrl, item.Topic)} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0ea5e9', boxShadow: 'none' }}>
                                Descargar
                            </Button>
                            
                        </div>
                    </Paper>
                ))}

                {materialesFiltrados.length === 0 && (
                    <Typography className="repo-empty-state">No se encontraron materiales.</Typography>
                )}
            </div>

        
        </div>
    );
}