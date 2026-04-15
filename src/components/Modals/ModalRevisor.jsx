import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import '../../styles/Modals/Modales.css'; 

export default function ModalRevisor({ open, onClose }) {
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
        <Typography className="modal-title">Nuevo Revisor</Typography>

        <form className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre Completo</label>
              <TextField fullWidth placeholder="Escriba el nombre..." variant="outlined" />
            </div>
            <div className="form-mini-group">
              <label>Edad</label>
                <TextField fullWidth placeholder="Escribe la edad del revisor..." variant="outlined" />
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

          <div className="form-row">
            <div className="form-group">
              <label>Tutores Asignados</label>
              <Select defaultValue="" displayEmpty fullWidth>
                <MenuItem value="" disabled>ej. Antonio Martinez</MenuItem>
                <MenuItem value="Juan">Juan Gomez</MenuItem>
                <MenuItem value="Loami">Loami Sodi</MenuItem>
              </Select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Notas(Opcional)</label>
              <TextField fullWidth placeholder="Ej. Solo puede trabajar con una carga de 3 tutores por ahora" />
            </div>
          </div>

          <div className="modal-actions">
            <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
            <Button variant="contained" className="btn-save">Registrar Revisor</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}