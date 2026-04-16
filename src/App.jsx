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
import {Routes, Route} from 'react-router-dom'
import "./styles/App.css"

function App() {
  return (
    <div className="dashboard">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tutor" element={<TutorDashboard />} />
        <Route path="/estudianteDash" element={<EstudianteDashboard />} />
        <Route path="/miTutor" element={<MiTutor />} />
        <Route path="/registro" element={<RegistroSesiones />} />
        <Route path="/historial" element={<HistorialSesiones />} />
        <Route path="/estudiantes" element={<ControlEstudiantes />} />
        <Route path="/tutores" element={<ControlTutores />} />
        <Route path="/revisores" element={<ControlRevisores />} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/agendar" element={<AgendarSesion />} />
        <Route path="/tareas" element={<AsignarTareas />} />
        <Route path="/mis-estudiantes" element={<MisEstudiantes />} />
        <Route path="/mis-sesiones" element={<MisSesiones />} />
        <Route path="/mis-tareas" element={<MisTareas />} />
        <Route path="/repositorio" element={<Repositorio />} />
        <Route path="/dashboard-revisor" element={<DashboardRevisor />} />
      </Routes>
    </div>
  )
}

export default App