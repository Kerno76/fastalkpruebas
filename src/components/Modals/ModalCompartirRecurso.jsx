import { useState, useEffect } from 'react';
import { Dialog, IconButton, Typography, TextField, Button, MenuItem, Select, FormControl } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';

import '../../styles/Modals/Modales.css'; 

export default function ModalCompartirRecurso({ isOpen, onClose, studentId, tutorId, onUploadSuccess }) {
    const [formData, setFormData] = useState({ nombre: '', tipo: 'link', url: '' });
    const [archivo, setArchivo] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({ nombre: '', tipo: 'link', url: '' });
            setArchivo(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setArchivo(e.target.files[0]); };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre.trim()) return toast.error("El título es obligatorio.");
        if (formData.tipo === 'link' && !formData.url.trim()) return toast.error("Debes ingresar una URL.");
        if (formData.tipo !== 'link' && !archivo) return toast.error("Selecciona un archivo.");

        setIsSubmitting(true);
        const loadingToast = toast.loading("Compartiendo recurso...");

        try {
            let payload = { TutorID: tutorId, StudentID: studentId, Name: formData.nombre.trim(), Type: formData.tipo };

            if (formData.tipo === 'link') {
                payload.LinkUrl = formData.url.trim();
            } else {
                payload.fileBase64 = await fileToBase64(archivo);
                payload.fileName = archivo.name;
                payload.fileType = archivo.type;
            }

            const response = await fetch("http://localhost:8000/api/tutor/compartir-recurso", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                onUploadSuccess();
                toast.dismiss(loadingToast);
            } else throw new Error(data.message);
        } catch (error) {
            toast.error(error.message || "Error al subir el material", { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'modal-container' }}>
            <IconButton onClick={onClose} className="close-button" disabled={isSubmitting}><CloseIcon /></IconButton>
            <div className="modal-content">
                <Typography className="modal-title">Compartir Recurso Extra</Typography>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Título del Material</label>
                        <TextField name="nombre" value={formData.nombre} onChange={handleChange} fullWidth placeholder="Ej. Artículo de apoyo" variant="outlined" size="small" disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label>Tipo de Recurso</label>
                        <FormControl fullWidth size="small">
                            <Select name="tipo" value={formData.tipo} onChange={handleChange} disabled={isSubmitting}>
                                <MenuItem value="link">Enlace (Página Web, Video)</MenuItem>
                                <MenuItem value="pdf">Documento PDF</MenuItem>
                                <MenuItem value="doc">Documento Word / PPT</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                    <div className="form-group">
                        <label>{formData.tipo === 'link' ? 'URL del Enlace' : 'Selecciona el Archivo'}</label>
                        {formData.tipo === 'link' ? (
                            <TextField name="url" value={formData.url} onChange={handleChange} fullWidth placeholder="https://..." variant="outlined" size="small" type="url" disabled={isSubmitting} />
                        ) : (
                            <TextField fullWidth type="file" onChange={handleFileChange} variant="outlined" size="small" disabled={isSubmitting} InputLabelProps={{ shrink: true }} inputProps={{ accept: '.pdf,.doc,.docx,.ppt,.pptx' }} />
                        )}
                    </div>
                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <Button onClick={onClose} className="btn-cancel" disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" variant="contained" className="btn-save" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Compartir con Alumno'}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
}