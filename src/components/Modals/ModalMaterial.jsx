// src/components/Modals/ModalMaterial.jsx
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import '../../styles/Modals/Modales.css'; 

export default function ModalMaterial({ open, onClose }) {
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
        <Typography className="modal-title">Subir Nuevo Material</Typography>

        <form className="modal-form">
          
          {/* Título y Nivel */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Tema / Título del Material</label>
              <TextField fullWidth placeholder="Ej. Present Perfect Worksheet..." variant="outlined" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nivel Objetivo</label>
              <Select defaultValue="" displayEmpty fullWidth>
                <MenuItem value="" disabled>Selecciona...</MenuItem>
                <MenuItem value="A1">A1</MenuItem>
                <MenuItem value="A2">A2</MenuItem>
                <MenuItem value="B1">B1</MenuItem>
                <MenuItem value="B2">B2</MenuItem>
                <MenuItem value="C1">C1</MenuItem>
              </Select>
            </div>
          </div>

          {/* Idioma y Archivo */}
          <div className="form-row">
            <div className="form-group">
              <label>Idioma</label>
              <Select defaultValue="" displayEmpty fullWidth>
                <MenuItem value="" disabled>ej. Inglés</MenuItem>
                <MenuItem value="Ingles">Inglés</MenuItem>
                <MenuItem value="Frances">Francés</MenuItem>
              </Select>
            </div>
            <div className="form-group">
              <label>Archivo PDF</label>
              <TextField 
                fullWidth 
                type="file" 
                variant="outlined" 
                InputLabelProps={{ shrink: true }}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="modal-actions">
            <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
            <Button variant="contained" className="btn-save">Publicar Material</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}