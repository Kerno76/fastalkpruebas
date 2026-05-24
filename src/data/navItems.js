import config from '../assets/config.png'
import dashboard from '../assets/dashboard.png'
import register_session from '../assets/session.png'
import session_history from '../assets/history.png'
import students from '../assets/people.png'
import agenda from '../assets/agenda.png'
import tasks from '../assets/clipboard.png'
import repositorio_icon from "../assets/repositorio.png"
import tutor from '../assets/user.png'
import sesiones_icon from '../assets/sesiones.png'
import tarea_icon from '../assets/clipboard.png'
import revisar_icon from '../assets/revisar.png'
import evaluar_icon from '../assets/evaluacion.png'

/* Profile Settings Items */
import user from '../assets/user.png'
import bell from '../assets/bell.png'

export const navItems = [
  // --- SECCIÓN ADMIN ---
  { icon: dashboard, label: "Dashboard General", path: "/", roles: ['Admin'], section: "Administración" },
  { icon: students, label: "Control Estudiantes", path: "/estudiantes", roles: ['Admin'], section: "Administración" },
  { icon: students, label: "Control Tutores", path: "/tutores", roles: ['Admin'], section: "Administración" },
  { icon: students, label: "Control Revisores", path: "/revisores", roles: ['Admin'], section: "Administración" },
  { icon: students, label: "Control Cursos", path: "/cursos", roles: ['Admin'], section: "Administración" },
  { icon: evaluar_icon, label: "Cierre de Cursos", path: "/cierre-cursos", roles: ['Admin'], section: "Administración" },
  { icon: dashboard, label: "Asistente BD (IA)", path: "/asistente-sql", roles: ['Admin'], section: "Administración" }, // NUEVO ASISTENTE IA

  // --- SECCIÓN TUTOR (También para Admin) ---
  { icon: dashboard, label: "Dashboard Tutor", path: "/tutor", roles: ['Tutor'], section: "Tutoría" },
  { icon: students, label: "Mis Estudiantes", path: "/mis-estudiantes", roles: ['Tutor', 'Admin'], section: "Tutoría" },
  { icon: agenda, label: "Agendar Sesión", path: "/agendar", roles: ['Tutor'], section: "Tutoría" },
  { icon: tasks, label: "Asignar Tareas", path: "/tareas", roles: ['Tutor', 'Admin'], section: "Tutoría" },
  { icon: register_session, label: "Registro de Sesiones", path: "/registro", roles: ['Tutor', 'Admin'], section: "Tutoría" },
  { icon: session_history, label: "Historial de sesiones", path: "/historial", roles: ['Tutor', 'Admin'], section: "Tutoría" },
  { icon: evaluar_icon, label: "Calificar Tareas", path: "/calificar", roles: ['Tutor'], section: "Tutoría" },
  { icon: evaluar_icon, label: "Evaluación Final", path: "/evaluacion-cursos", roles: ['Tutor'], section: "Tutoría" },

  // --- SECCIÓN ESTUDIANTE (También para Admin) ---
  { icon: dashboard, label: "Dashboard Estudiante", path: "/estudianteDash", roles: ['Student'], section: "Estudiante" },
  { icon: tutor, label: "Mi Tutor", path: "/miTutor", roles: ['Student'], section: "Estudiante" },
  { icon: sesiones_icon, label: "Mis Sesiones", path: "/mis-sesiones", roles: ['Student', 'Admin'], section: "Estudiante" },
  { icon: tarea_icon, label: "Mis Tareas", path: "/mis-tareas", roles: ['Student', 'Admin'], section: "Estudiante" },

  // --- SECCIÓN REVISOR (También para Admin) ---
  { icon: revisar_icon, label: "Aprobaciones Pendientes", path: "/dashboard-revisor", roles: ['Reviewer', 'Admin'], section: "Revisión" },
  { icon: agenda, label: "Visitas a Clases", path: "/visitas", roles: ['Reviewer', 'Admin'], section: "Revisión" },

  // --- GENERAL ---
  { icon: repositorio_icon, label: "Repositorio", path: "/repositorio", roles: ['Tutor', 'Admin'], section: "General" },
  { icon: config, label: "Configuración", path: "/settings", roles: ['Admin', 'Tutor', 'Student', 'Reviewer'], section: "General" }
];

export const profileItems = [
  { icon: user, label: "Mi Perfil", section: "profile"},
  { icon: config, label: "Preferencias", section:"preferences"},
  { icon: bell, label: "Notificaciones", section:"notifications"},
];