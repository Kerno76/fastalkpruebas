import { useState, useEffect } from 'react';
import { Dialog, DialogContent, IconButton, Typography, TextField, Button, MenuItem, Select, OutlinedInput, Checkbox, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import '../../styles/Modals/Modales.css'; 

export default function ModalRevisor({ open, onClose }) {
  const [tutoresDisponibles, setTutoresDisponibles] = useState([]);
  const [formData, setFormData] = useState({
    Name: '',
    BirthDate: '',
    Email: '',
    Phone: '',
    Career: '', 
    AssignedTutors: [], 
    Notes: ''
  });

  const [tutorsLoaded, setTutorsLoaded] = useState(false);

  useEffect(() => {
    if (open && !tutorsLoaded) {
      const fetchTutores = async () => {
        try {
          const response = await fetch("http://localhost:8000/api/admin/tutores-sin-revisor");
          const data = await response.json();
          if (data.success && Array.isArray(data.tutores)) {
              setTutoresDisponibles(data.tutores);
          }
        } catch (error) {
          console.error("Error al obtener tutores:", error);
        }
      };
      fetchTutores();
      setTutorsLoaded(true);
    }
    
    if (!open && tutorsLoaded) {
      setTutorsLoaded(false);
    }
  }, [open, tutorsLoaded]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistrar = async () => {
    if (!formData.Name || !formData.Email || !formData.BirthDate || !formData.Phone || !formData.Career) {
      toast.error("Todos los campos (excepto Notas y Tutores Asignados) son obligatorios.");
      return;
    }

    const loadingToast = toast.loading('Registrando nuevo revisor...');

    try {
      const response = await fetch("http://localhost:8000/api/admin/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.Name,
          email: formData.Email,
          Phone: formData.Phone,
          BirthDate: formData.BirthDate,
          career: formData.Career, 
          assignedTutors: formData.AssignedTutors, 
          notes: formData.Notes,
          rol: "Reviewer"
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('¡Revisor registrado con éxito!', { id: loadingToast, icon: '🎓' });
        setFormData({ Name: '', BirthDate: '', Email: '', Phone: '', Career: '', AssignedTutors: [], Notes: '' });
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

      <DialogContent className="modal-content" style={{ padding: '20px 0 0 0', overflowY: 'auto' }}>
        <Typography className="modal-title">Nuevo Revisor</Typography>

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
              <label>Correo Electrónico</label>
              <TextField fullWidth placeholder="correo@ejemplo.com" type="email" name="Email" value={formData.Email} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Número Telefónico</label>
              <TextField fullWidth placeholder="55 1234 5678" name="Phone" value={formData.Phone} onChange={handleChange} inputProps={{ maxLength: 10 }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-mini-group">
              <label>Carrera (Siglas)</label>
              <TextField fullWidth placeholder="Ej. ITC, ISD" name="Career" value={formData.Career} onChange={handleChange} inputProps={{ maxLength: 6 }} />
            </div>
            <div className="form-group">
              <label>Notas (Opcional)</label>
              <TextField fullWidth placeholder="Ej. Límite de 3 tutores" name="Notes" value={formData.Notes} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ width: '100%' }}>
              <label>Tutores Asignados (Opcional)</label>
              <Select
                multiple
                fullWidth
                name="AssignedTutors"
                value={formData.AssignedTutors}
                onChange={handleChange}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  return tutoresDisponibles
                    .filter(tutor => selected.includes(tutor.ID))
                    .map(tutor => tutor.Name)
                    .join(', ');
                }}
              >
                {tutoresDisponibles.map((tutor) => (
                  <MenuItem key={tutor.ID} value={tutor.ID}>
                    <Checkbox checked={formData.AssignedTutors.indexOf(tutor.ID) > -1} />
                    <ListItemText primary={tutor.Name} />
                  </MenuItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="modal-actions" style={{ marginBottom: '10px' }}>
            <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
            <Button onClick={handleRegistrar} variant="contained" className="btn-save" style={{ backgroundColor: '#8a045d' }}>Registrar Revisor</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}