import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../../assets/FasTalk.jpeg'; 
import '../../styles/LoginPage.css';

import toast from 'react-hot-toast';
import ModalOlvidoPassword from '../../components/Modals/ModalOlvidoPassword';

export default function LoginPage() {
  const [isExiting, setIsExiting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    })
    .then((res) => res.json())
    .then((data) => {
      
      if (data.success) {
        // Guardamos la sesión en el navegador
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success(`¡Bienvenido ${data.user.Name}!`);
        setIsExiting(true);

        // Redirigimos dependiendo del Rol exacto que viene de tu BD
        setTimeout(() => {
          if (data.user.Rol === 'Admin') navigate('/');
          else if (data.user.Rol === 'Tutor') navigate('/tutor');
          else if (data.user.Rol === 'Student') navigate('/estudianteDash');
          else if (data.user.Rol === 'Reviewer') navigate('/dashboard-revisor');
          else navigate('/'); // Por si acaso
        }, 600);

      } else {
        toast.error(data.message);
      }
    })
    .catch((error) => {
      console.error("Error conectando al servidor:", error);
      toast.error("Error al conectar con el servidor. ¿Está encendido Node.js?");
    });
  };

  const [openForgot, setOpenForgot] = useState(false);

  return (
    <div className={`login-page-wrapper ${isExiting ? 'fade-out' : 'fade-in'}`}>
      <div className="login-card">
        <img src={logo} alt="FasTalk Logo" className="login-logo-img" />
        <p className="login-slogan">"Conectando mentes, transformando comunidades."</p>
        <h2 className="login-title-main">Bienvenido</h2>
        <p className="login-subtitle-main">PORTAL DE SERVICIO SOCIAL</p>
        
        <form className="login-form-container" onSubmit={handleSubmit}>
          <div className="input-group-custom">
            <label>Correo Electrónico</label>
            <div className="input-wrapper-icon">
              <FaEnvelope className="field-icon" />
              <input type="email" placeholder="ejemplo@tec.mx" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="input-group-custom">
            <label>Contraseña</label>
            <div className="input-wrapper-icon">
              <FaLock className="field-icon" />
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute',right: '14px',cursor: 'pointer',color: '#94a3b8',display: 'flex',alignItems: 'center',fontSize: '1.1rem'}}> 
                {showPassword ? <FaEye /> : <FaEyeSlash /> }
              </span>
            </div>
          </div>

          <div className="forgot-link-box">
            <span className="forgot-password-trigger" onClick={() => setOpenForgot(true)} style={{ cursor: 'pointer', color: '#c89f70', fontSize: '14px' }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button type="submit" className="btn-login-submit">Iniciar Sesión</button>
        </form>

        <ModalOlvidoPassword open={openForgot} onClose={() => setOpenForgot(false)} />
      </div>
    </div>
  );
}