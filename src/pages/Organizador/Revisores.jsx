import '../../styles/App.css';
import '../../styles/Organizador/Revisor.css';

import { revisorsR } from "../../data/dataRevisor.js";
import { Typography, Avatar, Paper } from '@mui/material';

import { useState } from 'react';
import ModalRevisor from '../../components/Modals/ModalRevisor';

/* Importamos iconos de ayuda */ 
import { Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function ControlRevisores(){

    /* Modal */
    const [openModal, setOpenModal] = useState(false);

    /* Colores para diferenciación de cursos */

    const courseColors = {
        'Ingles': 'bg-ingles',
        'Frances': 'bg-frances'
    };

    return(
    <div className='mainContent'>
        
        <div className="header-container">
            <h2 className="dashboard-title">Gestión de Revisores</h2>
            
            <div className="header-actions">
                <Button onClick={() => setOpenModal(true)} variant="contained" startIcon={<AddIcon />} className="btn-primary"> Registrar nuevo revisor </Button>

                <ModalRevisor open={openModal} onClose={() => setOpenModal(false)} />

                <IconButton className="btn-secondary"> <UploadFileIcon  style={{ fontSize: '40px' }} /> </IconButton>                
            </div>
        </div>

        <hr className = "divisor"/>

        <div className ='actions'>

        </div>

        <div className='cards-grid'>
            {revisorsR.map((item) => (
            <Paper key={item.id} className="revisor-card" elevation={0}>
                <div className="card-top">
                    <Avatar className="revisor-avatar">
                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                    </Avatar>

                    <div className="revisor-data">
                        <div className='header-container-card'>
                            <Typography className="revisor-name-title">{item.name}</Typography>
                            <span className="status">Active</span>
                        </div>
                        
                        <div className="info-revisor-row">
                            <span className="label">Carrera</span>
                            <span className="cont-career">{item.career}</span>
                            <span className="label">Tutores Asignados</span>
                            <span className="cont-horasA">{item.studentsA}</span>
                        </div>

                        <div className="validation-revisor-row">
                            <span className="labelG">Validaciones Completadas</span>
                            <span className="cont-completedV">{item.completedV}</span>
                        </div>

                        <div className="revisor-row">
                            <Typography variant="body1">
                                <strong>{item.studentsA} Tutores Asignados </strong> 
                            </Typography>
                        </div>
                    </div>
                </div>

                <div className="bottom-actions">
                    <button className="details">Ver Detalles</button>
                    <button className="assign">Ver cola de trabajo</button>
                </div>

            </Paper>

          ))}
        </div>
    </div>

    )
}