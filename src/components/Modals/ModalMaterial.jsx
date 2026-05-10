import { useState, useEffect } from 'react';
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select, FormControl } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';

import '../../styles/Modals/Modales.css'; 

export default function ModalMaterial({ open, onClose, onSuccess }) {
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [formData, setFormData] = useState({
    Topic: '',
    Level: '',
    Language: '',
    CourseID: ''
  });
  const [file, setFile] = useState(null);
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    if (open && user?.ID) {
      const fetchCursos = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/tutor/tutor-cursos/${user.ID}`);
          const data = await res.json();
          if (data.success) setCursos(data.cursos);
        } catch (error) {
          console.error(error);
        }
      };
      fetchCursos();
    } else {
      setFormData({ Topic: '', Level: '', Language: '', CourseID: '' });
      setFile(null);
    }
  }, [open, user?.ID]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCourseChange = (e) => {
    const selectedCourseId = e.target.value;
    const course = cursos.find(c => c.CourseID === selectedCourseId);
    
    if (course) {
        setFormData({
            ...formData,
            CourseID: selectedCourseId,
            Language: course.Language || '',
            Level: course.Level || ''
        });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!formData.Topic || !formData.CourseID || !file) {
      toast.error("Por favor completa el tema, selecciona un curso y adjunta un archivo.");
      return;
    }

    const loadingToast = toast.loading("Subiendo material al servidor...");

    try {
      const base64 = await convertBase64(file);
      
      const payload = {
        ...formData,
        TutorID: user.ID,
        fileBase64: base64,
        fileName: file.name,
        fileType: file.type
      };

      const response = await fetch("http://localhost:8000/api/tutor/materiales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Material publicado con éxito", { id: loadingToast });
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error("Error al subir material", { id: loadingToast });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
      <IconButton onClick={onClose} className="close-button">
        <CloseIcon />
      </IconButton>

      <div className="modal-content">
        <Typography className="modal-title">Subir Nuevo Material</Typography>

        <form className="modal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tema / Título del Material</label>
              <TextField name="Topic" value={formData.Topic} onChange={handleChange} fullWidth placeholder="Ej. Present Perfect Worksheet..." variant="outlined" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Asignar a Curso</label>
              <FormControl fullWidth>
                <Select name="CourseID" value={formData.CourseID} onChange={handleCourseChange} displayEmpty disabled={cursos.length === 0}>
                  <MenuItem value="" disabled>{cursos.length === 0 ? 'No tienes cursos activos' : 'Selecciona el curso'}</MenuItem>
                  {cursos.map(c => (
                    <MenuItem key={c.CourseID} value={c.CourseID}>
                      {c.Name} ({c.Language} - Nivel {c.Level})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Idioma Asignado</label>
              <TextField 
                fullWidth 
                value={formData.Language} 
                placeholder="Autocompletado..." 
                variant="outlined" 
                disabled 
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </div>
            <div className="form-group">
              <label>Nivel Objetivo</label>
              <TextField 
                fullWidth 
                value={formData.Level} 
                placeholder="Autocompletado..." 
                variant="outlined" 
                disabled 
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ width: '100%' }}>
              <label>Archivo PDF o Documento</label>
              <TextField fullWidth type="file" onChange={handleFileChange} variant="outlined" InputLabelProps={{ shrink: true }} inputProps={{ accept: '.pdf,.doc,.docx,.ppt,.pptx' }} />
            </div>
          </div>

          <div className="modal-actions">
            <Button onClick={onClose} className="btn-cancel">Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" className="btn-save">Publicar Material</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}