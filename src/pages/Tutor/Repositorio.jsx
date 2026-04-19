import { useState } from 'react';
import { Typography, Paper, Rating, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { materialesIniciales } from "../../data/dataMateriales.js";
import ModalMaterial from '../../components/Modals/ModalMaterial.jsx';

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function Repositorio() {
    
    // Estados para filtros, datos y modal
    const [materiales, setMateriales] = useState(materialesIniciales);
    const [filtroIdioma, setFiltroIdioma] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');
    const [openModal, setOpenModal] = useState(false);

    const courseColors = { 'Ingles': 'bg-ingles', 'Frances': 'bg-frances' };

    // Filtra y ordena
    const materialesFiltrados = materiales
        .filter(mat => filtroIdioma === '' || mat.language === filtroIdioma)
        .filter(mat => filtroNivel === '' || mat.level === filtroNivel)
        .sort((a, b) => b.rating - a.rating);

    // Actualizar estrellas
    const handleRating = (id, newRating) => {
        const nuevosMateriales = materiales.map(mat => 
            mat.id === id ? { ...mat, rating: newRating } : mat
        );
        setMateriales(nuevosMateriales);
    };

    return (
        <div className='mainContent'>
            
            {/* Encabezado y botón de subir */}
            <div className="header-container" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="dashboard-title">Repositorio de Materiales</h2>
                    <p id ="dashboard-subtitle" style={{ marginTop: '5px', color: '#666'}}>
                        Explora, filtra y califica los mejores recursos de la comunidad.
                    </p>
                </div>
                
                {/* Botón que abre el modal */}
                <div className="header-actions">
                    <Button 
                        onClick={() => setOpenModal(true)} 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        className="btn-primary"
                    > 
                        Subir Material 
                    </Button>
                    
                    {/* Renderizar el Modal */}
                    <ModalMaterial open={openModal} onClose={() => setOpenModal(false)} />
                </div>
            </div>

            <hr className="divisor" />

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', background: 'var(--bg-card)', padding: '15px', borderRadius: '10px', border: '1px solid #e0e4e8' }}>
                <select className="select-field" value={filtroIdioma} onChange={(e) => setFiltroIdioma(e.target.value)} style={{ width: '200px' }}>
                    <option value="">Todos los idiomas</option>
                    <option value="Ingles">Inglés</option>
                    <option value="Frances">Francés</option>
                </select>

                <select className="select-field" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} style={{ width: '200px' }}>
                    <option value="">Todos los niveles</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                </select>
            </div>

            <div className='cards-grid'>
                {materialesFiltrados.map((item) => (
                <Paper key={item.id} className="student-card" elevation={0} style={{ backgroundColor: 'var(--bg-card)', borderColor: '#e0e4e8', justifyContent: 'space-between' }}>
                    
                    <div className="card-top" style={{ alignItems: 'flex-start' }}>
                        <div className="student-data" style={{ width: '100%' }}>
                            <Typography className="student-name-title" style={{ marginBottom: '10px', fontSize: '1.2rem' }}>{item.topic}</Typography>
                            
                            <div className="info-row" style={{ marginBottom: '15px' }}>
                                <span className={`cont-course ${courseColors[item.language] || 'bg-default'}`}>{item.language}</span>
                                <span className="cont-level">{item.level}</span>
                            </div>

                            <Typography className='whoUp' variant="body2" style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                                Subido por: <strong>{item.tutorName}</strong>
                            </Typography>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Typography className='rating' variant="body2" style={{ fontSize: '0.85rem' }}>Calificación:</Typography>
                                <Rating 
                                    value={item.rating} 
                                    onChange={(event, newValue) => handleRating(item.id, newValue)} 
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción con hover manual para el azul */}
                    <div className="bottom-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button className="details" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}>Ver PDF</button>
                        <button 
                            className="assign" 
                            style={{ flex: 1, padding: '8px', fontSize: '0.9rem', backgroundColor: '#3b82f6', transition: '0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'} // Azul más oscuro al pasar el mouse
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'} // Vuelve al color original
                        >
                            Descargar
                        </button>
                    </div>

                </Paper>
                ))}
            </div>
            
            {materialesFiltrados.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>No se encontraron materiales con esos filtros.</p>
            )}

        </div>
    );
}