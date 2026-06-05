import { createContext, useContext, useEffect, useRef, useCallback } from 'react';

/**
 * Todos los tipos de eventos SSE que existen en la plataforma.
 * Cuando el servidor manda "event: notificaciones", el EventSource
 * del navegador solo lo captura si hay un addEventListener para ese nombre exacto.
 * Por eso los registramos todos aquí de antemano.
 */
const ALL_EVENT_TYPES = [
    'logout',
    'notificaciones',
    'proximaSesion',
    'nuevaTarea',
    'calificacion',
    'tareaEntregada',
    'sessionAgendada',
    'bitacoraRevisada',
    'estadisticas',
    'alertasAdmin',
    'cursoCerrado',
    'bitacorasList',
    'visitasAgendadas',
    'tareaCalificada',
    'tareaAbierta',
    'reentrega',
];

const SSEContext = createContext(null);

export function SSEProvider({ children }) {
    // Referencia al EventSource activo (null si no hay sesión o está desconectado)
    const eventSourceRef = useRef(null);

    // Map de suscriptores: { 'notificaciones': Set([cb1, cb2]), 'logout': Set([cb3]) }
    // Usamos useRef para que no cause re-renders al cambiar
    const subscribersRef = useRef(new Map());

    // Para el backoff de reconexión: empieza en 1s, duplica hasta máx 30s
    const reconnectDelayRef = useRef(1000);
    const reconnectTimerRef = useRef(null);

    // Indicador para no reconectar si el usuario hizo logout intencionalmente
    const shouldConnectRef = useRef(false);

    /**
     * dispatch: cuando llega un evento SSE, llama a todos los callbacks
     * suscritos a ese tipo de evento.
     */
    const dispatch = useCallback((eventName, data) => {
        const callbacks = subscribersRef.current.get(eventName);
        console.log('[SSE dispatch]', eventName, '| subscribers:', callbacks?.size ?? 0);
        if (callbacks) {
            callbacks.forEach(cb => {
                try { cb(data); } catch (err) { console.error('[SSE] Error en callback:', err); }
            });
        }
    }, []);

    /**
     * connect: abre una conexión EventSource con el backend.
     * Es idempotente — si ya hay una conexión activa, no hace nada.
     */
    const connect = useCallback(() => {
        // Si ya hay conexión abierta, no abrir otra
        if (eventSourceRef.current) return;

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.ID) return; // sin sesión activa, nada que hacer

        shouldConnectRef.current = true;

        const url = `http://localhost:8000/api/sse/stream?userId=${user.ID}`;

        /**
         * EventSource es la API nativa del navegador para SSE.
         * Al instanciarla, el browser abre una conexión GET a esa URL
         * y la mantiene abierta indefinidamente.
         */
        const es = new EventSource(url);

        // Registrar un listener por cada tipo de evento conocido
        ALL_EVENT_TYPES.forEach(eventType => {
            es.addEventListener(eventType, (e) => {
                try {
                    const data = e.data ? JSON.parse(e.data) : {};
                    dispatch(eventType, data);
                } catch {
                    dispatch(eventType, {});
                }
            });
        });

        es.onopen = () => {
            console.log('[SSE] Conexión establecida');
            reconnectDelayRef.current = 1000; // resetear backoff al conectar bien
        };

        es.onerror = () => {
            // El EventSource nativo ya intenta reconectar solo, pero lo hacemos
            // nosotros manualmente para tener control sobre el backoff
            es.close();
            eventSourceRef.current = null;

            if (!shouldConnectRef.current) return; // fue un logout, no reconectar

            console.warn(`[SSE] Conexión perdida. Reconectando en ${reconnectDelayRef.current}ms...`);

            reconnectTimerRef.current = setTimeout(() => {
                // Backoff exponencial: 1s → 2s → 4s → 8s → ... → 30s máximo
                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
                connect();
            }, reconnectDelayRef.current);
        };

        eventSourceRef.current = es;
    }, [dispatch]);

    /**
     * disconnect: cierra la conexión SSE.
     * Se llama en logout (manual o forzado por el servidor).
     */
    const disconnect = useCallback(() => {
        shouldConnectRef.current = false;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        console.log('[SSE] Desconectado manualmente');
    }, []);

    /**
     * Escuchar eventos personalizados de window para saber cuándo
     * el usuario inicia o cierra sesión (disparados desde LoginPage y Sidebar).
     *
     *   window.dispatchEvent(new Event('fastalk:login'));   // en LoginPage tras login exitoso
     *   window.dispatchEvent(new Event('fastalk:logout'));  // en Sidebar tras logout
     */
    useEffect(() => {
        // Intento inicial al montar — funciona si el usuario ya estaba logueado
        // (recarga de página, volver de otra pestaña, etc.)
        connect();

        const handleLogin = () => {
            reconnectDelayRef.current = 1000;
            connect();
        };
        const handleLogout = () => disconnect();

        window.addEventListener('fastalk:login', handleLogin);
        window.addEventListener('fastalk:logout', handleLogout);

        return () => {
            window.removeEventListener('fastalk:login', handleLogin);
            window.removeEventListener('fastalk:logout', handleLogout);
            disconnect();
        };
    }, [connect, disconnect]);

    /**
     * subscribe: permite a un componente suscribirse a un tipo de evento.
     * Retorna una función de limpieza (unsubscribe).
     *
     * Uso: const unsub = subscribe('notificaciones', (data) => { ... });
     * En cleanup: unsub();
     */
    const subscribe = useCallback((eventName, callback) => {
        if (!subscribersRef.current.has(eventName)) {
            subscribersRef.current.set(eventName, new Set());
        }
        subscribersRef.current.get(eventName).add(callback);
        console.log(`[SSE subscribe] ${eventName} | total: ${subscribersRef.current.get(eventName).size}`);

        return () => {
            subscribersRef.current.get(eventName)?.delete(callback);
            console.log(`[SSE unsubscribe] ${eventName} | remaining: ${subscribersRef.current.get(eventName)?.size ?? 0}`);
        };
    }, []);

    return (
        <SSEContext.Provider value={{ subscribe, connect, disconnect }}>
            {children}
        </SSEContext.Provider>
    );
}

export function useSSEContext() {
    const ctx = useContext(SSEContext);
    if (!ctx) throw new Error('useSSEContext debe usarse dentro de <SSEProvider>');
    return ctx;
}