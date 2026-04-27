import { useState } from 'react';
import '../../styles/App.css';
import '../../styles/Config.css'; 

export default function AsignarTareas() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.Rol === 'Admin';
  
  // Datos de ejemplo (En el futuro vendrán de tu base de datos)
  const alumnosGlobales = [
    { id: "ID_1", nombre: "David Pérez (A2)" },
    { id: "ID_2", nombre: "Sofía Gómez (A1)" },
    { id: "ID_3", nombre: "Luis Eduardo (B1)" },
    { id: "ID_4", nombre: "Alan R. (B2)" }
  ];

  const misAlumnos = [
    { id: "ID_1", nombre: "David Pérez (A2)" }
  ];

  const [tarea, setTarea] = useState({
    alumno: '', titulo: '', descripcion: '', fecha: '', hora: '', linkMaterial: ''
  });

  const handleChange = (e) => {
    setTarea({ ...tarea, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(isAdmin ? 'Tarea asignada globalmente por el Administrador' : '¡Tarea asignada correctamente a tu alumno!');
    console.log("Datos a enviar a Node.js:", tarea);
  };

  return (
    <div className="mainContent">
      <h2 id="Title">{isAdmin ? "Asignación Global de Tareas" : "Asignar Tareas"}</h2>
      <p className="dashboard-subtitle">
        {isAdmin ? "Panel de supervisión: Puedes asignar ejercicios a cualquier alumno del sistema." : "Envía ejercicios y establece fechas límite para tus alumnos."}
      </p>

      {/* Contenedor central tipo tarjeta */}
      <div className="settingsPanel" style={{ maxWidth: '850px', padding: '35px', display: 'block', marginTop: '20px' }}>
        <div className="settingsThings" style={{ padding: '0' }}>
          <form onSubmit={handleSubmit}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
              <div className="formField">
                <label>Alumno</label>
                <select className="select-field" name="alumno" onChange={handleChange} required>
                  <option value="">Selecciona al alumno...</option>
                  
                  {isAdmin ? (
                    alumnosGlobales.map(est => (
                      <option key={est.id} value={est.id}>{est.nombre}</option>
                    ))
                  ) : (
                    misAlumnos.map(est => (
                      <option key={est.id} value={est.id}>{est.nombre}</option>
                    ))
                  )}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center' }}>
              {isAdmin && <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 'bold' }}>👑 Modo Administrador Activo</span>}
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