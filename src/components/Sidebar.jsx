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
          <Link 
            to={item.path} 
            key={i} 
            className="nav-link-wrapper"
            onClick={() => setActiveSection(item.path)}
          >
            <li className={activeSection === item.path ? "active" : "navItem"}>
              <img src={item.icon} alt={item.label} />
              {item.label}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  )
}