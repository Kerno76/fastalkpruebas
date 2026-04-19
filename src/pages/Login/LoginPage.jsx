import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope } from 'react-icons/fa';
import logo from '../../assets/FasTalk.jpeg'; 
import '../../styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard-revisor');
  };

  return (
    <div className="login-page-wrapper">
      
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
            <a href="/olvido-contrasena">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="btn-login-submit">
            Iniciar Sesión
          </button>
          
        </form>
        
      </div>

    </div>
  );
}