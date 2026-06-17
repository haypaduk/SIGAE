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
// MOSTRAR USUARIO EN TOP BAR (con carreras para director)
// =====================================================
function mostrarUsuario(nombre = null, avatar = null) {
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    
    // Si no hay elementos en el DOM, salir
    if (!avatarEl || !nameEl) return;
    
    // Si se pasan parámetros, usarlos; si no, usar localStorage
    let nombreFinal = nombre;
    let avatarFinal = avatar;
    let carrerasTexto = '';
    
    if (!nombreFinal) {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            avatarEl.textContent = 'U';
            nameEl.textContent = 'Usuario';
            return;
        }
        
        try {
            const user = JSON.parse(userStr);
            nombreFinal = user.nombre || 'Usuario';
            
            // ===== IMPORTANTE: CARRERAS PARA DIRECTOR =====
            if (user.rol === 'director' && user.carreras && user.carreras.length > 0) {
                const claves = user.carreras.map(c => c.clave_carrera).join('/');
                carrerasTexto = `<span class="carreras">(${claves})</span>`;
            }
            
            avatarFinal = user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';
        } catch (error) {
            console.error('Error mostrando usuario:', error);
            nombreFinal = 'Usuario';
            avatarFinal = 'U';
        }
    }
    
    // Si no viene avatar, generarlo
    if (!avatarFinal) {
        avatarFinal = nombreFinal.charAt(0).toUpperCase();
    }
    
    // Asignar al DOM
    avatarEl.textContent = avatarFinal;
    
    // Si hay carreras, mostrarlas como HTML; si no, solo el nombre
    if (carrerasTexto) {
        nameEl.innerHTML = `${nombreFinal} ${carrerasTexto}`;
    } else {
        nameEl.textContent = nombreFinal;
    }
}

// =====================================================
// NOTIFICACIONES (placeholder)
// =====================================================
function mostrarNotificacion(mensaje) {
    console.log('🔔 Notificación:', mensaje);
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('user')) {
        mostrarUsuario();
    }
});