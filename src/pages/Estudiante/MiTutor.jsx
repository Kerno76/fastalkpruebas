import React from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';

import { tutorInfo, sesiones, recursos } from "../../data/dataEstudiantes"
import '../../styles/Estudiante/MiTutor.css'; 
import '../../styles/App.css';

// Iconos MUI
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MailIcon from '@mui/icons-material/Mail';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ChatIcon from '@mui/icons-material/Chat';

export default function MiTutor() {
  return (
    <div className="mainContent">

        <div className="header-container">
            <h2 className="dashboard-title">Mi Tutor de Inglés ({tutorInfo.name})</h2>
        </div>

        <hr className = "divisor"/>

        <div className="tutor-grid">
            <div className="tutor-card-main profile-card">
                <h1 className="card-subtitle-tutor">Perfil Completo</h1>
                <div className="profile-section-content">
                    <Avatar src={tutorInfo.avatar} className="tutor-page-avatar" />
                    <Typography className="tutor-page-name">{tutorInfo.name}</Typography>
                    <Typography className="tutor-page-specialty">{tutorInfo.specialty}</Typography>
                    <Typography className="tutor-page-bio">{tutorInfo.bio}</Typography>
                </div>
            </div>

            <div className="tutor-col-2">
                <div className="tutor-card-main contact-card">
                    <h1 className="card-subtitle-tutor">Medios de Contacto</h1>
                    <div className="contact-items-tutor">
                        <button className="contact-btn chat-btn-mail">
                            <MailIcon style={{ fontSize: '30px' }} /> Email - {tutorInfo.email}
                        </button>
                        <button className="contact-btn chat-btn">
                            <WhatsAppIcon style={{ fontSize: '30px' }} /> Mandar mensaje vía WhatsApp
                        </button>
                    </div>
                </div>

                <div className="tutor-card-main sessions-card">
                    <h1 className="card-subtitle-tutor">Próximas Sesiones</h1>
                    <div className="sessions-list-tutor">
                    {sesiones.map(sesion => (
                        <div key={sesion.id} className="session-item-tutor">
                            <span className={`status-badge ${sesion.color}`}>{sesion.status}</span>
                            <Typography className="session-date-tutor">{sesion.date}</Typography>
                        </div>
                    ))}
                    </div>
                </div>
            </div>

            <div className="tutor-card-main resources-card">
                <h1 className="card-subtitle-tutor">Recursos Compartidos</h1>
                <div className="resources-list-tutor">
                    {recursos.map(rec => (
                    <div key={rec.id} className="resource-item-tutor">
                        <div className="resource-info">
                            {rec.type === 'pdf' && <PictureAsPdfIcon className="file-icon pdf" />}
                            {rec.type === 'doc' && <DescriptionIcon className="file-icon doc" />}
                            {rec.type === 'link' && <OpenInNewIcon className="file-icon link" />}
                            <Typography className="resource-name">{rec.name}</Typography>
                        </div>
                        <div className="resource-actions">
                            <IconButton className="action-btn-tutor"><DownloadIcon style={{ fontSize: '30px' }}/></IconButton>
                            <IconButton className="action-btn-tutor"><OpenInNewIcon style={{ fontSize: '30px' }}/></IconButton>
                        </div>
                    </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );
}