import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';

import '../../styles/Modals/Modales.css'; 

export default function ModalTutor({ open, onClose }) {

  const handleRegistrar = () => {
    // Simulación de que algo está pasando
    const loadingToast = toast.loading('Registrando nuevo tutor...');

    // Restraso en el servidor para realismo lol
    setTimeout(() => {
      toast.dismiss(loadingToast); // Esto quita el mensaje de "cargando"
      
      toast.success('Tutor registrado con éxito!', {
        duration: 3000,
        icon: '🎓',
      });

      onClose();
      
    }, 2000);
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
              <TextField fullWidth placeholder="Escriba el nombre..." variant="outlined" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Idioma (Curso a Impartir)</label>
              <Select defaultValue="" displayEmpty fullWidth>
                <MenuItem value="" disabled>ej. Inglés</MenuItem>
                <MenuItem value="ingles">Inglés</MenuItem>
                <MenuItem value="frances">Francés</MenuItem>
              </Select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Correo Electrónico</label>
              <TextField fullWidth placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-group">
              <label>Número Telefónico</label>
              <TextField fullWidth placeholder="55 1234 5678" />
            </div>
          </div>

          <div className="form-group">
            <label>Hobbies (Tags)</label>
            <TextField fullWidth placeholder="Añadir hobbies..." />
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