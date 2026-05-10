import { useState, useEffect } from 'react';
import { Typography, Paper, Rating, Button, TextField, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import toast from 'react-hot-toast';
import ModalMaterial from '../../components/Modals/ModalMaterial.jsx';
import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 
import '../../styles/Tutor/Repositorio.css';

export default function Repositorio() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.Rol === 'Admin';
    const [materiales, setMateriales] = useState([]);
    const [filtroIdioma, setFiltroIdioma] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');
    const [busquedaAdmin, setBusquedaAdmin] = useState("");
    const [openModal, setOpenModal] = useState(false);

    const courseColors = { 'INGLÉS': 'bg-ingles', 'FRANCÉS': 'bg-frances' };

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

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar material?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/tutor/materiales/${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                toast.success("Eliminado");
                fetchMateriales();
            }
        } catch (error) { toast.error("Error al eliminar"); }
    };

    return (
        <div className='mainContent'>
            <div className="header-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title">{isAdmin ? "Gestión Global" : "Repositorio"}</h2>
                    <p className="header-subtitle-students">Explora y califica los mejores recursos.</p>
                </div>
                <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary">Subir Material</Button>
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
                {isAdmin && (
                    <Box className="admin-search-box">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                        <TextField variant="standard" placeholder="Buscar..." value={busquedaAdmin} onChange={(e) => setBusquedaAdmin(e.target.value)} InputProps={{ disableUnderline: true }} />
                    </Box>
                )}
            </div>

            <div className='cards-grid'>
                {materialesFiltrados.map((item) => (
                    <Paper key={item.MaterialID} className="student-card repo-card" elevation={0}>
                        <div className="student-data" style={{ width: '100%' }}>
                            <Typography className="repo-topic-title">{item.Topic}</Typography>
                            <div className="info-row" style={{ marginBottom: '10px' }}>
                                <span className={`cont-course ${item.Language ? courseColors[item.Language.toUpperCase()] : 'bg-default'}`}>{item.Language}</span>
                                <span className="cont-level">{item.Level}</span>
                            </div>
                            <Typography className='whoUp repo-tutor-name' variant="body2">Subido por: <strong>{item.tutorName}</strong></Typography>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#64748b' }}>GENERAL</Typography>
                                    <Rating value={item.Rating || 0} readOnly size="small" precision={0.5} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" style={{ fontWeight: 700, color: '#3b82f6' }}>TU VOTO</Typography>
                                    <Rating value={item.miVoto || 0} onChange={(e, nv) => handleRating(item.MaterialID, nv)} size="small" />
                                </div>
                            </div>
                        </div>
                        <div className="repo-bottom-actions" style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                            <button className="details" onClick={() => window.open(item.FileUrl, '_blank')}>Ver</button>
                            <button className="assign btn-descargar" onClick={() => {
                                const l = document.createElement('a'); l.href = item.FileUrl; l.download = `${item.Topic}.pdf`; l.click();
                            }}>Descargar</button>
                            {isAdmin && <button className="btn-delete-repo" onClick={() => handleDelete(item.MaterialID)}><DeleteOutlineIcon fontSize="small" /></button>}
                        </div>
                    </Paper>
                ))}
            </div>
        </div>
    );
}