import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import "./App.css"

function App() {
  return (
    <div className="dashboard">

      <Sidebar />

      <Dashboard />

    </div>
  )
}

export default App