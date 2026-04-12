import { useState } from 'react';
import '../../styles/App.css';
import '../../styles/Config.css'; 

export default function AsignarTareas() {
  const [tarea, setTarea] = useState({
    alumno: '', titulo: '', descripcion: '', fecha: '', hora: '', linkMaterial: ''
  });

  const handleChange = (e) => {
    setTarea({ ...tarea, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Tarea asignada correctamente a tu alumno!');
    console.log("Datos a enviar a Node.js:", tarea);
  };

  return (
    <div className="mainContent">
      <h2 id="Title">Asignar Tareas</h2>
      <p className="dashboard-subtitle">Envía ejercicios y establece fechas límite para tus alumnos.</p>

      {/* Contenedor central tipo tarjeta */}
      <div className="settingsPanel" style={{ maxWidth: '850px', padding: '35px', display: 'block', marginTop: '20px' }}>
        <div className="settingsThings" style={{ padding: '0' }}>
          <form onSubmit={handleSubmit}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
              <div className="formField">
                <label>Alumno</label>
                <select className="select-field" name="alumno" onChange={handleChange} required>
                  <option value="">Selecciona a tu alumno...</option>
                  <option value="ID_1">David Pérez (A2)</option>
                  <option value="ID_2">Sofía Gómez (A1)</option>
                  <option value="ID_3">Luis Eduardo (B1)</option>
                </select>
              </div>

              <div className="formField">
                <label>Título de la tarea</label>
                <input type="text" name="titulo" placeholder="Ej. Workbook Page 12" onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '25px' }}>
              <div className="formField">
                <label>Fecha Límite</label>
                <input type="date" name="fecha" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Hora Límite</label>
                <input type="time" name="hora" onChange={handleChange} required />
              </div>

              <div className="formField">
                <label>Link de Material (Opcional)</label>
                <input type="text" name="linkMaterial" placeholder="https://..." onChange={handleChange} />
              </div>
            </div>

            <div className="formField" style={{ marginBottom: '35px' }}>
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

            {/* Botón alineado a la derecha */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="button button-primary">
                Publicar Tarea
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}