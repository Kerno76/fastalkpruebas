import "../Config.css"

export function ProfileEditor() {
  return (
    <div className="settingsPanel">

      <div className="settingsMenuP">
        <h3 id="ProEdit">Profile Editor</h3>

        <img id="userP" src="../src/assets/user.png"/>

        <button className="button button-secondary">
          Cambiar foto
        </button>
      </div>

      <div className="settingsThings">

        <div className="formGrid">

          <div className="formField">
            <label>Nombre Completo</label>
            <input type="text" placeholder="John Doe"/>
          </div>

          <div className="formField">
            <label>Correo Electrónico</label>
            <input type="email" placeholder="correo@email.com"/>
          </div>

          <div className="formField">
            <label>Teléfono</label>
            <input type="text" placeholder="+52 222 123 4567"/>
          </div>

        </div>

        <button className="button button-primary">
          Guardar Cambios
        </button>

      </div>

    </div>
  )
}

export function Preferences({ darkMode, toggleTheme }) {
  return (
    <div className="settingsThings">
      <h3 className="settings-header">Preferencias</h3>
      <p className="settings-desc">Configuraciones del sistema y experiencia de usuario</p>
      
      <div className="formGrid settings-grid-margin">
        <div className="formField">
          <label htmlFor="timezone">Zona Horaria</label>
          <select id="timezone" defaultValue="America/Mexico_City" className="select-field">
            <option value="America/Mexico_City">Hora Central (CST) - Puebla/CDMX</option>
            <option value="America/Tijuana">Hora del Pacífico (PST)</option>
            <option value="America/Cancun">Hora del Este (EST)</option>
          </select>
        </div>

        <div className="formField">
          <label htmlFor="language">Idioma</label>
          <select id="language" defaultValue="es" className="select-field">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Fila del Modo Oscuro con tu diseño ORIGINAL (switch clásico) */}
      <div className="settings-row border-top">
        <label id="darkmode" htmlFor="theme-toggle" className="settings-label-title">
            Modo Oscuro
        </label>
        
        <label className="switch">
            <input 
            id="theme-toggle"
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
            />
            <span className="slider"></span>
        </label>
      </div>
    </div>
  )
}

export function Notifications() {
  return (
    <div className="settingsThings">
      <h3 className="settings-header">Notificaciones</h3>
      <p className="settings-desc">Controla los avisos que recibes en la plataforma y por correo</p>

      <div className="settings-toggles-container">
        
        <div className="settings-row border-bottom">
          <div className="settings-label-group">
            <label htmlFor="session-toggle" className="settings-label-title">Avisos de Sesiones</label>
            <span className="settings-label-desc">Recibe un correo cuando se publique el link de una nueva clase.</span>
          </div>
          <label className="rocker rocker-small">
              <input id="session-toggle" type="checkbox" />
              <span className="switch-left">ON</span>
              <span className="switch-right">OFF</span>
          </label>
        </div>

        <div className="settings-row border-bottom">
          <div className="settings-label-group">
            <label htmlFor="task-toggle" className="settings-label-title">Gestión de Tareas</label>
            <span className="settings-label-desc">Notificaciones sobre nuevo material, tareas y calificaciones.</span>
          </div>
          <label className="rocker rocker-small">
              <input id="task-toggle" type="checkbox" />
              <span className="switch-left">ON</span>
              <span className="switch-right">OFF</span>
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <label htmlFor="feedback-toggle" className="settings-label-title">Retroalimentación</label>
            <span className="settings-label-desc">Avisos de la Organización sobre bitácoras.</span>
          </div>
          <label className="rocker rocker-small">
              <input id="feedback-toggle" type="checkbox" />
              <span className="switch-left">ON</span>
              <span className="switch-right">OFF</span>
          </label>
        </div>

      </div>
    </div>
  )
}