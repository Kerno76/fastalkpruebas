import '../../styles/App.css';
import '../../styles/Organizador/Estudiantes.css';

import { studentsR} from "../../data/dataEstudiantes.js";
import { Box, Typography, Avatar, Paper } from '@mui/material';

/* Importamos iconos de ayuda */ 
import { Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function ControlEstudiantes(){
    return(
    <div className='mainContent'>
        
        <div className="header-container">
            <h2 className="dashboard-title">Gestión de estudiantes</h2>
            
            <div className="header-actions">
                <Button variant="contained" startIcon={<AddIcon />} className="btn-primary"> Registrar nuevo estudiante </Button>
                
                <IconButton className="btn-secondary"> <UploadFileIcon  style={{ fontSize: '40px' }} /> </IconButton>
            </div>
        </div>

        <hr className = "divisor"/>

        <div className ='actions'>

        </div>

        <div className='cards-grid'>
            {studentsR.map((item) => (
            <Paper key={item.id} className="student-card" elevation={0}>
                <div className="card-top">
                    <Avatar className="student-avatar">
                        <AccountCircleIcon style={{ fontSize: '60px', color: '#697386' }} />
                    </Avatar>

                    <div className="student-data">
                        <Typography className="student-name-title">{item.name}</Typography>
                        <div className="info-row">
                            <span className="label">Nivel</span>
                            <span className="cont-level">{item.level}</span>
                            <span className="label">Curso</span>
                            <span className="cont-course">{item.course}</span>
                        </div>

                        <div className="tutor-row">
                            <Typography variant="body1">
                                Tutor Asignado: <strong>{item.tutor}</strong>
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