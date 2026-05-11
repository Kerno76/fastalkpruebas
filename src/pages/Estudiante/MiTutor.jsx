import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, IconButton, CircularProgress } from '@mui/material';

import { recursos } from "../../data/dataEstudiantes"
import toast from 'react-hot-toast';

import '../../styles/Estudiante/MiTutor.css'; 
import '../../styles/App.css';

import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MailIcon from '@mui/icons-material/Mail';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function MiTutor() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [tutorInfo, setTutorInfo] = useState(null);
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMiTutor = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/student/mi-tutor/${user?.ID}`);
                const data = await res.json();
                if (data.success) {
                    setTutorInfo(data.tutor);
                    setSesiones(data.sesiones);
                } else {
                    toast.error("Error al cargar perfil del tutor: " + data.message);
                }
            } catch (error) {
                console.error(error);
                toast.error("Error de conexión al servidor.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.ID) fetchMiTutor();
    }, [user?.ID]);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><CircularProgress /></div>;
    }

    if (!tutorInfo) {
        return (
            <div className="mainContent">
                <Typography variant="h6" style={{ textAlign: 'center', marginTop: '50px', color: '#64748b' }}>
                    Aún no tienes un tutor asignado o no estás inscrito en ningún curso.
                </Typography>
            </div>
        );
    }

    return (
        <div className="mainContent">

            <div className="header-container">
                <h2 className="dashboard-title">Mi Tutor ({tutorInfo.name})</h2>
            </div>

            <hr className="divisor" style={{ marginBottom: '25px', borderTop: '1px solid #e0e4e8' }} />

            <div className="tutor-grid">
                
                <div className="tutor-card-main profile-card">
                    <h1 className="card-subtitle-tutor">Perfil Completo</h1>
                    <div className="profile-section-content">
                        <Avatar src={tutorInfo.avatar} className="tutor-page-avatar" style={{ width: 120, height: 120, margin: '0 auto 15px', backgroundColor: '#e2e8f0' }} />
                        <Typography className="tutor-page-name" style={{ fontWeight: 'bold', fontSize: '1.4rem', color: '#1e293b' }}>{tutorInfo.name}</Typography>
                        <Typography className="tutor-page-specialty" style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '15px' }}>{tutorInfo.specialty}</Typography>
                        <Typography className="tutor-page-bio" style={{ color: '#475569', lineHeight: 1.6, textAlign: 'center' }}>{tutorInfo.bio}</Typography>
                    </div>
                </div>

                <div className="tutor-col-2">
                    <div className="tutor-card-main contact-card">
                        <h1 className="card-subtitle-tutor">Medios de Contacto</h1>
                        <div className="contact-items-tutor" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <a href={`mailto:${tutorInfo.email}`} style={{ textDecoration: 'none' }}>
                                <button className="contact-btn chat-btn-mail" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', justifyContent: 'flex-start' }}>
                                    <MailIcon style={{ fontSize: '24px' }} /> 
                                    <span style={{ fontSize: '0.95rem' }}>{tutorInfo.email}</span>
                                </button>
                            </a>

                            {tutorInfo.phone ? (
                                <a href={`https://wa.me/52${tutorInfo.phone}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                    <button className="contact-btn chat-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', justifyContent: 'flex-start' }}>
                                        <WhatsAppIcon style={{ fontSize: '24px' }} /> 
                                        <span style={{ fontSize: '0.95rem' }}>WhatsApp: {tutorInfo.phone}</span>
                                    </button>
                                </a>
                            ) : (
                                <button className="contact-btn chat-btn" disabled style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', justifyContent: 'flex-start', backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }}>
                                    <WhatsAppIcon style={{ fontSize: '24px' }} /> 
                                    <span style={{ fontSize: '0.95rem' }}>WhatsApp no disponible</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="tutor-card-main sessions-card">
                        <h1 className="card-subtitle-tutor">Próximas Sesiones con {tutorInfo.name.split(' ')[0]}</h1>
                        <div className="sessions-list-tutor" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {sesiones.length > 0 ? sesiones.map(sesion => (
                                <div key={sesion.id} className="session-item-tutor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ backgroundColor: '#dcfce3', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        {sesion.status}
                                    </span>
                                    <Typography style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                                        {sesion.date}
                                    </Typography>
                                </div>
                            )) : (
                                <Typography style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
                                    No hay sesiones programadas.
                                </Typography>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tutor-card-main resources-card">
                    <h1 className="card-subtitle-tutor">Recursos Compartidos</h1>
                    <div className="resources-list-tutor" style={{ marginTop: '15px' }}>
                        {recursos.map(rec => (
                        <div key={rec.id} className="resource-item-tutor" style={{ padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                            <div className="resource-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {rec.type === 'pdf' && <PictureAsPdfIcon style={{ color: '#ef4444' }} />}
                                {rec.type === 'doc' && <DescriptionIcon style={{ color: '#3b82f6' }} />}
                                {rec.type === 'link' && <OpenInNewIcon style={{ color: '#8b5cf6' }} />}
                                <Typography style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>{rec.name}</Typography>
                            </div>
                            <div className="resource-actions">
                                <IconButton size="small" style={{ color: '#64748b' }}><DownloadIcon /></IconButton>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}