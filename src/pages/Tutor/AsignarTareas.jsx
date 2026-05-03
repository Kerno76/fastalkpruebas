import { useState } from 'react';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import '../../styles/App.css';
import '../../styles/Tutor/AgendarSesion.css'; // ¡Magia! Reutilizamos el mismo CSS

export default function AsignarTareas() {
  const [tarea, setTarea] = useState({
    alumno: '', 
    titulo: '', 
    descripcion: '', 
    fecha: null, // Inicializamos en null para Day.js
    hora: null, 
    linkMaterial: ''
  });

  const handleChange = (e) => {
    setTarea({ ...tarea, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación de fecha y hora
    if (!tarea.fecha || !tarea.hora) {
        alert("Por favor, selecciona una fecha y hora límite válidas.");
        return;
    }

    // Formateo para mandar al backend
    const datosListos = {
        ...tarea,
        fecha: tarea.fecha.format('YYYY-MM-DD'),
        hora: tarea.hora.format('HH:mm')
    };

    alert('¡Tarea asignada correctamente a tu alumno!');
    console.log("Datos a enviar a Node.js:", datosListos);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="mainContent">
        <h2 id="Title">Asignar Tareas</h2>
        <p className="dashboard-subtitle">Envía ejercicios y establece fechas límite para tus alumnos.</p>

        {/* Aplicamos la tarjeta con la franja de color superior */}
        <div className="agendar-card color-accent">
            <form onSubmit={handleSubmit}>
            
            <div className="agendar-row-2">
                <div className="agendar-group">
                <label>Alumno</label>
                <select className="agendar-input" name="alumno" value={tarea.alumno} onChange={handleChange} required>
                    <option value="">Selecciona a tu alumno...</option>
                    <option value="ID_1">David Pérez (A2 - Inglés)</option>
                    <option value="ID_2">Sofía Gómez (A1 - Inglés)</option>
                    <option value="ID_3">Luis Eduardo (B1 - Francés)</option>
                </select>
                </div>

                <div className="agendar-group">
                <label>Título de la tarea</label>
                <input type="text" className="agendar-input" name="titulo" value={tarea.titulo} placeholder="Ej. Workbook Page 12" onChange={handleChange} required />
                </div>
            </div>

            <div className="agendar-row-3">
                {/* Pickers de Material UI */}
                <div className="agendar-group mui-override">
                <label>Fecha Límite</label>
                <DatePicker 
                    value={tarea.fecha}
                    onChange={(newValue) => setTarea({...tarea, fecha: newValue})}
                    format="DD/MM/YYYY"
                    slotProps={{ textField: { required: true, placeholder: "Selecciona el día" } }}
                />
                </div>

                <div className="agendar-group mui-override">
                <label>Hora Límite</label>
                <TimePicker 
                    value={tarea.hora}
                    onChange={(newValue) => setTarea({...tarea, hora: newValue})}
                    minutesStep={5}
                    slotProps={{ textField: { required: true, placeholder: "Selecciona la hora" } }}
                />
                </div>

                <div className="agendar-group">
                <label>Link de Material (Opcional)</label>
                <input type="url" className="agendar-input" name="linkMaterial" value={tarea.linkMaterial} placeholder="https://..." onChange={handleChange} />
                </div>
            </div>

            <div className="agendar-group" style={{ marginBottom: '25px' }}>
                <label>Instrucciones detalladas</label>
                <textarea 
                className="agendar-input"
                name="descripcion" 
                rows="4" 
                // Evitamos que la altura fija de 48px del input afecte al textarea
                style={{ height: 'auto', resize: 'vertical', paddingTop: '12px' }} 
                placeholder="Escribe aquí las instrucciones para resolver la tarea..." 
                value={tarea.descripcion}
                onChange={handleChange} 
                required
                ></textarea>
            </div>

            <div className="agendar-actions">
                <button type="submit" className="btn-agendar-gradient">
                Publicar Tarea
                </button>
            </div>

            </form>
        </div>
        </div>
    </LocalizationProvider>
  );
}