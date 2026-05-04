import { useState } from 'react';
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import '../../styles/Modals/Modales.css';

export default function ModalCurso({ open, onClose }) {

    const [formData, setFormData] = useState({
        Name: '',         // ej. 'B1 Grupo 1'
        Language: '',     // 'Inglés' o 'Francés'
        StartDate: '',
        EndDate: '',
        Period: '',       // ej. 'Feb - Jun'
        TutorID: ''       // FK del tutor
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegistrar = async () => {
        // Validación básica de campos
        if (!formData.Name || !formData.Language || !formData.StartDate || !formData.EndDate || !formData.Period) {
        toast.error("Por favor, llena todos los campos obligatorios.");
        return;
        }

        const loadingToast = toast.loading('Registrando nuevo curso...');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
        <IconButton onClick={onClose} className="close-button"><CloseIcon /></IconButton>

        <div className="modal-content">
            <Typography className="modal-title">Registrar Nuevo Curso</Typography>

            <form className="modal-form">
            
            {/* Fila 1: Nombre y Periodo */}
            <div className="form-row">
                <div className="form-group">
                <label>Nombre del Curso</label>
                <TextField fullWidth placeholder="ej. B1 Grupo 1" variant="outlined" name="Name" value={formData.Name} onChange={handleChange} />
                </div>
                
                <div className="form-mini-group">
                <label>Periodo</label>
                <TextField fullWidth placeholder="ej. Feb - Jun" variant="outlined" name="Period" value={formData.Period} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                <label>Idioma</label>
                <Select displayEmpty fullWidth name="Language" value={formData.Language} onChange={handleChange}>
                    <MenuItem value="" disabled style={{ display: 'none' }}></MenuItem>
                    <MenuItem value="Inglés">Inglés</MenuItem>
                    <MenuItem value="Francés">Francés</MenuItem>
                </Select>
                </div>
                
                <div className="form-group">
                <label>Tutor Asignado (Opcional)</label>
                <Select displayEmpty fullWidth name="TutorID" value={formData.TutorID} onChange={handleChange}>
                    <MenuItem value="" disabled style={{ display: 'none' }}>Selecciona un tutor</MenuItem>
                    <MenuItem value="1">Mario Alejandro</MenuItem>
                    <MenuItem value="2">Elvis Alain</MenuItem>
                    <MenuItem value="3">Sin Asignar</MenuItem>
                </Select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                <label>Fecha de Inicio</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                    onChange={(newValue) => setFormData({ ...formData, StartDate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                    slotProps={{ textField: { fullWidth: true, variant: "outlined", placeholder: "MM/DD/YYYY" } }}
                    />
                </LocalizationProvider>
                </div>

                <div className="form-group">
                <label>Fecha de Fin</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                    onChange={(newValue) => setFormData({ ...formData, EndDate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                    slotProps={{ textField: { fullWidth: true, variant: "outlined", placeholder: "MM/DD/YYYY" } }}
                    />
                </LocalizationProvider>
                </div>
            </div>

            <div className="modal-actions">
                <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
                <Button onClick={handleRegistrar} variant="contained" className="btn-save">Guardar Curso</Button>
            </div>
            </form>
        </div>
        </Dialog>
    );
    }