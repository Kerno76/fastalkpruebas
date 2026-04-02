import '../styles/HistorialSesiones.css';
import '../styles/App.css';

// Tabla
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Box, Typography, Button, IconButton 
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

function createData(date, tutorName, studentName, topic, duration, actions){
  return {date, tutorName, studentName, topic, duration, actions}
}

const datosEjemplo = [
  { id: 1, fecha: '2026-03-28', tutor: 'Ing. Javi', estudiante: 'Alan R.', tema: 'React Hooks', duracion: '45 min' },
  { id: 2, fecha: '2026-03-29', tutor: 'Lic. Maria', estudiante: 'Paco G.', tema: 'PostgreSQL basics', duracion: '60 min' },
];

export default function HistorialSesiones() {
  return (
    <div className="histo">
      <h2 id="Title">Historial de Sesiones</h2>
      <p className="dashboard-subtitle">Bienvenido, tus últimas sesiones desglosadas aquí mismo</p>

      {/*Haremos los cambios dentro de los componentes usando el atajo sx para evitar conflictos de preferencias*/}

      <Box className='sess' sx={{ mt: 4, mb: 4 }}>
        <TableContainer component={Paper} sx={{ 
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)', 
            borderRadius: '16px', 
            overflow: 'hidden'
          }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead className='cabecera'>
              <TableRow>
                <TableCell className='headerText'>Fecha</TableCell>
                <TableCell className='headerText'>Nombre del Tutor</TableCell>
                <TableCell className='headerText'>Nombre del Estudiante</TableCell>
                <TableCell className='headerText'>Tema</TableCell>
                <TableCell className='headerText'>Duración</TableCell>
                <TableCell className='headerText'>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datosEjemplo.map((row) => (
                <TableRow key={row.id} className="fila-cuerpo">
                  <TableCell>{row.fecha}</TableCell>
                  <TableCell>{row.tutor}</TableCell>
                  <TableCell>{row.estudiante}</TableCell>
                  <TableCell className="tema-destacado">{row.tema}</TableCell>
                  <TableCell>{row.duracion}</TableCell>
                  <TableCell>
                    <IconButton color="primary">
                      <SearchIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}