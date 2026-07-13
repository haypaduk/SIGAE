/**
 * SIGAE - FUNCIONES GLOBALES
 * Archivo: frontend/js/main.js
 * 
 * Funciones que se usan en TODAS las páginas:
 * - Logout
 * - Mostrar usuario en top bar (con foto de perfil)
 * - Notificaciones en tiempo real
 */

// =====================================================
// VARIABLES DE NOTIFICACIONES
// =====================================================
let notificacionesInterval = null;
let notificacionesTimeout = null;
let lastNotificationCount = 0;
let audioContext = null;

// =====================================================
// LOGOUT
// =====================================================
function logout() {
    localStorage.removeItem('user');
    detenerNotificaciones();
    window.location.href = '/login';
}

// =====================================================
// MOSTRAR USUARIO EN TOP BAR (con foto de perfil)
// =====================================================
function mostrarUsuario() {
    console.log('🔍 mostrarUsuario() ejecutada');
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        console.log('⚠️ No hay usuario en localStorage');
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        console.log('👤 Usuario:', user);
        
        let nombreCompleto = user.nombre || 'Usuario';
        let carrerasTexto = '';
        
        // Mostrar carreras si es director
        if (user.rol === 'director' && user.carreras && user.carreras.length > 0) {
            const claves = user.carreras.map(c => c.clave_carrera).join('/');
            carrerasTexto = `<span class="carreras">(${claves})</span>`;
        }
        
        // ===== ACTUALIZAR NOMBRE =====
        const nameElement = document.getElementById('user-name');
        if (nameElement) {
            nameElement.innerHTML = `${nombreCompleto} ${carrerasTexto}`;
            console.log('✅ Nombre actualizado');
        }
        
        // ===== ACTUALIZAR FOTO DE PERFIL =====
        const avatarElement = document.getElementById('user-avatar');
        if (!avatarElement) {
            console.log('❌ Elemento #user-avatar no encontrado');
            return;
        }
        
        // Si ya hay una imagen en el avatar, NO hacer nada
        if (avatarElement.querySelector('img')) {
            console.log('✅ Ya hay imagen en el avatar, no sobrescribir');
            return;
        }
        
        console.log('⚠️ No hay imagen, mostrando foto de perfil');
        
        const fotoPerfil = user.foto_perfil || '/img/avatar.png';
        console.log('📸 Foto de perfil:', fotoPerfil);
        
        // Limpiar y poner imagen
        avatarElement.innerHTML = '';
        avatarElement.style.cssText = 'width:38px;height:38px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:transparent;';
        
        const img = document.createElement('img');
        img.src = fotoPerfil;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
        img.onload = function() {
            console.log('✅ IMAGEN CARGADA EXITOSAMENTE');
        };
        img.onerror = function() {
            console.log('❌ ERROR: No se pudo cargar la imagen:', fotoPerfil);
            // Fallback: mostrar iniciales
            const inicial = user.nombre.charAt(0).toUpperCase();
            avatarElement.innerHTML = inicial;
            avatarElement.style.cssText = 'width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #6B1520, #5A0F18);color:white;font-weight:bold;font-size:0.9rem;text-transform:uppercase;';
        };
        avatarElement.appendChild(img);
        console.log('✅ Foto de perfil actualizada');
        
        // Iniciar notificaciones
        iniciarNotificaciones();
        
    } catch (error) {
        console.error('❌ Error mostrando usuario:', error);
    }
}

// =====================================================
// NOTIFICACIONES - SISTEMA COMPLETO
// =====================================================

/**
 * Iniciar el sistema de notificaciones
 */
function iniciarNotificaciones() {
    // Detener cualquier intervalo anterior
    detenerNotificaciones();
    
    // Obtener contador inicial
    actualizarContadorNotificaciones();
    
    // Configurar intervalo para verificar cada 15 segundos
    notificacionesInterval = setInterval(() => {
        actualizarContadorNotificaciones();
    }, 15000);
    
    console.log('🔔 Sistema de notificaciones iniciado');
}

/**
 * Detener el sistema de notificaciones
 */
function detenerNotificaciones() {
    if (notificacionesInterval) {
        clearInterval(notificacionesInterval);
        notificacionesInterval = null;
    }
    if (notificacionesTimeout) {
        clearTimeout(notificacionesTimeout);
        notificacionesTimeout = null;
    }
    console.log('🔕 Sistema de notificaciones detenido');
}

/**
 * Actualizar el contador de notificaciones
 */
async function actualizarContadorNotificaciones() {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        
        const response = await fetch('/api/solicitudes/pendientes/count', {
            headers: {
                'X-User-Id': user.id
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Error al obtener contador de notificaciones');
            return;
        }
        
        const data = await response.json();
        const count = data.count || 0;
        
        // Actualizar badge
        const badge = document.getElementById('notif-count');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
                badge.classList.add('show');
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                badge.classList.remove('show');
            }
        }
        
        // Si hay nuevas notificaciones, mostrar alerta
        if (count > lastNotificationCount && count > 0) {
            mostrarAlertaNotificacion(count);
            // Reproducir sonido (opcional)
            // reproducirSonidoNotificacion();
        }
        
        lastNotificationCount = count;
        
    } catch (error) {
        console.error('❌ Error al actualizar notificaciones:', error);
    }
}

/**
 * Mostrar alerta de nuevas notificaciones
 */
function mostrarAlertaNotificacion(count) {
    // Crear alerta visual en la campanita
    const notifications = document.getElementById('notifications');
    if (notifications) {
        // Efecto de pulso en la campanita
        notifications.style.animation = 'none';
        setTimeout(() => {
            notifications.style.animation = 'bellPulse 0.5s ease 3';
        }, 10);
    }
    
    // Mostrar toast de notificación
    const mensaje = count === 1 
        ? 'Tienes 1 nueva solicitud pendiente' 
        : `Tienes ${count} nuevas solicitudes pendientes`;
    
    // Usar showToast si existe
    if (typeof showToast === 'function') {
        showToast(mensaje, 'info', '🔔 Notificaciones');
    } else {
        // Fallback
        console.log('🔔', mensaje);
    }
}

/**
 * Reproducir sonido de notificación (Opcional)
 */
function reproducirSonidoNotificacion() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Crear un sonido simple de "ding"
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880; // Nota A5
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        // Silenciar errores de audio
        console.debug('🔇 Error al reproducir sonido:', error);
    }
}

/**
 * Verificar notificaciones manualmente (para usar en eventos)
 */
function verificarNotificaciones() {
    actualizarContadorNotificaciones();
}

// =====================================================
// MENÚ DINÁMICO - Mostrar Administración solo para admin
// =====================================================
function generarMenu() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    try {
        const user = JSON.parse(userStr);
        const menu = document.querySelector('.sidebar-menu');
        if (!menu) return;
        
        // Si es admin, agregar el ítem de Administración
        if (user.rol === 'admin') {
            let adminItem = menu.querySelector('.admin-menu-item');
            if (!adminItem) {
                const li = document.createElement('li');
                li.className = 'admin-menu-item';
                li.innerHTML = `<a href="/admin"><i class="fas fa-cogs"></i> Administración</a>`;
                
                // Insertar antes de "Cerrar Sesión"
                const cerrarItem = menu.querySelector('li:last-child');
                menu.insertBefore(li, cerrarItem);
            }
        } else {
            // Si es director, eliminar el ítem de Administración si existe
            const adminItem = menu.querySelector('.admin-menu-item');
            if (adminItem) {
                adminItem.remove();
            }
        }
    } catch (error) {
        console.error('Error generando menú:', error);
    }
}

// =====================================================
// NOTIFICACIONES CON WEBSOCKET (OPCIONAL - MEJORA FUTURA)
// =====================================================

// Si quieres implementar WebSocket para notificaciones en tiempo real,
// descomenta esta sección y configura tu servidor WebSocket

/*
let ws = null;

function conectarWebSocket() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    
    try {
        ws = new WebSocket(`ws://localhost:5000/ws?userId=${user.id}`);
        
        ws.onopen = function() {
            console.log('🔌 WebSocket conectado');
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'nueva_solicitud') {
                // Actualizar contador inmediatamente
                actualizarContadorNotificaciones();
            }
        };
        
        ws.onclose = function() {
            console.log('🔌 WebSocket desconectado');
            // Reconectar después de 5 segundos
            setTimeout(conectarWebSocket, 5000);
        };
        
        ws.onerror = function(error) {
            console.error('❌ Error en WebSocket:', error);
        };
    } catch (error) {
        console.error('❌ Error al conectar WebSocket:', error);
    }
}
*/

// =====================================================
// NOTIFICACIONES - EVENTO DE CLICK EN CAMPANITA
// =====================================================

// Al hacer clic en la campanita, redirigir a solicitudes
document.addEventListener('DOMContentLoaded', function() {
    const notifications = document.getElementById('notifications');
    if (notifications) {
        notifications.addEventListener('click', function() {
            // Redirigir a la página de solicitudes
            window.location.href = '/solicitudes';
        });
    }
});

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOMContentLoaded - main.js');
    if (localStorage.getItem('user')) {
        mostrarUsuario();
        generarMenu();
    }
});

window.addEventListener('load', function() {
    console.log('🔄 Window load - main.js');
    if (localStorage.getItem('user')) {
        mostrarUsuario();
        generarMenu();
    }
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('⚡ Ejecución inmediata - main.js');
    if (localStorage.getItem('user')) {
        mostrarUsuario();
        generarMenu();
    }
}