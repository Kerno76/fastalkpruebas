require('dotenv').config();
const express = require('express');
const cors = require('cors');

const startAccountCleaner = require('./accountCleaner');
const startCourseMonitor = require('./courseMonitor');

const app = express();
app.use(cors());

app.use(express.json({ limit: '70mb' }));
app.use(express.urlencoded({ limit: '70mb', extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/tutor', require('./routes/tutor.routes'));
app.use('/api/revisor', require('./routes/reviewer.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/ai', require('./routes/ai.routes')); 

// Nueva ruta para SSE, que maneja conexiones persistentes para eventos en tiempo real
app.use('/api/sse', require('./routes/sse.routes'));

startAccountCleaner();
startCourseMonitor();

app.listen(process.env.PORT || 8000, () => {
    console.log(`Servidor de FasTalk corriendo en puerto 8000`);
});