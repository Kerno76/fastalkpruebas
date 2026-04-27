import { navItems } from "../data/navItems"
import { Link, useLocation } from "react-router-dom"
import logo from "../assets/FasTalk.jpeg" 

export default function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRol = user?.Rol || ""; 

  const filteredItems = navItems.filter(item => item.roles.includes(userRol));

  // Definimos los bloques visuales
  const sections = [
    { title: "Administración", key: "admin" },
    { title: "Gestión Tutoría", key: "tutor" },
    { title: "Vista Estudiante", key: "student" },
    { title: "Revisión", key: "revisor" },
    { title: "Sistema", key: "general" }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <h2>FasTalk</h2>
      </div>
      
      <div className="nav-list">
        {sections.map((section, idx) => {
          const sectionItems = filteredItems.filter(item => {
            // Lógica de agrupamiento
            if (section.key === "admin") return item.roles.includes('Admin') && (item.path === "/" || item.path === "/estudiantes" || item.path === "/tutores" || item.path === "/revisores");
            if (section.key === "tutor") return item.path === "/tutor" || item.path === "/mis-estudiantes" || item.path === "/agendar" || item.path === "/tareas" || item.path === "/registro" || item.path === "/historial";
            if (section.key === "student") return item.path === "/estudianteDash" || item.path === "/miTutor" || item.path === "/mis-sesiones" || item.path === "/mis-tareas";
            if (section.key === "revisor") return item.path === "/dashboard-revisor";
            if (section.key === "general") return item.path === "/settings" || item.path === "/repositorio";
            return false;
          });

          if (sectionItems.length === 0) return null;

          return (
            <div key={idx}>
              <span className="nav-separator">{section.title}</span>
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