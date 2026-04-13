import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Organizador/Dashboard"
import Settings from "./pages/Config"
import TutorDashboard from "./pages/Tutor/TutorDashboard"
import RegistroSesiones from "./pages/Tutor/RegistroSesiones"
import HistorialSesiones from "./pages/Tutor/HistorialSesiones"
import AgendarSesion from "./pages/Tutor/AgendarSesion"
import AsignarTareas from "./pages/Tutor/AsignarTareas"
import ControlEstudiantes from "./pages/Organizador/Estudiantes"
import ControlTutores from "./pages/Organizador/Tutores"
import {Routes, Route} from 'react-router-dom'
import "./styles/App.css"

function App() {
  return (
    <div className="dashboard">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tutor" element={<TutorDashboard />} />
        <Route path="/registro" element={<RegistroSesiones />} />
        <Route path="/historial" element={<HistorialSesiones />} />
        <Route path="/estudiantes" element={<ControlEstudiantes />} />
        <Route path="/tutores" element={<ControlTutores />} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/agendar" element={<AgendarSesion />} />
        <Route path="/tareas" element={<AsignarTareas />} />
      </Routes>
    </div>
  )
}

export default App