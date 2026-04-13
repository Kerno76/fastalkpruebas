import '../../styles/App.css';
import '../../styles/Organizador/Tutores.css';

import { tutorsR } from "../../data/dataTutor.js";
import { Box, Typography, Avatar, Paper, LinearProgress  } from '@mui/material';

/* Importamos iconos de ayuda */ 
import { Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function ControlEstudiantes(){

    const tutoresActivos = 14;
    const totalTutores = 20;

    const progreso = (tutoresActivos / totalTutores) * 100;

    /* Colores para diferenciación de cursos */

    const courseColors = {
        'Ingles': 'bg-ingles',
        'Frances': 'bg-frances'
    };

    return(
    <div className='mainContent'>
        
        <div className="header-container">
            <h2 className="dashboard-title">Gestión de Tutores</h2>
            
            <div className="header-actions">
                <Button variant="contained" startIcon={<AddIcon />} className="btn-primary"> Registrar nuevo tutor </Button>
                
                <IconButton className="btn-secondary"> <UploadFileIcon  style={{ fontSize: '40px' }} /> </IconButton>

                <div className='progress-stat'>
                    <div className='progress-label'>
                        <span>Tutores Activos</span>
                        <span className='progress-count'> {tutoresActivos} / {totalTutores}</span>
                    </div>

                    <div className='progress-container'>
                        <LinearProgress variant="determinate" value={progreso} className='progress-bar'/>
                    </div>

                </div>
                
            </div>
        </div>

        <hr className = "divisor"/>

        <div className ='actions'>

        </div>

        <div className='cards-grid'>
            {tutorsR.map((item) => (
            <Paper key={item.id} className="tutor-card" elevation={0}>
                <div className="card-top">
                    <Avatar className="tutor-avatar">
                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                    </Avatar>

                    <div className="tutor-data">
                        <div className='header-container-card'>
                            <Typography className="tutor-name-title">{item.name}</Typography>
                            <span className="status">Active</span>
                        </div>
                        
                        <div className="info-tutor-row">
                            <span className="label">Curso</span>
                            <span className={`cont-course ${courseColors[item.course] || 'bg-default'}`}>{item.course}</span>
                            <span className="label">Carrera</span>
                            <span className="cont-career">{item.career}</span>
                            <span className="label">Horas Acreditadas</span>
                            <span className="cont-horasV">{item.horasV}</span>
                        </div>

                        <div className="tutor-row">
                            <Typography variant="body1">
                                <strong>{item.studentsN}</strong> Estudiantes asignados 
                            </Typography>
                        </div>
                    </div>
                </div>

                <div className="bottom-actions">
                    <button className="details">Ver Detalles</button>
                    <button className="assign">Asignar Tutor</button>
                </div>

            </Paper>

          ))}
        </div>
    </div>

    )
}