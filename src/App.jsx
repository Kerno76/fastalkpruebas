import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Organizador/Dashboard"
import Settings from "./pages/Config"
import TutorDashboard from "./pages/Tutor/TutorDashboard"
import RegistroSesiones from "./pages/Tutor/RegistroSesiones"
import HistorialSesiones from "./pages/Tutor/HistorialSesiones"
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
      </Routes>

    </div>
  )
}

export default App