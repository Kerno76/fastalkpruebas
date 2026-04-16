/* NavBar Items */
import config from '../assets/config.png'
import dashboard from '../assets/dashboard.png'
import register_session from '../assets/session.png'
import session_history from '../assets/history.png'
import students from '../assets/people.png'
import calendar_icon from '../assets/calendar.png'
import task_icon from '../assets/session.png'
import agenda from '../assets/agenda.png'
import tasks from '../assets/clipboard.png'
import repositorio_icon from "../assets/repositorio.png"

/* Profile Settings Items */
import user from '../assets/user.png'
import bell from '../assets/bell.png'

export const navItems = [
  { icon: dashboard, label: "Dashboard", path: "/" },
  { icon: dashboard, label: "Dashboard tutores", path: "/tutor" }, 
  { icon: agenda, label: "Agendar Sesión", path: "/agendar" },
  { icon: tasks, label: "Asignar Tareas", path: "/tareas" },
  { icon: register_session, label: "Registro de Sesiones", path: "/registro" }, 
  { icon: session_history, label: "Historial de sesiones", path: "/historial" }, 
  { icon: repositorio_icon, label: "Repositorio de Materiales", path: "/repositorio"},
  { icon: students, label: "Mis Estudiantes", path: "/mis-estudiantes"},
  { icon: students, label: "Estudiantes", path: "/estudiantes" },
  { icon: students, label: "Tutores", path: "/tutores" },
  { icon: students, label: "Revisores", path: "/revisores" },    
  { icon: config, label: "Configuracion", path: "/settings" },

]

export const profileItems = [
  { icon: user, label: "Mi Perfil", section: "profile"},
  { icon: config, label: "Preferencias", section:"preferences"},
  { icon: bell, label: "Notificaciones", section:"notifications"},
]