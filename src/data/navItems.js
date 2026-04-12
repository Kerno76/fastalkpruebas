/* NavBar Items */
import config from '../assets/config.png'
import dashboard from '../assets/dashboard.png'
import register_session from '../assets/session.png'
import session_history from '../assets/history.png'
import students from '../assets/people.png'
import calendar_icon from '../assets/calendar.png'
import task_icon from '../assets/session.png'

/* Profile Settings Items */
import user from '../assets/user.png'
import bell from '../assets/bell.png'

export const navItems = [
  { icon: dashboard, label: "Dashboard", path: "/" },
  { icon: dashboard, label: "Dashboard tutores", path: "/tutor" }, 
  { icon: calendar_icon, label: "Agendar Clase", path: "/agendar" }, 
  { icon: register_session, label: "Registro de Sesiones", path: "/registro" }, 
  { icon: session_history, label: "Historial de sesiones", path: "/historial" }, 
  { icon: students, label: "Estudiantes", path: "/estudiantes" }, 
  { icon: config, label: "Configuracion", path: "/settings" }
]

export const profileItems = [
  { icon: user, label: "Mi Perfil", section: "profile"},
  { icon: config, label: "Preferencias", section:"preferences"},
  { icon: bell, label: "Notificaciones", section:"notifications"},
]