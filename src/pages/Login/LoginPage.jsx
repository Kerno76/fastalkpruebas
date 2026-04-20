import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope } from 'react-icons/fa';
import logo from '../../assets/FasTalk.jpeg'; 
import '../../styles/LoginPage.css';

import toast from 'react-hot-toast';
import ModalOlvidoPassword from '../../components/Modals/ModalOlvidoPassword';

export default function LoginPage() {
  const [isExiting, setIsExiting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Disparamos el Toast
    toast.success('¡Sesión iniciada con éxito!');

    // 2. Activamos la animación de salida
    setIsExiting(true);

    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  const [openForgot, setOpenForgot] = useState(false);

  return (
    <div className={`login-page-wrapper ${isExiting ? 'fade-out' : 'fade-in'}`}>
      
      <div className="login-card">
        
        <img src={logo} alt="FasTalk Logo" className="login-logo-img" />
        
        <p className="login-slogan">
          "Conectando mentes, transformando comunidades."
        </p>
        
        <h2 className="login-title-main">Bienvenido</h2>
        <p className="login-subtitle-main">PORTAL DE SERVICIO SOCIAL</p>
        
        <form className="login-form-container" onSubmit={handleSubmit}>
          
          <div className="input-group-custom">
            <label>Correo Electrónico</label>
            <div className="input-wrapper-icon">
              <FaEnvelope className="field-icon" />
              <input 
                type="email" 
                placeholder="ejemplo@tec.mx" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="input-group-custom">
            <label>Contraseña</label>
            <div className="input-wrapper-icon">
              <FaLock className="field-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="forgot-link-box">
            <span className="forgot-password-trigger" onClick={() => setOpenForgot(true)} style={{ cursor: 'pointer', color: '#c89f70', fontSize: '14px' }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button type="submit" className="btn-login-submit">
            Iniciar Sesión
          </button>
          
        </form>

        <ModalOlvidoPassword open={openForgot} onClose={() => setOpenForgot(false)} />
        
      </div>

    </div>
  );
}