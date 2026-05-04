import { useState } from 'react';
import { Typography, Button, IconButton, Paper, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ModalCursos from '../../components/Modals/ModalCursos';

import '../../styles/App.css';
import '../../styles/Organizador/Cursos.css';

// Datos simulados
const mockData = [
    {
        year: '2026',
        languages: [
            {
                name: 'INGLÉS', iconUrl: 'https://flagcdn.com/us.svg',
                cursos: [
                    { id: 1, name: 'B1 Grupo 1', period: '', status: 'Active', dur: '4 meses', students: 25, level: 'B1' },
                    { id: 2, name: 'B1 Grupo 2', period: '', status: 'Active', dur: '2 meses', students: 3, level: 'B1' },
                ]
            },
            {
                name: 'FRANCÉS', iconUrl: 'https://flagcdn.com/fr.svg',
                cursos: [
                    { id: 3, name: 'A2 Grupo A', period: '(Feb - Jun)', status: 'Active', dur: '4 meses', students: 18, level: 'A2' },
                    { id: 4, name: 'A2 Grupo B', period: '(Aug - Dec)', status: 'Upcoming', dur: '7 semanas', students: 0, level: 'A2' },
                    { id: 5, name: 'B1 Grupo 1', period: '(Feb - Jun)', status: 'Active', dur: '3 semanas', students: 15, level: 'B1' },
                ]
            }
        ]
    },
    {
        year: '2025',
        languages: [
            {
                name: 'INGLÉS', iconUrl: 'https://flagcdn.com/us.svg',
                cursos: [
                    { id: 6, name: 'B1 Grupo 1', period: '(cursoe 2) (Aug - Dec)', status: 'Past', dur: '1 semana', students: 20, level: 'B1' },
                    { id: 7, name: 'B1 Grupo 1', period: '(cursoe 1) (Feb - Jun)', status: 'Past', dur: '4.5 meses', students: 18, level: 'B1' },
                ]
            },
            {
                name: 'FRANCÉS', iconUrl: 'https://flagcdn.com/fr.svg',
                cursos: [
                    { id: 8, name: 'A2 Grupo A', period: '(cursoe 2) (Aug - Dec)', status: 'Past', dur: '2 meses', students: 15, level: 'A2' },
                ]
            }
        ]
    }
];

export default function ControlCursos() {

    const getStatusClass = (status) => {
        if (status === 'Active') return 'status-active';
        if (status === 'Upcoming') return 'status-upcoming';
        return 'status-past';
    };

    const [openModal, setOpenModal] = useState(false);

    return (
        <div className='mainContent'>
            <div className="header-container">
                <h2 className="dashboard-title">Gestión de Cursos</h2>
                
                <div className="header-actions">
                    <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary"> 
                        Registrar Nuevo Curso 
                    </Button>

                    <ModalCursos open={openModal} onClose={() => { setOpenModal(false);}} />

                    <IconButton className="btn-secondary"> 
                        <UploadFileIcon style={{ fontSize: '30px', color: '#68899D' }} /> 
                    </IconButton>
                </div>
            </div>

            <hr className="divisor"/>

            <div className="cursos-timeline">
                {mockData.map((yearBlock) => (
                    <div key={yearBlock.year} className="year-section">
                        {/* Año división */}
                        <div className="year-divider">
                            <span>---------</span> {yearBlock.year} <span>---------</span>
                        </div>

                        <div className="languages-grid">
                            {yearBlock.languages.map((lang) => (
                                <div key={lang.name} className="language-column">
                                    <div className="language-header">
                                        <div className={`lang-icon-wrapper ${lang.name === 'INGLÉS' ? 'bg-icon-ingles' : 'bg-icon-frances'}`}>
                                            <img src={lang.iconUrl} className="lang-svg-icon" />
                                        </div>
                                        <h3 className="lang-title">{lang.name}</h3>
                                    </div>

                                    <div className="cursos-grid">
                                        {lang.cursos.map((curso) => (
                                            <Paper key={curso.id} className={`curso-card ${curso.status === 'Past' ? 'card-past' : ''}`} elevation={0}>
                                                
                                                <div className="curso-header">
                                                    <div>
                                                        <span className="curso-name">{curso.name}</span>
                                                        {curso.period && <span className="curso-period"> {curso.period}</span>}
                                                    </div>
                                                    <span className={`curso-status ${getStatusClass(curso.status)}`}>
                                                        {curso.status}
                                                    </span>
                                                </div>

                                                <div className="curso-stats-row">
                                                    <div className="stat-item">
                                                        <span className="stat-value">{curso.dur}</span>
                                                        <span className="stat-label">Duration</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-value">{curso.students}</span>
                                                        <span className="stat-label">Estudiantes</span>
                                                    </div>
                                                    <div className="curso-badges">
                                                        <span className="badge badge-level">{curso.level}</span>
                                                    </div>
                                                </div>

                                                <div className="curso-actions">
                                                    <button className="btn-curso">Ver detalles</button>
                                                    <button className="btn-curso">Bitácoras</button>
                                                </div>

                                            </Paper>
                                        ))}

                                        {/* Tarjeta Fantasma (Atajo para agregar más) */}
                                        {yearBlock.year === '2026' && (
                                            <div className="ghost-card">
                                                <MoreHorizIcon style={{ color: '#a0aec0' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}