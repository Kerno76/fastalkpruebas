import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Config"
import RegistroSesiones from "./pages/RegistroSesiones"
import {Routes, Route} from 'react-router-dom'
import "./App.css"

function App() {
  return (
    <div className="dashboard">

      <Sidebar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/registro" element={<RegistroSesiones />} />
        <Route path="/settings" element={<Settings/>} />
      </Routes>

    </div>
  )
}

export default App