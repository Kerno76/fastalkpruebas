import { useEffect } from 'react'; 
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Organizador/Dashboard"
import Settings from "./pages/Config"
import TutorDashboard from "./pages/Tutor/TutorDashboard"
import EstudianteDashboard from "./pages/Estudiante/EstudianteDashboard"
import MiTutor from "./pages/Estudiante/MiTutor"
import RegistroSesiones from "./pages/Tutor/RegistroSesiones"
import HistorialSesiones from "./pages/Tutor/HistorialSesiones"
import AgendarSesion from "./pages/Tutor/AgendarSesion"
import AsignarTareas from "./pages/Tutor/AsignarTareas"
import ControlEstudiantes from "./pages/Organizador/Estudiantes"
import ControlTutores from "./pages/Organizador/Tutores"
import ControlRevisores from "./pages/Organizador/Revisores"
import MisEstudiantes from "./pages/Tutor/MisEstudiantes"
import Repositorio from "./pages/Tutor/Repositorio"
import MisSesiones from "./pages/Estudiante/MisSesiones"
import MisTareas from "./pages/Estudiante/MisTareas"
import DashboardRevisor from "./pages/Revisor/DashboardRevisor"
import LoginPage from "./pages/Login/LoginPage"
import ProtectedRoute from "./components/ProtectedRoute"
import PublicRoute from "./components/PublicRoute"
import Cursos from "./pages/Organizador/Cursos"
import CalificarTareas from "./pages/Tutor/CalificarTareas"

// NUEVAS PANTALLAS DE CIERRE DE CURSOS
import EvaluacionCursos from "./pages/Tutor/EvaluacionCursos"
import RevisionFinalCursos from "./pages/Organizador/RevisionFinalCursos"

// IMPORTACIÓN DEL ASISTENTE IA
import ChatBotSQL from "./pages/Organizador/ChatBotSQL" 

import { Routes, Route, useLocation, Navigate } from 'react-router-dom' 
import { Toaster } from 'react-hot-toast';
import "./styles/App.css"

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);

  return (
    <div className={isLoginPage ? "" : "dashboard"}>
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', padding: '16px', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '700' },
          success: { duration: 3000, theme: { primary: '#2ecc71' } },
          error: { duration: 5000, theme: { primary: '#e74c3c' } },
        }}
      />

      {!isLoginPage && <Sidebar />}
    
      <Routes>
        <Route path="/login" element={<PublicRoute> <LoginPage /> </PublicRoute>} />

        {/* --- RUTAS DE ADMIN --- */}
        <Route path="/" element={<ProtectedRoute allowedRoles={['Admin']}><Dashboard /></ProtectedRoute>} />
        <Route path="/estudiantes" element={<ProtectedRoute allowedRoles={['Admin']}><ControlEstudiantes /></ProtectedRoute>} />
        <Route path="/tutores" element={<ProtectedRoute allowedRoles={['Admin']}><ControlTutores /></ProtectedRoute>} />
        <Route path="/revisores" element={<ProtectedRoute allowedRoles={['Admin']}><ControlRevisores /></ProtectedRoute>} />
        <Route path="/cursos" element={<ProtectedRoute allowedRoles={['Admin']}><Cursos /></ProtectedRoute>} />
        <Route path="/cierre-cursos" element={<ProtectedRoute allowedRoles={['Admin']}><RevisionFinalCursos /></ProtectedRoute>} />
        
        {/* Nueva Ruta Admin Asistente IA */}
        <Route path="/asistente-sql" element={<ProtectedRoute allowedRoles={['Admin']}><ChatBotSQL /></ProtectedRoute>} />

        {/* --- RUTAS DE TUTOR --- */}
        <Route path="/tutor" element={<ProtectedRoute allowedRoles={['Tutor']}><TutorDashboard /></ProtectedRoute>} />
        <Route path="/registro" element={<ProtectedRoute allowedRoles={['Tutor', 'Admin']}><RegistroSesiones /></ProtectedRoute>} />
        <Route path="/historial" element={<ProtectedRoute allowedRoles={['Tutor', 'Admin']}><HistorialSesiones /></ProtectedRoute>} />
        <Route path="/agendar" element={<ProtectedRoute allowedRoles={['Tutor']}><AgendarSesion /></ProtectedRoute>} />
        <Route path="/tareas" element={<ProtectedRoute allowedRoles={['Tutor', 'Admin']}><AsignarTareas /></ProtectedRoute>} />
        <Route path="/mis-estudiantes" element={<ProtectedRoute allowedRoles={['Tutor', 'Admin']}><MisEstudiantes /></ProtectedRoute>} />
        <Route path="/repositorio" element={<ProtectedRoute allowedRoles={['Tutor', 'Admin']}><Repositorio /></ProtectedRoute>} />
        <Route path="/calificar" element={<ProtectedRoute allowedRoles={['Tutor']}><CalificarTareas /></ProtectedRoute>} />
        <Route path="/evaluacion-cursos" element={<ProtectedRoute allowedRoles={['Tutor']}><EvaluacionCursos /></ProtectedRoute>} />

        {/* --- RUTAS DE ESTUDIANTE --- */}
        <Route path="/estudianteDash" element={<ProtectedRoute allowedRoles={['Student']}><EstudianteDashboard /></ProtectedRoute>} />
        <Route path="/miTutor" element={<ProtectedRoute allowedRoles={['Student']}><MiTutor /></ProtectedRoute>} />
        <Route path="/mis-sesiones" element={<ProtectedRoute allowedRoles={['Student', 'Admin']}><MisSesiones /></ProtectedRoute>} />
        <Route path="/mis-tareas" element={<ProtectedRoute allowedRoles={['Student', 'Admin']}><MisTareas /></ProtectedRoute>} />

        {/* --- RUTAS DE REVISOR --- */}
        <Route path="/dashboard-revisor" element={<ProtectedRoute allowedRoles={['Reviewer', 'Admin']}><DashboardRevisor /></ProtectedRoute>} />

        {/* --- RUTAS COMPARTIDAS --- */}
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['Admin', 'Tutor', 'Student', 'Reviewer']}><Settings/></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App