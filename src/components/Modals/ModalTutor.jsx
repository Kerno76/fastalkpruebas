import { useState } from 'react'; 
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';

import '../../styles/Modals/Modales.css'; 

export default function ModalTutor({ open, onClose }) {

  const [formData, setFormData] = useState({
    nombre: '',
    language: '', 
    email: '',
    telefono: '',
    hobbies: '',
    career: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistrar = async () => {
    if (!formData.nombre || !formData.email || !formData.language) {
      toast.error("Nombre, correo e idioma son obligatorios.");
      return;
    }

    const loadingToast = toast.loading('Registrando nuevo tutor y enviando correo...');

    try {
      const response = await fetch("http://localhost:8000/api/admin/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          Phone: formData.telefono,
          language: formData.language,
          hobbies: formData.hobbies,
          career: formData.career,
          rol: "Tutor" 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('¡Tutor registrado con éxito!', {
          id: loadingToast,
          duration: 3000,
          icon: '🎓',
        });
        
        setFormData({ nombre: '', language: '', email: '', telefono: '', hobbies: '', career: '' });
        onClose();
      } else {
        toast.error(data.message || 'Error al registrar el tutor', { id: loadingToast });
      }

    } catch (error) {
      console.error("Error en la petición:", error);
      toast.error('Error al conectar con el servidor', { id: loadingToast });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ className: 'modal-container' }}
    >
      <IconButton onClick={onClose} className="close-button">
        <CloseIcon />
      </IconButton>

      <div className="modal-content">
        <Typography className="modal-title">Nuevo Tutor</Typography>

        <form className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre Completo</label>
              <TextField 
                fullWidth 
                placeholder="Escriba el nombre..." 
                variant="outlined" 
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Idioma (Curso a Impartir)</label>
              <Select 
                fullWidth
                displayEmpty
                name="language"
                value={formData.language}
                onChange={handleChange}
              >
                <MenuItem value="" disabled style={{ display: 'none' }}></MenuItem>
                <MenuItem value="Inglés">Inglés</MenuItem>
                <MenuItem value="Francés">Francés</MenuItem>
              </Select>
            </div>

            <div className="form-group">
                <label>Carrera (Siglas)</label>
                <TextField 
                    fullWidth 
                    placeholder="Ej. ITC, ISD" 
                    name="career"
                    inputProps={{ maxLength: 6 }}
                    value={formData.career}
                    onChange={handleChange}
                />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Correo Electrónico</label>
              <TextField 
                fullWidth 
                placeholder="correo@ejemplo.com"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Número Telefónico</label>
              <TextField 
                fullWidth 
                placeholder="55 1234 5678" 
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Hobbies (Tags)</label>
            <TextField 
              fullWidth 
              placeholder="Añadir hobbies..." 
              name="hobbies"
              value={formData.hobbies}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
            <Button onClick={handleRegistrar} variant="contained" className="btn-save">Registrar Tutor</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}