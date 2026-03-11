import { ProfileEditor, Preferences, Notifications } from "../components/Settings"

import { useState, useEffect } from "react"
import { profileItems } from "../data/navItems"
import "../styles/App.css"
import "../styles/Config.css"

export default function Settings() {

    const [activeSection, setActiveSection] = useState("profile")
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")

        if (savedTheme === "dark") {
        setDarkMode(true)
        document.body.classList.add("dark")
        }
    }, [])

    const toggleTheme = () => {
        if (darkMode) {
        document.body.classList.remove("dark")
        localStorage.setItem("theme", "light")
        } else {
        document.body.classList.add("dark")
        localStorage.setItem("theme", "dark")
        }

        setDarkMode(!darkMode)
    }

  return (
    <div className="mainContent">

      <h2 id="Title">Configuración de la Cuenta</h2>

        <div className="settingsPanel">
            <div className="settingsMenu">
                <ul>
                {profileItems.map((item, i) => (
                    <li 
                        key={i} 
                        onClick={() => setActiveSection(item.section)}
                        className={activeSection === item.section ? "active" : ""}
                    >
                    <img src={item.icon} />
                    {item.label}
                    </li>
                ))}
                </ul>
            </div>

            <div className="settingsBody">
                {activeSection === "profile" && <ProfileEditor />}
                {activeSection === "preferences" && <Preferences darkMode={darkMode} toggleTheme={toggleTheme} />}
                {activeSection === "notifications" && <Notifications />}
            </div>

        </div>
    </div>
  )
}