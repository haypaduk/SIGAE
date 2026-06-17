/**
 * SIGAE - FUNCIONES GLOBALES
 * Archivo: frontend/js/main.js
 * 
 * Funciones que se usan en TODAS las páginas:
 * - Logout
 * - Mostrar usuario en top bar
 * - Notificaciones (placeholder)
 */

// =====================================================
// LOGOUT
// =====================================================
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// =====================================================
// MOSTRAR USUARIO EN TOP BAR
// =====================================================
function mostrarUsuario() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    try {
        const user = JSON.parse(userStr);
        let nombreCompleto = user.nombre || 'Usuario';
        let carrerasTexto = '';
        
        // Si es director, mostrar sus carreras entre paréntesis
        if (user.rol === 'director' && user.carreras && user.carreras.length > 0) {
            const claves = user.carreras.map(c => c.clave_carrera).join('/');
            carrerasTexto = `<span class="carreras">(${claves})</span>`;
        }
        
        // Actualizar avatar con la inicial del nombre
        const inicial = nombreCompleto.charAt(0).toUpperCase();
        document.getElementById('user-avatar').textContent = inicial;
        
        // Actualizar nombre con las carreras (si aplica)
        document.getElementById('user-name').innerHTML = `${nombreCompleto} ${carrerasTexto}`;
        
    } catch (error) {
        console.error('Error mostrando usuario:', error);
    }
}

// =====================================================
// NOTIFICACIONES (placeholder)
// =====================================================
function mostrarNotificacion(mensaje) {
    // Por ahora solo muestra un alert
    // Después se conectará con WebSockets
    console.log('🔔 Notificación:', mensaje);
    // alert('🔔 ' + mensaje);
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    // Si hay usuario en localStorage, mostrarlo
    if (localStorage.getItem('user')) {
        mostrarUsuario();
    }
});