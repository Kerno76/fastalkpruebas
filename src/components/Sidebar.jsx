import { navItems } from "../data/navItems"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

export default function Sidebar() {

  const [activeSection, setActiveSection] = useState("profile")
  
  return (
    <div className="sidebar">
      <h2>English Tutoring Platform</h2>

      <ul>
        {navItems.map((item, i) => (
          <li key={i} 
              onClick={() => setActiveSection(item.path)}
              className={activeSection === item.path ? "active" : ""}>
            
            <Link to={item.path} className="navItem">
              <img src={item.icon} alt={item.label} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}