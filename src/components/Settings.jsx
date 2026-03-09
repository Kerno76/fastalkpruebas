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

export function Preferences({ darkMode, toggleTheme}) {
  return (
    <div>
      <h3>Preferencias</h3>
      <p>Configuraciones del sistema</p>
      <div className="settingRow">
            {/* Agregamos htmlFor y un ID al input para que sean clicables juntos */}
            <label id="darkmode" htmlFor="theme-toggle" style={{ cursor: 'pointer' }}>
                Modo Oscuro
            </label>

            <label className="switch">
                <input 
                id="theme-toggle" /* Nuevo ID */
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
    <div>
      <h3>Notificaciones</h3>
      <p>Configuración de notificaciones</p>
    </div>
  )
}