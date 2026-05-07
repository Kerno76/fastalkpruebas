import { useState, useEffect } from 'react';
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select, Checkbox, ListItemText, OutlinedInput, Chip, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import '../../styles/Modals/Modales.css';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function ModalCursos({ open, onClose }) {
    const [formData, setFormData] = useState({
        Name: '',         
        Language: '',     
        Level: '',        
        Period: '',       
        TutorID: '',      
        StudentIDs: [],   
        StartDate: '',
        EndDate: ''
    });

    const [tutors, setTutors] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

    useEffect(() => {
        if (open) {
            const fetchDatosBase = async () => {
                try {
                    const resTutors = await fetch("http://localhost:8000/api/admin/tutores");
                    const dataTutors = await resTutors.json();
                    if (Array.isArray(dataTutors)) setTutors(dataTutors);

                    const resStudents = await fetch("http://localhost:8000/api/admin/estudiantes-disponibles");
                    const dataStudents = await resStudents.json();
                    if (Array.isArray(dataStudents)) setAvailableStudents(dataStudents);
                } catch (error) {
                    toast.error("Error al conectar con la base de datos.");
                }
            };
            fetchDatosBase();
        } else {
            setFormData({ Name: '', Language: '', Level: '', Period: '', TutorID: '', StudentIDs: [], StartDate: '', EndDate: '' });
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: typeof value === 'string' && name === 'StudentIDs' ? value.split(',') : value,
            };
            
            if (name === 'Language') {
                newState.StudentIDs = [];
                newState.TutorID = ''; 
            }
            if (name === 'Level') {
                newState.StudentIDs = [];
            }
            
            return newState;
        });
    };

    const handleRegistrar = async () => {
        if (!formData.Name || !formData.Language || !formData.Level || !formData.StartDate || !formData.EndDate || !formData.Period) {
            toast.error("Por favor, llena todos los campos obligatorios.");
            return;
        }

        const loadingToast = toast.loading('Creando curso y enrolando alumnos...');

        try {
            const response = await fetch("http://localhost:8000/api/admin/cursos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('¡Curso registrado con éxito!', { id: loadingToast, icon: '📚' });
                onClose();
            } else {
                toast.error(data.message || 'Error al registrar', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de conexión con el servidor', { id: loadingToast });
        }
    };

    const filteredStudents = availableStudents.filter(student => 
        student.Language === formData.Language && student.CurrentLevel === formData.Level
    );

    const filteredTutors = tutors.filter(tutor => {
        if (!formData.Language) return true;
        const rawTutor = tutor.Tutors || tutor.tutors || {};
        const tutorData = Array.isArray(rawTutor) ? rawTutor[0] : rawTutor;
        const tutorLang = tutorData.Language || tutorData.language || '';
        return tutorLang.toUpperCase() === formData.Language.toUpperCase();
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
            <IconButton onClick={onClose} className="close-button"><CloseIcon /></IconButton>

            <div className="modal-content">
                <Typography className="modal-title">Registrar Nuevo Curso</Typography>

                <form className="modal-form">
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
                            <label>Nivel del Curso</label>
                            <Select displayEmpty fullWidth name="Level" value={formData.Level} onChange={handleChange}>
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
                        <div className="form-group" style={{ width: '100%' }}>
                            <label>Tutor Asignado (Opcional)</label>
                            <Select displayEmpty fullWidth name="TutorID" value={formData.TutorID} onChange={handleChange} disabled={!formData.Language}>
                                <MenuItem value="" disabled style={{ display: 'none' }}>
                                    {!formData.Language ? 'Selecciona un idioma primero' : 'Selecciona un tutor titular'}
                                </MenuItem>
                                {filteredTutors.map((tutor) => (
                                    <MenuItem key={tutor.ID} value={tutor.ID}>{tutor.Name}</MenuItem>
                                ))}
                                {formData.Language && filteredTutors.length === 0 && (
                                    <MenuItem disabled>No hay tutores de {formData.Language} registrados</MenuItem>
                                )}
                            </Select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                            <label>Asignar Alumnos Disponibles (Sin Curso)</label>
                            <Select
                                labelId="mutiple-student-label"
                                multiple
                                fullWidth
                                displayEmpty
                                name="StudentIDs"
                                value={formData.StudentIDs}
                                onChange={handleChange}
                                input={<OutlinedInput />}
                                disabled={!formData.Language || !formData.Level}
                                renderValue={(selected) => {
                                    if (selected.length === 0) {
                                        return <em>{(!formData.Language || !formData.Level) ? 'Selecciona Idioma y Nivel primero' : 'Selecciona alumnos'}</em>;
                                    }
                                    return (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const studentName = availableStudents.find(s => s.ID === value)?.Name;
                                                return <Chip key={value} label={studentName} size="small" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }} />;
                                            })}
                                        </Box>
                                    );
                                }}
                                MenuProps={MenuProps}
                            >
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <MenuItem key={student.ID} value={student.ID}>
                                            <Checkbox checked={formData.StudentIDs.indexOf(student.ID) > -1} />
                                            <ListItemText primary={`${student.Name} (${student.CurrentLevel})`} />
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>
                                        <em>No hay alumnos de {formData.Language} {formData.Level} disponibles</em>
                                    </MenuItem>
                                )}
                            </Select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha de Inicio</label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker 
                                onChange={(newValue) => setFormData(prev => ({ ...prev, StartDate: newValue ? newValue.format('YYYY-MM-DD') : '' }))}
                                slotProps={{ textField: { fullWidth: true, variant: "outlined", placeholder: "MM/DD/YYYY" } }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div className="form-group">
                            <label>Fecha de Fin</label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker 
                                onChange={(newValue) => setFormData(prev => ({ ...prev, EndDate: newValue ? newValue.format('YYYY-MM-DD') : '' }))}
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