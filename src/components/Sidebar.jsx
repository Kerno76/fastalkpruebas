import { useEffect } from "react";
import { navItems } from "../data/navItems";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/FasTalk.jpeg";

import { useSSE } from '../hooks/useSSE'; // Hook para suscribirse a eventos SSE

export default function Sidebar() {
  const location = useLocation();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRol = user?.Rol || "";
  const userId = user?.ID;

  useEffect(() => {
    if (!userId || userRol === 'Admin') return;

    // Check inicial para validar que la sesión sigue siendo válida (cuenta no eliminada)
    const checkAccountStatus = async () => {
      try {
        let apiUrl = `http://localhost:8000/api/tutor/notificaciones/${userId}`;
        if (userRol === 'Student') apiUrl = `http://localhost:8000/api/student/notificaciones/${userId}`;
        else if (userRol === 'Reviewer') apiUrl = `http://localhost:8000/api/revisor/notificaciones/${userId}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Sesión inválida");
        const result = await response.json();
        if (result.success === false) throw new Error("Cuenta eliminada");
      } catch (error) {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('fastalk:logout'));
        window.location.replace('/login');
      }
    };

    checkAccountStatus(); // solo una vez
  }, [userId, userRol]);

  // ✅ EVENTO GLOBAL: logout (aplica a todos)
  // El servidor envía eventos SSE del logout 
  useSSE('logout', () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('fastalk:logout'));
    window.location.replace('/login');
  });

  // ✅ EVENTOS PARA TUTOR: Mantener suscriptores activos permanentemente
  // Aunque TutorDashboard se desmonte, estos eventos seguirán activos en el Sidebar
  if (userRol === 'Tutor') {
    useSSE('tareaEntregada', () => {
      console.log('[SSE Sidebar] tareaEntregada recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('tutorDataUpdated', {
        detail: { event: 'tareaEntregada' }
      }));
    });

    useSSE('sessionAgendada', () => {
      console.log('[SSE Sidebar] sessionAgendada recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('tutorDataUpdated', {
        detail: { event: 'sessionAgendada' }
      }));
    });

    useSSE('bitacoraRevisada', () => {
      console.log('[SSE Sidebar] bitacoraRevisada recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('tutorDataUpdated', {
        detail: { event: 'bitacoraRevisada' }
      }));
    });
  }

  // ✅ EVENTOS PARA ESTUDIANTE: Mantener suscriptores activos permanentemente
  if (userRol === 'Student') {
    useSSE('notificaciones', () => {
      console.log('[SSE Sidebar] notificaciones recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('studentDataUpdated', {
        detail: { event: 'notificaciones' }
      }));
    });

    useSSE('nuevaTarea', () => {
      console.log('[SSE Sidebar] nuevaTarea recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('studentDataUpdated', {
        detail: { event: 'nuevaTarea' }
      }));
    });

    useSSE('calificacion', () => {
      console.log('[SSE Sidebar] calificacion recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('studentDataUpdated', {
        detail: { event: 'calificacion' }
      }));
    });

    useSSE('proximaSesion', () => {
      console.log('[SSE Sidebar] proximaSesion recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('studentDataUpdated', {
        detail: { event: 'proximaSesion' }
      }));
    });
  }

  // ✅ EVENTOS PARA REVISOR: Mantener suscriptores activos permanentemente
  if (userRol === 'Reviewer') {
    useSSE('bitacorasList', () => {
      console.log('[SSE Sidebar] bitacorasList recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('reviewerDataUpdated', {
        detail: { event: 'bitacorasList' }
      }));
    });

    useSSE('visitasAgendadas', () => {
      console.log('[SSE Sidebar] visitasAgendadas recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('reviewerDataUpdated', {
        detail: { event: 'visitasAgendadas' }
      }));
    });

    useSSE('alertasAdmin', () => {
      console.log('[SSE Sidebar] alertasAdmin recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('reviewerDataUpdated', {
        detail: { event: 'alertasAdmin' }
      }));
    });
  }

  // ✅ EVENTOS PARA ADMIN: Mantener suscriptores activos permanentemente
  if (userRol === 'Admin') {
    useSSE('estadisticas', () => {
      console.log('[SSE Sidebar] estadisticas recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('adminDataUpdated', {
        detail: { event: 'estadisticas' }
      }));
    });

    useSSE('alertasAdmin', () => {
      console.log('[SSE Sidebar] alertasAdmin recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('adminDataUpdated', {
        detail: { event: 'alertasAdmin' }
      }));
    });

    useSSE('cursoCerrado', () => {
      console.log('[SSE Sidebar] cursoCerrado recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('adminDataUpdated', {
        detail: { event: 'cursoCerrado' }
      }));
    });

    useSSE('bitacorasList', () => {
      console.log('[SSE Sidebar] bitacorasList recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('adminDataUpdated', {
        detail: { event: 'bitacorasList' }
      }));
    });

    useSSE('visitasAgendadas', () => {
      console.log('[SSE Sidebar] visitasAgendadas recibida → disparar evento global');
      window.dispatchEvent(new CustomEvent('adminDataUpdated', {
        detail: { event: 'visitasAgendadas' }
      }));
    });
  }

  const allowedItems = navItems.filter(item => item.roles.includes(userRol));

  // MODIFICADO: Definimos las secciones dinámicamente. 
  // Si es Admin, excluimos "Tutoría" y "Estudiante".
  let sectionsList = ["Administración", "Tutoría", "Estudiante", "Revisión", "General"];

  if (userRol === 'Admin') {
    sectionsList = ["Administración", "Revisión", "General"];
  }

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
