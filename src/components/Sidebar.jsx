import { navItems } from "../data/navItems"

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>English Tutoring Platform</h2>

      <ul>
        {navItems.map((item, i) => (
          <li key={i}>
            <img src={item.icon} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}