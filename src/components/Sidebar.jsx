import { useEffect } from "react";
import { navItems } from "../data/navItems";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/FasTalk.jpeg";

export default function Sidebar() {
  const location = useLocation();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRol = user?.Rol || ""; 
  const userId = user?.ID;

  useEffect(() => {
    if (!userId || userRol === 'Admin') return;

    const checkAccountStatus = async () => {
        try {
            // 1. Detección de ruta dinámica según el rol
            let apiUrl = `http://localhost:8000/api/tutor/notificaciones/${userId}`;
            
            if (userRol === 'Student') {
                apiUrl = `http://localhost:8000/api/student/notificaciones/${userId}`;
            } else if (userRol === 'Reviewer') {
                apiUrl = `http://localhost:8000/api/revisor/notificaciones/${userId}`; // Asegúrate de que esta sea la ruta de tu revisor
            }

            // 2. Hacemos la petición a la ruta correcta
            const response = await fetch(apiUrl);
            
            // 3. Si el backend responde 404 (porque no existe la cuenta), lanza el error
            if (!response.ok) {
                throw new Error("Sesión inválida");
            }

            const result = await response.json();
            
            if (result.success === false) {
                throw new Error("Cuenta eliminada");
            }
        } catch (error) {
            console.log("Detectada eliminación de cuenta. Redirigiendo...");
            localStorage.removeItem('user');
            window.location.replace('/login'); 
        }
    };

    checkAccountStatus();
    const intervalId = setInterval(checkAccountStatus, 10000);

    return () => clearInterval(intervalId);
  }, [userId, userRol]);

  const allowedItems = navItems.filter(item => item.roles.includes(userRol));
  const sectionsList = ["Administración", "Tutoría", "Estudiante", "Revisión", "General"];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="FasTalk Logo" className="sidebar-logo" />
        <h2>FasTalk</h2>
      </div>
      
      <div className="nav-list">
        {sectionsList.map((sectionTitle, idx) => {
          const sectionItems = allowedItems.filter(item => item.section === sectionTitle);

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