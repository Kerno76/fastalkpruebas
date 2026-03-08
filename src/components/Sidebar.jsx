import { navItems } from "../data/navItems"
import { Link } from "react-router-dom"

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>English Tutoring Platform</h2>

      <ul>
        {navItems.map((item, i) => (
          <li key={i}>
            <Link to={item.path} className="navItem">
              <img src={item.icon} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}