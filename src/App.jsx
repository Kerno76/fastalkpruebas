import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Organizador/Dashboard" // ¡Ruta corregida!
import Settings from "./pages/Config"
import TutorDashboard from "./pages/Tutor/TutorDashboard" // Asegúrate de que esta ruta sea correcta
import RegistroSesiones from "./pages/Tutor/RegistroSesiones"
import HistorialSesiones from "./pages/Tutor/HistorialSesiones"
import AgendarSesion from "./pages/Tutor/AgendarSesion" // Nueva
import AsignarTareas from "./pages/Tutor/AsignarTareas" // Nueva
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
        <Route path="/settings" element={<Settings/>} />
        {/* Nuevas rutas del tutor */}
        <Route path="/agendar" element={<AgendarSesion />} />
        <Route path="/tareas" element={<AsignarTareas />} />
      </Routes>
    </div>
  )
}

export default App