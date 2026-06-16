/**
 * =====================================================
 * SIGAE - WEBSOCKETS (TIEMPO REAL)
 * Archivo: frontend/js/socket.js
 * =====================================================
 * 
 * Este archivo maneja la comunicación bidireccional con el servidor
 * usando Socket.IO (WebSockets).
 * 
 * ¿Para qué sirve?
 * - Notificaciones en tiempo real (campanita 🔔)
 * - Actualización automática de horarios cuando alguien edita/elimina
 * - Sin necesidad de recargar la página
 * 
 * Eventos que escucha:
 * - 'notificacion_nueva': Llega una solicitud o respuesta
 * - 'reserva_actualizada': Alguien modificó una reserva
 * 
 * =====================================================
 */

// Variable global que guarda la conexión del socket
let socket = null;

/**
 * Inicializa la conexión con el servidor WebSocket
 * Configura los event listeners para recibir actualizaciones en tiempo real
 * @returns {Socket} La conexión activa de Socket.IO
 */
function initSocket() {
    // Conectar al servidor (la URL es la misma que la página actual)
    socket = io();
    
    // =====================================================
    // EVENTO: Conexión exitosa
    // =====================================================
    socket.on('connect', () => {
        console.log('✅ Conectado al servidor SIGAE');
    });
    
    // =====================================================
    // EVENTO: Nueva notificación (solicitud pendiente o respuesta)
    // =====================================================
    socket.on('notificacion_nueva', (data) => {
        console.log('🔔 Nueva notificación:', data);
        
        // Actualizar el badge de la campanita (número rojo)
        updateNotificationBadge();
        
        // Mostrar notificación del sistema (si el usuario lo permitió)
        if (Notification.permission === 'granted') {
            new Notification(data.titulo, { body: data.mensaje });
        }
    });
    
    // =====================================================
    // EVENTO: Reserva actualizada (alguien editó/eliminó/creó)
    // =====================================================
    socket.on('reserva_actualizada', (data) => {
        console.log('🔄 Reserva actualizada:', data);
        
        // Si la página actual tiene una función refreshData(), la ejecuta
        // Esto permite que cada página recargue sus datos sin recargar toda la app
        if (window.refreshData) {
            window.refreshData();
        }
    });
    
    // =====================================================
    // EVENTO: Desconexión del servidor
    // =====================================================
    socket.on('disconnect', () => {
        console.log('⚠️ Desconectado del servidor');
    });
    
    return socket;
}

/**
 * Actualiza el badge (número rojo) de la campanita de notificaciones
 * Consulta al backend cuántas solicitudes pendientes tiene el usuario
 * 
 * El badge se muestra en el HTML con id="notif-count"
 * Si hay 0 notificaciones, se oculta
 */
function updateNotificationBadge() {
    // Obtener el token del localStorage para autenticación
    const token = localStorage.getItem('token');
    
    if (!token) return;
    
    // Consultar al backend el conteo de notificaciones pendientes
    fetch('/api/solicitudes/pendientes/count', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        const badge = document.getElementById('notif-count');
        if (badge) {
            const count = data.count || 0;
            badge.textContent = count;
            // Mostrar badge solo si hay notificaciones (>0)
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    })
    .catch(err => console.error('Error obteniendo notificaciones:', err));
}

/**
 * Solicitar permiso al usuario para mostrar notificaciones del sistema
 * Esto muestra un popup del navegador preguntando "¿Permitir notificaciones?"
 * 
 * Debe llamarse después de que el usuario haga clic en algún lado
 * (los navegadores bloquean notificaciones automáticas al cargar la página)
 */
function requestNotificationPermission() {
    if (Notification && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================
// Cuando el DOM esté completamente cargado, verificar si hay token
// Si el usuario está autenticado, conectar el WebSocket
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        initSocket();
    }
});