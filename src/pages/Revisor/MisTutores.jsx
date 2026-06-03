import React, { useEffect, useState } from 'react';
import { Typography, Avatar, CircularProgress, LinearProgress, Button, Box } from '@mui/material';

import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import EmailIcon from '@mui/icons-material/Email';

import toast from 'react-hot-toast';

import '../../styles/App.css';
import '../../styles/Revisor/MisTutores.css'

export default function MisTutores() {

    const user = JSON.parse(localStorage.getItem('user'));

    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchTutores = async () => {

            try {

                const response = await fetch(
                    `http://localhost:8000/api/revisor/mis-tutores/${user.ID}`
                );

                const data = await response.json();

                if (data.success) {
                    setTutores(data.tutores);
                } else {
                    toast.error(data.message);
                }

            } catch (error) {
                console.error(error);
                toast.error('Error al cargar los tutores');
            } finally {
                setLoading(false);
            }
        };

        if (user?.ID) {
            fetchTutores();
        }

    }, [user?.ID]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px'}}> <CircularProgress /> </div>
        );
    }

    if (tutores.length === 0) {
        return (
            <div className="mainContent">
                <Typography variant="h6" sx={{ textAlign: 'center', mt: 8, color: '#64748b'}}>
                    Aún no tienes tutores asignados para revisión.
                </Typography>
            </div>
        );
    }

    return (
        <div className="mainContent">
            
            <div className="header-container" style={{ marginBottom: '30px' }}>
                <div>
                    <h2 className="dashboard-title">
                    Mis Tutores
                </h2>
                <p className="subtitleMainMS">Aquí encontraras los usuarios a los que estas supervisando y su información más relevante.</p>
                </div>
            </div>

            <hr className="divisor"/>

            <div className='tutores-grid'>

                {tutores.map((tutor) => {

                    const porcentaje = Math.min((tutor.TotalHours / tutor.RequiredHours) * 100,100);

                    return (

                        <div key={tutor.ID} className='tutor-card-review'>

                            <div className='tutor-card-header'>

                                <Avatar sx={{ width: 60, height: 60, fontWeight: 700}}>
                                    {tutor.Name?.charAt(0)}
                                </Avatar>

                                <div>
                                    <Typography className='tutor-name'>
                                        {tutor.Name}
                                    </Typography>

                                    <Typography className='tutor-career'>
                                        {tutor.Career}
                                    </Typography>

                                    <Typography className='tutor-language'>
                                        {tutor.Language}
                                    </Typography>
                                </div>
                            </div>

                            <div className='progress-section'>
                                <Typography style={{ fontWeight: '700', color: 'var(--text-main)'}} component="div">
                                    {tutor.TotalHours} / {tutor.RequiredHours} horas
                                </Typography>

                                <LinearProgress
                                    variant="determinate"
                                    value={porcentaje}
                                    sx={{
                                        height: 8,
                                        borderRadius: 10,
                                        width: '100%'
                                    }}
                                />

                            </div>

                            <div className='logs-status'>

                                <Typography className={`logs-text ${tutor.PendingLogs > 0 ? 'logs-pending' : 'logs-ok'}`}>
                                    {tutor.PendingLogs > 0
                                        ? `🔴 ${tutor.PendingLogs} bitácoras pendientes`
                                        : '✅ Sin pendientes'}
                                </Typography>

                            </div>

                            <div className='tutor-actions'>

                                {tutor.Phone && (
                                    <Button 
                                        variant="contained"
                                        startIcon={<WhatsAppIcon />}
                                        onClick={() =>
                                            window.open(
                                                `https://wa.me/52${tutor.Phone}`,
                                                '_blank'
                                            )
                                        }
                                        className='btn-whatsapp'>
                                        WhatsApp
                                    </Button>
                                )}

                                {tutor.Email && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<EmailIcon />}
                                        href={`mailto:${tutor.Email}`}
                                        className='btn-mail'
                                    >
                                        Correo
                                    </Button>
                                )}


                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}