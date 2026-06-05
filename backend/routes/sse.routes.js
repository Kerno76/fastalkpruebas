const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

/**
 * Map de conexiones activas: userId (string) -> res (objeto respuesta de Express)
 *
 * Es un singleton: todos los archivos que hagan require('../routes/sse.routes')
 * comparten ESTE MISMO Map en memoria porque Node cachea los módulos.
 * Eso es lo que permite que reviewer.routes.js o accountCleaner.js puedan
 * empujar eventos a usuarios conectados sin necesitar Redis ni nada externo.
 */
const activeConnections = new Map();

// GET /api/sse/stream?userId=XXX
router.get('/stream', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
    }

    // Validar que el usuario existe antes de abrir la conexión
    try {
        const { data: perfil, error } = await supabaseAdmin
            .from('UsersProfiles')
            .select('ID')
            .eq('ID', userId)
            .single();

        if (error || !perfil) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Error al validar usuario' });
    }

    // --- Headers obligatorios para SSE ---
    // text/event-stream le dice al navegador que esto es un stream de eventos
    res.setHeader('Content-Type', 'text/event-stream');
    // no-cache evita que el navegador o proxies guarden en caché la respuesta
    res.setHeader('Cache-Control', 'no-cache');
    // keep-alive mantiene la conexión TCP abierta
    res.setHeader('Connection', 'keep-alive');
    // X-Accel-Buffering: no es para nginx — evita que bufferee los eventos y los retenga
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders(); // ← fuerza el envío de headers inmediatamente

    // Primer mensaje: confirmar que la conexión se estableció
    // Los comentarios SSE empiezan con ":" y no se disparan como eventos en el cliente
    res.write(':ok\n\n');

    // Registrar esta conexión en el Map
    // Si el usuario ya tenía una conexión anterior (doble pestaña, etc.), se reemplaza
    activeConnections.set(String(userId), res);
    console.log(`[SSE] Conectado: ${userId} | Activas: ${activeConnections.size}`);

    // Heartbeat cada 25 segundos para mantener la conexión viva
    // Sin esto, proxies y firewalls cierran conexiones "inactivas"
    const heartbeat = setInterval(() => {
        res.write(':ping\n\n');
    }, 25000);

    // Cuando el cliente desconecta (cierra pestaña, pierde internet, hace logout)
    req.on('close', () => {
        clearInterval(heartbeat);
        activeConnections.delete(String(userId));
        console.log(`[SSE] Desconectado: ${userId} | Activas: ${activeConnections.size}`);
    });
});

/**
 * Función para enviar un evento SSE a un usuario específico.
 * Se importa y usa desde otros route files así:
 *
 *   const { sendSSEEvent } = require('./sse.routes');
 *   sendSSEEvent(receiverId, 'notificaciones', { count: 3 });
 *
 * El formato que genera es:
 *   event: notificaciones\n
 *   data: {"count":3}\n\n
 *
 * Retorna true si el usuario estaba conectado, false si no.
 */
const sendSSEEvent = (userId, eventName, data = {}) => {
    console.log(`[sendSSEEvent] userId=${userId} event=${eventName}`); // ← agrega
    const connection = activeConnections.get(String(userId));
    if (!connection) {
        console.log(`[sendSSEEvent] ⚠️ No hay conexión activa para userId=${userId}`);
        return;
    }
    try {
        connection.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof connection.flush === 'function') connection.flush(); // para compression middleware
        return true;
    } catch (err) {
        activeConnections.delete(String(userId));
        return false;
    }
};

module.exports = router;
module.exports.activeConnections = activeConnections;
module.exports.sendSSEEvent = sendSSEEvent;