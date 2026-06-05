import { useEffect, useRef } from 'react';
import { useSSEContext } from '../context/SSEContext';

/**
 * Hook para suscribirse a un evento SSE desde cualquier componente.
 *
 * Uso:
 *   useSSE('notificaciones', (data) => {
 *       fetchNotificaciones(); // o cualquier cosa que quieras hacer
 *   });
 *
 * - Se limpia automáticamente cuando el componente se desmonta.
 * - Usa una ref para el callback, así el componente puede usar variables
 *   del estado sin necesidad de incluir el callback en las dependencias
 *   del useEffect (evita el problema de stale closures).
 *
 * @param {string} eventName - Nombre del evento SSE (ej: 'notificaciones')
 * @param {function} callback - Función que se ejecuta cuando llega el evento.
 *                              Recibe el `data` del evento (objeto parseado).
 */
export function useSSE(eventName, callback) {
    const { subscribe } = useSSEContext();
    
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        console.log('[useSSE] registering:', eventName); // ← agrega
        const stableHandler = (data) => callbackRef.current(data);
        const unsubscribe = subscribe(eventName, stableHandler);
        return () => {
            console.log('[useSSE] cleanup:', eventName); // ← agrega
            unsubscribe();
        };
    }, [eventName, subscribe]);
}