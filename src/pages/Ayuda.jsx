import { Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

import '../styles/App.css';
import '../styles/Help.css'; 

export default function Help() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.Rol;

    // Video según el rol
    const tutorialesPorRol = {
        'Admin': {
            titulo: 'Tutorial de Administración FasTalk',
            descripcion: 'Aprende a gestionar estudiantes, tutores, asignar cursos y monitorear el rendimiento general de la plataforma.',
            videoSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        'Reviewer': {
            titulo: 'Guía de Evaluación para Revisores',
            descripcion: 'Descubre cómo revisar bitácoras, calificar el desempeño de los tutores y realizar visitas sorpresa a las aulas.',
            videoSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        'Tutor': {
            titulo: 'Guía de Inicio para Tutores',
            descripcion: 'Conoce paso a paso cómo agendar tus clases, llenar reportes de asistencia y utilizar tus herramientas.',
            videoSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        'Student': {
            titulo: 'Bienvenido a tu Aula en FasTalk',
            descripcion: 'Todo lo que necesitas saber para unirte a tus clases, comunicarte con tu tutor y subir tus tareas.',
            videoSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
    };

    const tutorialActual = tutorialesPorRol[userRole] || tutorialesPorRol['Student'];

    // Preguntas frecuentes generales (todos los roles lo pueden ver)
    const faqsGenerales = [
        { 
            q: '¿Qué hacer si el sistema de la plataforma presenta errores?', 
            a: 'Por favor, contacta inmediatamente al soporte técnico de TALK enviando un correo a: ejemplo@tec.mx, adjuntando una captura de pantalla del error.' 
        },
        { 
            q: '¿Cómo puedo actualizar mis datos personales o contraseña?', 
            a: 'Puedes modificar tu información básica directamente desde la sección de Configuración de tu perfil en la esquina superior derecha. Sin embargo, para un cambio de contraseña debera ser desde el login por cuestiones de seguridad' 
        }
    ];

    // Preguntas especificas para cada rol
    const faqsPorRol = {
        'Admin': [
            { q: '¿Cómo asigno un Revisor a un Tutor específico?', a: 'Ve al módulo de "Control Tutores", selecciona el tutor deseado y haz clic en "Asignar Revisor".' },
            { q: '¿Cómo creo un nuevo grupo/curso?', a: 'En "Gestión de Cursos", haz clic en "Nuevo Curso" y define las fechas, nivel y tutor.' }
        ],
        'Reviewer': [
            { q: '¿Qué criterios debo evaluar en una bitácora?', a: 'Verifica el resumen de la clase, la planeación de la próxima sesión y el registro de asistencia con sus incidentes.' },
            { q: '¿Cómo ingreso a una clase en vivo?', a: 'En tu panel de "Visitas a Clases", haz clic en el botón "Entrar a la Sala" en las sesiones del día de hoy.' }
        ],
        'Tutor': [
            { q: '¿Cuál es el límite para llenar la bitácora tras una clase?', a: 'Se recomienda llenarla inmediatamente después o durante la misma. Si tienes un problema mayor, notifica a tu Revisor.' },
            { q: '¿Cómo registro un retardo o mala conducta?', a: 'En la lista de asistencia de la bitácora, selecciona "Retardo" y añade los detalles en el campo de "Reporte / Incidente".' }
        ],
        'Student': [
            { q: '¿Dónde puedo consultar mi última calificación?', a: 'En tu panel principal (Dashboard) encontrarás tarjetas con tu nivel actual y tu última calificación.' },
            { q: '¿Cómo me uno a mi clase en el horario agendado?', a: 'Revisa tu "Agenda Escolar". Selecciona el día de la clase y encontrarás el enlace directo para unirte con tu tutor.' }
        ]
    };

    const faqsActuales = [...faqsGenerales, ...(faqsPorRol[userRole] || [])];

    return (
        <div className="mainContent">
            
            <div className="header-container" style={{ marginBottom: '25px' }}>
                <div>
                    <h2 className="dashboard-title">Centro de Ayuda</h2>
                    <p className="subtitle-main">
                        Tutoriales y resolución de dudas sobre la plataforma.
                    </p>
                </div>
            </div>

            <Paper elevation={0} className="main-video-container">
                <div className='header-video-container'>
                    <VideoLibraryIcon className='iconoAyuda' />
                    <Typography variant="h5" className="dashboard-title">
                        {tutorialActual.titulo}
                    </Typography>
                </div>
                
                <Typography variant="body1" className='descriptionVideo'>
                    {tutorialActual.descripcion}
                </Typography>

                <div className="video-responsive-wrapper">
                    <iframe 
                        className="video-iframe"
                        src={tutorialActual.videoSrc} 
                        title="Tutorial FasTalk" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            </Paper>

            {/* SECCIÓN INFERIOR: PREGUNTAS FRECUENTES */}
            <Paper elevation={0} className="faq-container">
                <Typography variant="h6" className='title-faq'>
                    <SupportAgentIcon style={{ color: '#68899D' }} /> Preguntas Frecuentes
                </Typography>

                {faqsActuales.map((faq, index) => (
                    <Accordion 
                        key={index} 
                        disableGutters 
                        elevation={0} 
                        sx={{
                            backgroundColor: 'var(--bg-section)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            borderRadius: '12px !important',
                            mb: 2,
                            '&:before': { display: 'none' } 
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon style={{ color: 'var(--student-label)' }} />}>
                            <Typography className='questionP'>{faq.q}</Typography>
                        </AccordionSummary>
                        <AccordionDetails style={{ borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                            <Typography className='answerQP'>
                                {faq.a}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Paper>
        </div>
    );
}