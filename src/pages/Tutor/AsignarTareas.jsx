import { useState } from 'react';
import '../../styles/App.css';
import '../../styles/Config.css'; 

export default function AsignarTareas() {
  const [tarea, setTarea] = useState({
    curso: '', titulo: '', descripcion: '', fechaLimite: '', linkMaterial: ''
  });

  const handleChange = (e) => {
    setTarea({ ...tarea, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Tarea asignada correctamente a los alumnos!');
    console.log("Datos de la tarea:", tarea);
  };

  return (
    <div className="mainContent">
      <h2 id="Title">Asignar Tareas</h2>
      <p className="dashboard-subtitle">Envía ejercicios y establece fechas límite para tus grupos.</p>

      <div className="settingsPanel" style={{ display: 'block', padding: '20px', marginTop: '10px' }}>
        <div className="settingsThings">
          <form onSubmit={handleSubmit}>
            <div className="formGrid">
              
              <div className="formField">
                <label>Curso destino</label>
                <select className="select-field" name="curso" onChange={handleChange} required>
                  <option value="">Selecciona a qué grupo asignar...</option>
                  <option value="1">English - Beginner</option>
                  <option value="2">French - Advanced</option>
                </select>
              </div>

              <div className="formField">
                <label>Título de la tarea</label>
                <input type="text" name="titulo" placeholder="Ej. Workbook Page 12" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Fecha y Hora Límite (Deadline)</label>
                <input type="datetime-local" name="fechaLimite" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Link de Material (Drive / PDF)</label>
                <input type="url" name="linkMaterial" placeholder="Enlace de apoyo (Opcional)" onChange={handleChange} />
              </div>

            </div>

            <div className="formField" style={{ marginTop: '25px' }}>
              <label>Instrucciones detalladas</label>
              <textarea 
                name="descripcion" 
                rows="4" 
                style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d6dbe1', background: 'linear-gradient(145deg,#E3E9F5,#E1EBF7)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Escribe aquí las instrucciones para resolver la tarea..." 
                onChange={handleChange} 
                required
              ></textarea>
            </div>

            <button type="submit" className="button button-primary" style={{ marginTop: '25px' }}>
              Publicar Tarea
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}