import { useState, useEffect } from 'react';
import { Typography, Paper, Rating, Button, TextField, Box, Dialog, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import toast from 'react-hot-toast';
import ModalMaterial from '../../components/Modals/ModalMaterial.jsx';
import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css';
import '../../styles/Tutor/Repositorio.css';

// admin puede subir y eliminar materiales, los tutores solo ven sus materiales y no pueden eliminar ni editar, solo calificar y descargar

export default function RepositorioAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [materiales, setMateriales] = useState([]);
    const [filtroIdioma, setFiltroIdioma] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

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
        const matchSearch = busqueda === '' || 
            mat.Topic?.toLowerCase().includes(busqueda.toLowerCase()) || 
            mat.tutorName?.toLowerCase().includes(busqueda.toLowerCase());
        return matchIdioma && matchNivel && matchSearch;
    });



    const handleDelete = async () => {
        if (!itemToDelete) return;
        const loadingToast = toast.loading('Eliminando material...');
        try {
            const res = await fetch(`http://localhost:8000/api/tutor/materiales/${itemToDelete.MaterialID}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                toast.success("Material eliminado", { id: loadingToast });
                setItemToDelete(null);
                fetchMateriales();
            } else {
                toast.error("Error al eliminar", { id: loadingToast });
            }
        } catch (error) { toast.error("Error de conexión", { id: loadingToast }); }
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
            window.open(`${url}?download=`, '_blank');
            toast.success('Abriendo archivo...', { id: tid });
        }
    };

    return (
        <div className='mainContent'>
            <div className="header-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title">Repositorio</h2>
                    <p className="header-subtitle-students">Gestiona y sube recursos para los tutores.</p>
                </div>
                <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary">
                    Subir Material
                </Button>
                <ModalMaterial open={openModal} onClose={() => setOpenModal(false)} onSuccess={fetchMateriales} />
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
                <Box className="admin-search-box">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                    <TextField variant="standard" placeholder="Buscar por tema o tutor..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} InputProps={{ disableUnderline: true }} />
                </Box>
            </div>

            <div className='cards-grid'>
                {materialesFiltrados.map((item) => (
                    <Paper key={item.MaterialID} elevation={0} style={{ borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--student-card, #fff)', transition: 'all 0.3s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DescriptionIcon style={{ color: '#0ea5e9', fontSize: '32px' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Typography style={{ fontWeight: 800, color: 'var(--text-main, #1e293b)', fontSize: '1.1rem', lineHeight: 1.2, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.Topic}>
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

                        <Typography variant="body2" style={{ color: 'var(--text-main, #64748b)', fontSize: '0.85rem', marginBottom: '15px' }}>
                            Subido por: <strong style={{ color: 'var(--text-main, #334155)' }}>{item.tutorName}</strong>
                        </Typography>

                        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <Typography style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>GLOBAL</Typography>
                                <Rating value={item.Rating || 0} readOnly size="small" precision={0.5} />
                            </div>
                            {/* SE QUITO MI VOTO, el admin no califica sus materiales, solo ve la calificación global que le han dado los tutores */}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="outlined" fullWidth onClick={() => window.open(item.FileUrl, '_blank', 'noopener,noreferrer')} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: 'var(--text-main, #475569)', borderColor: '#cbd5e1' }}>
                                Ver
                            </Button>
                            <Button variant="contained" fullWidth onClick={() => handleDownload(item.FileUrl, item.Topic)} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0ea5e9', boxShadow: 'none' }}>
                                Descargar
                            </Button>
                            <IconButton onClick={() => setItemToDelete(item)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px' }}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </Paper>
                ))}
                {materialesFiltrados.length === 0 && (
                    <Typography className="repo-empty-state">No se encontraron materiales.</Typography>
                )}
            </div>

            <Dialog open={!!itemToDelete} onClose={() => setItemToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', padding: '10px' } }}>
                <Box p={2} textAlign="center">
                    <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>Confirmar Eliminación</Typography>
                    <Typography variant="body2" style={{ color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                        ¿Eliminar permanentemente <strong>"{itemToDelete?.Topic}"</strong>? Esta acción no se puede deshacer.
                    </Typography>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <Button variant="outlined" onClick={() => setItemToDelete(null)} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}>Cancelar</Button>
                        <Button variant="contained" color="error" onClick={handleDelete} style={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>Eliminar</Button>
                    </div>
                </Box>
            </Dialog>
        </div>
    );
}