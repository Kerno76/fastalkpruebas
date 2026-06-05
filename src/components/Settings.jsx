import { useState, useRef, useEffect } from 'react';
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

    window.dispatchEvent(new Event('fastalk:logout')); // para SSE y otros listeners globales que necesitan reaccionar al logout

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

  // Obtenemos al usuario para saber su rol
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const rol = user.Rol;

  // Leemos lo que haya en localStorage o asignamos valores por defecto
  const [firstDay, setFirstDay] = useState(localStorage.getItem('firstDayOfWeek') || '0'); // 0 = Domingo, 1 = Lunes
  
  // Como fallback, si no hay nada guardado, lo dejamos vacío para que el Login decida
  const [homePage, setHomePage] = useState(localStorage.getItem(`defaultHome_${rol}`) || '');

  // Estado para el select del idioma
  const [currentLang, setCurrentLang] = useState('es');

  // Recogemos de la memoria para saber si ya se tradujo la pagina antes
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    if (match) {
        const lang = match[1].split('/')[2];
        if (lang) setCurrentLang(lang);
    }
  }, []);

  const handleFirstDayChange = (e) => {
    const newDay = e.target.value;
    setFirstDay(newDay);
    localStorage.setItem('firstDayOfWeek', newDay);
    toast.success("Calendario actualizado", { icon: '📅' });
  };

  const handleHomeChange = (e) => {
    const newHome = e.target.value;
    setHomePage(newHome);
    localStorage.setItem(`defaultHome_${rol}`, newHome);
    toast.success("Página de inicio actualizada", { icon: '🏠' });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentLang(newLang);

    // Buscamos el select oculto de Google
    const googleSelect = document.querySelector('.goog-te-combo');
    if (googleSelect) {
        googleSelect.value = newLang;
        // Simulamos un click humano para que Google detecte el cambio y traduzca
        googleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <div className="settingsThings">
      <h3 className="settings-header">Preferencias</h3>
      <p className="settings-desc">Configuraciones del sistema y experiencia de usuario</p>
      
      <div className="formGrid settings-grid-margin">

        <div className="formField">
          <label htmlFor="firstDay">Inicio de la semana</label>
          <select id="firstDay" value={firstDay} onChange={handleFirstDayChange} className="select-field">
            <option value="0">Domingo</option>
            <option value="1">Lunes</option>
          </select>
        </div>

        <div className="formField">
          <label htmlFor="language">Idioma del Sistema</label>
          <select id="language" value={currentLang} onChange={handleLanguageChange} className="select-field">
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="formField" style={{ gridColumn: '1 / -1', maxWidth: '350px' }}>
          <label htmlFor="homePage">Página al iniciar sesión</label>
          <select id="homePage" value={homePage} onChange={handleHomeChange} className="select-field">

            <option value="">Dashboard</option>

            {/* Opciones solo para Admins */}
            {rol === 'Admin' && (
                <>
                    <option value="/estudiantes">Control de Estudiantes</option>
                    <option value="/tutores">Control de Tutores</option>
                    <option value="/revisores">Control de Revisores</option>
                    <option value="/cursos">Control de Cursos</option>
                    <option value="/cierre-cursos">Cierre de Cursos</option>
                    <option value="/asistente-sql">Asistente IA (SQL)</option>
                </>
            )}

            {/* Opciones solo para Tutores */}
            {rol === 'Tutor' && (
                <>
                    <option value="/mis-estudiantes">Mis Estudiantes</option>
                    <option value="/agendar">Agendar Sesión</option>
                    <option value="/registro">Registro de Sesiones</option>
                    <option value="/historial">Historial de Sesiones</option>
                    <option value="/tareas">Asignar Tareas</option>
                    <option value="/calificar">Calificar Tareas</option>
                    <option value="/repositorio">Repositorio</option>
                    <option value="/evaluacion-cursos">Evaluacion Final de Cursos</option>
                </>
            )}

            {/* Opciones solo para Estudiantes */}
            {rol === 'Student' && (
                <>
                    <option value="/miTutor">Mi Tutor</option>
                    <option value="/mis-sesiones">Mis Sesiones</option>
                    <option value="/mis-tareas">Mis Tareas</option>
                </>
            )}

            {/* Opciones solo para Revisores */}
            {rol === 'Reviewer' && (
                <>
                    <option value="/visitas">Visitas a Clases</option>
                    <option value="/misTut">Mis Tutores</option>
                </>
            )}
            
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
  // Identificamos al usuario y su rol
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const userRole = user.Rol || 'Student';

  // Se cargan las preferencias
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem(`notifPrefs_${user.ID}`);
    // Si es la primera vez que entra, encendemos todo por defecto
    return saved ? JSON.parse(saved) : {
      sesiones: true, tareas: true, alertas: true, 
      revisiones: true, entregas: true, bitacoras: true, cursos: true
    };
  });

  const handleToggle = (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    localStorage.setItem(`notifPrefs_${user.ID}`, JSON.stringify(newPrefs));
    toast.success("Preferencias actualizadas correctamente");
  };

  // Menú dinámico dependiendo del Rol
  const opcionesPorRol = {
    'Student': [
      { key: 'sesiones', title: 'Clases y Agendas', desc: 'Avisos cuando tu tutor programe, reagende o cancele una clase.' },
      { key: 'tareas', title: 'Centro de Tareas', desc: 'Notificaciones de nuevas tareas, actualizaciones y calificaciones.' },
      { key: 'alertas', title: 'Avisos del Curso', desc: 'Avisos de fin de curso, aprobaciones y alertas del sistema.' }
    ],
    'Tutor': [
      { key: 'revisiones', title: 'Evaluación de Bitácoras', desc: 'Avisos cuando el Revisor apruebe o rechace tus bitácoras.' },
      { key: 'entregas', title: 'Entregas de Alumnos', desc: 'Notificaciones cuando tus alumnos envíen sus tareas.' },
      { key: 'alertas', title: 'Alertas de Administración', desc: 'Avisos de cierre de cursos y alertas del sistema.' }
    ],
    'Reviewer': [
      { key: 'bitacoras', title: 'Nuevas Bitácoras', desc: 'Avisos cuando un tutor envíe una bitácora lista para revisión.' }
    ],
    'Admin': [
      { key: 'cursos', title: 'Cierre de Cursos', desc: 'Avisos cuando un tutor envíe las calificaciones finales para revisión.' },
      { key: 'bitacoras', title: 'Sesiones Completadas', desc: 'Notificaciones cuando los tutores finalicen clases y entreguen reportes.' }
    ]
  };

  const opcionesActuales = opcionesPorRol[userRole] || opcionesPorRol['Student'];

  return (
    <div className="settingsThings">
      <h3 className="settings-header">Preferencias de Notificaciones</h3>
      <p className="settings-desc">Personaliza qué tipo de actividad quieres ver en tu panel principal.</p>

      <div className="settings-toggles-container">
        {opcionesActuales.map((opcion, index) => (
          <div key={opcion.key} className={`settings-row ${index !== opcionesActuales.length - 1 ? 'border-bottom' : ''}`}>
            
            <div className="settings-label-group">
              <label htmlFor={`toggle-${opcion.key}`} className="settings-label-title">
                {opcion.title}
              </label>
              <span className="settings-label-desc">{opcion.desc}</span>
            </div>
            
            <label className="rocker rocker-small">
                <input 
                  id={`toggle-${opcion.key}`} 
                  type="checkbox" 
                  checked={prefs[opcion.key]}
                  onChange={() => handleToggle(opcion.key)} 
                />
                <span className="switch-left">ON</span>
                <span className="switch-right">OFF</span>
            </label>

          </div>
        ))}
      </div>
    </div>
  );
}