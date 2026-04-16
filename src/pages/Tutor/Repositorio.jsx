import { useState } from 'react';
import { Typography, Paper, Rating } from '@mui/material';
import { materialesIniciales } from "../../data/dataMateriales.js";

import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css'; 

export default function Repositorio() {
    
    // Estados para filtros y estados
    const [materiales, setMateriales] = useState(materialesIniciales);
    const [filtroIdioma, setFiltroIdioma] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');

    const courseColors = { 'Ingles': 'bg-ingles', 'Frances': 'bg-frances' };

    // Lógica de filtrado y ordenamiento (5 estrellas arriba)
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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Repositorio de Materiales</h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>Explora, filtra y califica los mejores recursos de la comunidad.</p>
                </div>
                
                <button className="button button-primary" style={{ height: 'fit-content' }}>
                    + Subir Material
                </button>
            </div>

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

                            <Typography variant="body2" style={{ fontSize: '0.85rem', color: '#555', marginBottom: '10px' }}>
                                Subido por: <strong>{item.tutorName}</strong>
                            </Typography>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Typography variant="body2" style={{ fontSize: '0.85rem', color: '#555' }}>Calificación:</Typography>
                                <Rating 
                                    value={item.rating} 
                                    onChange={(event, newValue) => handleRating(item.id, newValue)} 
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bottom-actions" style={{ marginTop: '15px' }}>
                        <button className="details" style={{ width: '100%' }}>Descargar / Ver PDF</button>
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