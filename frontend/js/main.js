/**
 * SIGAE - FUNCIONES GLOBALES
 * Archivo: frontend/js/main.js
 * 
 * Funciones que se usan en TODAS las páginas:
 * - Logout
 * - Mostrar usuario en top bar (con foto de perfil)
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
        
        // === NUEVO: Si ya hay una imagen en el avatar, NO hacer nada ===
        if (avatarElement.querySelector('img')) {
            console.log('✅ Ya hay imagen en el avatar, no sobrescribir');
            return;  // ← Salir sin hacer nada
        }
        
        console.log('⚠️ No hay imagen, mostrando foto de perfil');
        
        const fotoPerfil = user.foto_perfil || '/img/avatar.png';
        console.log('📸 Foto de perfil:', fotoPerfil);
        
        // === LIMPIAR Y PONER IMAGEN ===
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
        
    } catch (error) {
        console.error('❌ Error mostrando usuario:', error);
    }
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
            // Buscar si ya existe el ítem
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

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    generarMenu();
});

// =====================================================
// NOTIFICACIONES (placeholder)
// =====================================================
function mostrarNotificacion(mensaje) {
    console.log('🔔 Notificación:', mensaje);
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOMContentLoaded - main.js');
    if (localStorage.getItem('user')) {
        mostrarUsuario();
    }
});

window.addEventListener('load', function() {
    console.log('🔄 Window load - main.js');
    if (localStorage.getItem('user')) {
        mostrarUsuario();
    }
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('⚡ Ejecución inmediata - main.js');
    if (localStorage.getItem('user')) {
        mostrarUsuario();
    }
}