import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import {Routes, Route} from 'react-router-dom'
import "./App.css"

function App() {
  return (
    <div className="dashboard">

      <Sidebar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>

    </div>
  )
}

export default App