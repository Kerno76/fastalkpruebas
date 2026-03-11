import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Config"
import { TutorDashboard } from "./pages/TutorDashboard"
import RegistroSesiones from "./pages/RegistroSesiones"
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
        <Route path="/settings" element={<Settings/>} />
      </Routes>

    </div>
  )
}

export default App