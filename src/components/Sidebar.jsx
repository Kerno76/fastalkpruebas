import { navItems } from "../data/navItems"
import { Link, useLocation } from "react-router-dom"
import logo from "../assets/FasTalk.jpeg" 

export default function Sidebar() {
  const location = useLocation();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRol = user?.Rol || ""; 

  // 1. Filtramos qué pestañas tiene derecho a ver este usuario
  const allowedItems = navItems.filter(item => item.roles.includes(userRol));

  // 2. Definimos en qué orden queremos que salgan las secciones
  const sectionsList = ["Administración", "Tutoría", "Estudiante", "Revisión", "General"];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="FasTalk Logo" className="sidebar-logo" />
        <h2>FasTalk</h2>
      </div>
      
      <div className="nav-list">
        {sectionsList.map((sectionTitle, idx) => {
          // Buscamos solo los ítems permitidos que pertenezcan a esta sección exacta
          const sectionItems = allowedItems.filter(item => item.section === sectionTitle);

          // Si la sección quedó vacía (ej. un Estudiante no tiene nada en Administración), no dibujamos el título
          if (sectionItems.length === 0) return null;

          return (
            <div key={idx}>
              <span className="nav-separator">{sectionTitle.toUpperCase()}</span>
              
              {sectionItems.map((item, i) => (
                <Link to={item.path} key={i} className="nav-link-wrapper">
                  <li className={location.pathname === item.path ? "active" : "navItem"}>
                    <img src={item.icon} alt={item.label} />
                    <span>{item.label}</span>
                  </li>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}