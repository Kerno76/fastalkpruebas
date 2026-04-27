import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import "../styles/Config.css"

import avatarDefault from "../assets/user.png"; 

export function ProfileEditor() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  const [formData, setFormData] = useState({
    Name: user.Name || '',
    Email: user.Email || '',
    Phone: user.Phone || '' 
  });

  const [avatarPreview, setAvatarPreview] = useState(user.AvatarUrl || avatarDefault);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result;
        setAvatarPreview(base64String); 

        const loadingToast = toast.loading('Subiendo foto...');

        try {
            const response = await fetch("http://localhost:8000/api/auth/upload-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.ID, base64Image: base64String })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('¡Foto actualizada!', { id: loadingToast });
                const updatedUser = { ...user, AvatarUrl: data.url };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Forzamos a que el preview tome la URL real de Supabase
                setAvatarPreview(data.url);
            } else {
                toast.error('Error al guardar en BD', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión', { id: loadingToast });
        }
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarCambios = async () => {
    const loadingToast = toast.loading('Guardando cambios...');
    try {
        const response = await fetch("http://localhost:8000/api/auth/update-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user.ID,
                rol: user.Rol,
                name: formData.Name,
                phone: formData.Phone
            })
        });

        const data = await response.json();
        if (data.success) {
            toast.success("¡Datos actualizados!", { id: loadingToast });
            const updatedUser = { ...user, Name: formData.Name, Phone: formData.Phone };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
            toast.error("Error al guardar", { id: loadingToast });
        }
    } catch (error) {
        toast.error("Error de conexión", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="settingsPanel">

      <div className="settingsMenuP">
        <h3 id="ProEdit">Mi Perfil</h3>
        
        <img 
            id="userP" 
            src={avatarPreview} 
            alt="Perfil" 
            style={{ 
                objectFit: 'cover', 
                width: '150px',
                height: '150px',
                borderRadius: '15px',
                backgroundColor: '#f1f5f9'
            }} 
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = avatarDefault; 
            }}
        />

        <input 
            type="file" 
            accept="image/*" 
            hidden 
            ref={fileInputRef} 
            onChange={handleFileChange} 
        />

        <button 
            className="button button-secondary" 
            onClick={() => fileInputRef.current.click()}
        >
          Cambiar foto
        </button>
      </div>

      <div className="settingsThings">

        <div className="formGrid">

          <div className="formField">
            <label>Nombre Completo</label>
            <input 
              type="text" 
              name="Name"
              value={formData.Name} 
              onChange={handleChange}
              placeholder="Ej. John Doe"
            />
          </div>

          <div className="formField">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              name="Email"
              value={formData.Email} 
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: '#e2e8f0' }} 
            />
          </div>

          <div className="formField" style={{ gridColumn: "1 / -1", maxWidth: "350px" }}>
            <label>Teléfono</label>
            <input 
              type="text" 
              name="Phone"
              value={formData.Phone} 
              onChange={handleChange}
              placeholder="Ej. 55 1234 5678"
              maxLength={10}
            />
          </div>

        </div>

        <div className="form-actions">
            <button className="button button-primary" onClick={handleGuardarCambios} style={{ marginTop: '0' }}>
              Guardar Cambios
            </button>
            
            <button className="button button-danger" onClick={handleLogout}>
              Cerrar Sesión
            </button>
        </div>

      </div>

    </div>
  );
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
              <input id="session-toggle" type="checkbox" defaultChecked />
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
              <input id="task-toggle" type="checkbox" defaultChecked />
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
              <input id="feedback-toggle" type="checkbox" defaultChecked />
              <span className="switch-left">ON</span>
              <span className="switch-right">OFF</span>
          </label>
        </div>

      </div>
    </div>
  )
}