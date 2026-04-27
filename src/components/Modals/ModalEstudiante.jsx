import { useState } from 'react';
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import '../../styles/Modals/Modales.css'; 

export default function ModalEstudiante({ open, onClose }) {

  const [formData, setFormData] = useState({
    Name: '',
    BirthDate: '',
    Language: '',
    CurrentLevel: '', 
    Email: '',
    Phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistrar = async () => {
    if (!formData.Name || !formData.Email || !formData.Language || !formData.BirthDate || !formData.CurrentLevel) {
      toast.error("Todos los campos obligatorios deben llenarse.");
      return;
    }

    const loadingToast = toast.loading('Registrando nuevo estudiante...');

    try {
      const response = await fetch("http://localhost:8000/api/admin/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.Name,
          email: formData.Email,
          Phone: formData.Phone,
          language: formData.Language,
          CurrentLevel: formData.CurrentLevel, 
          BirthDate: formData.BirthDate,
          rol: "Student"
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('¡Estudiante registrado con éxito!', { id: loadingToast, icon: '🎓' });
        setFormData({ Name: '', BirthDate: '', Language: '', CurrentLevel: '', Email: '', Phone: '' });
        onClose();
      } else {
        toast.error(data.message || 'Error al registrar', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor', { id: loadingToast });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
      <IconButton onClick={onClose} className="close-button"><CloseIcon /></IconButton>

      <div className="modal-content">
        <Typography className="modal-title">Nuevo Estudiante</Typography>

        <form className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre Completo</label>
              <TextField fullWidth placeholder="Escriba el nombre..." variant="outlined" name="Name" value={formData.Name} onChange={handleChange} />
            </div>
            
            <div className="form-mini-group">
              <label>Fecha de Nacimiento</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker 
                  onChange={(newValue) => setFormData({ ...formData, BirthDate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                  slotProps={{ textField: { fullWidth: true, variant: "outlined", placeholder: "MM/DD/YYYY" } }}
                />
              </LocalizationProvider>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Idioma (Curso a Enrolar)</label>
              <Select displayEmpty fullWidth name="Language" value={formData.Language} onChange={handleChange}>
                <MenuItem value="" disabled style={{ display: 'none' }}></MenuItem>
                <MenuItem value="Inglés">Inglés</MenuItem>
                <MenuItem value="Francés">Francés</MenuItem>
              </Select>
            </div>
            
            <div className="form-group">
              <label>Nivel Actual</label>
              <Select displayEmpty fullWidth name="CurrentLevel" value={formData.CurrentLevel} onChange={handleChange}>
                <MenuItem value="" disabled style={{ display: 'none' }}></MenuItem>
                <MenuItem value="A1">A1</MenuItem>
                <MenuItem value="A2">A2</MenuItem>
                <MenuItem value="B1">B1</MenuItem>
                <MenuItem value="B2">B2</MenuItem>
                <MenuItem value="C1">C1</MenuItem>
                <MenuItem value="C2">C2</MenuItem>
              </Select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Correo Electrónico</label>
              <TextField fullWidth placeholder="correo@ejemplo.com" type="email" name="Email" value={formData.Email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Número Telefónico</label>
              <TextField fullWidth placeholder="55 1234 5678" name="Phone" value={formData.Phone} onChange={handleChange} inputProps={{ maxLength: 10 }} />
            </div>
          </div>

          <div className="modal-actions">
            <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
            <Button onClick={handleRegistrar} variant="contained" className="btn-save">Registrar Estudiante</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}