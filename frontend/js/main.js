/**
 * SIGAE - Archivo principal del frontend
 * Ubicación: frontend/js/main.js
 * 
 * Este archivo maneja:
 * - Navegación entre páginas
 * - Login de usuarios
 * - Dashboard (carga y actualización automática)
 * - Información del usuario en la barra superior
 * 
 * NOTA: El registro de usuarios se eliminó, los usuarios los crea el admin
 */

// =====================================================
// NAVEGACIÓN Y RUTAS
// =====================================================

// Mapeo de rutas a archivos HTML
const routes = {
    '/': 'pages/login.html',
    '/login': 'pages/login.html',
    '/dashboard': 'pages/dashboard.html',
    '/infraestructura': 'pages/infraestructura.html',
    '/solicitudes': 'pages/solicitudes.html',
    '/reportes': 'pages/reportes.html',
    '/configuracion': 'pages/configuracion.html'
};

/**
 * Carga una página dinámicamente sin recargar todo el sitio
 * @param {string} path - Ruta de la página a cargar
 */
async function loadPage(path) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;
    
    // Mostrar loading
    appDiv.innerHTML = '<div class="loading">Cargando SIGAE...</div>';
    
    // Obtener la ruta del archivo HTML
    const htmlPath = routes[path] || routes['/'];
    
    try {
        const response = await fetch(htmlPath);
        if (!response.ok) throw new Error('Página no encontrada');
        
        const html = await response.text();
        appDiv.innerHTML = html;
        
        // Actualizar URL sin recargar
        window.history.pushState({}, '', path);
        
        // Ejecutar scripts específicos de la página
        executePageScripts(path);
        
    } catch (error) {
        console.error('Error cargando página:', error);
        appDiv.innerHTML = '<div class="loading">Error al cargar la página</div>';
    }
}

/**
 * Ejecuta scripts específicos según la página cargada
 * @param {string} path - Ruta de la página actual
 */
function executePageScripts(path) {
    // Si es login, inicializar formulario
    if (path === '/login' || path === '/') {
        initLoginForm();
    }
    
    // Si es dashboard, inicializar
    if (path === '/dashboard') {
        displayUserInfo();
        window.loadDashboardData();
        startDashboardRefresh();
    } else {
        stopDashboardRefresh();
    }
}

// =====================================================
// LOGIN
// =====================================================

/**
 * Inicializa el formulario de login
 */
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            showAlert('Por favor llena todos los campos', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Guardar datos del usuario
                localStorage.setItem('user', JSON.stringify(data.user));
                showAlert('Inicio de sesión exitoso', 'success');
                
                // Redirigir al dashboard
                setTimeout(() => {
                    loadPage('/dashboard');
                }, 1000);
            } else {
                showAlert(data.error || 'Error al iniciar sesión', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión con el servidor', 'error');
        }
    });
}

/**
 * Muestra una alerta en la página
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success' o 'error'
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 3000);
}

// =====================================================
// DASHBOARD
// =====================================================

// Variable para el intervalo de recarga
let dashboardRefreshInterval = null;

/**
 * Carga los datos del dashboard
 */
window.loadDashboardData = async function() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (response.ok) {
            updateStatsCards(data.stats);
            updateAltaDemandaList(data.alta_demanda);
            updateSubutilizadasList(data.subutilizadas);
            console.log('✅ Dashboard actualizado');
        } else {
            console.error('Error:', data.error);
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
};

/**
 * Actualiza las tarjetas de estadísticas
 */
function updateStatsCards(stats) {
    if (!stats) return;
    
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <h3>Total Espacios</h3>
            <div class="stat-number">${stats.total_espacios || 0}</div>
            <div class="stat-percent">${stats.total_edificios || 0} edificios registrados</div>
        </div>
        <div class="stat-card">
            <h3>Disponibles</h3>
            <div class="stat-number">${stats.disponibles || 0}</div>
            <div class="stat-percent">${stats.porcentaje_disponibles || 0}% del total</div>
        </div>
        <div class="stat-card">
            <h3>USO PARCIAL</h3>
            <div class="stat-number">${stats.uso_parcial || 0}</div>
            <div class="stat-percent">${stats.porcentaje_parcial || 0}% del total</div>
        </div>
        <div class="stat-card">
            <h3>OCUPADOS</h3>
            <div class="stat-number">${stats.ocupados || 0}</div>
            <div class="stat-percent">${stats.porcentaje_ocupados || 0}% del total</div>
        </div>
        <div class="stat-card global-occupancy">
            <h3>Ocupación Global</h3>
            <div class="stat-number">${stats.porcentaje_global || 0}%</div>
            <div class="stat-percent">Estado actual en tiempo real</div>
        </div>
    `;
}

/**
 * Actualiza la lista de alta demanda
 */
function updateAltaDemandaList(aulas) {
    const container = document.getElementById('alta-demanda-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = '<p>No hay datos de alta demanda</p>';
        return;
    }
    
    container.innerHTML = aulas.map(aula => `
        <div class="aula-item">
            <div class="aula-info">
                <div class="aula-nombre">${aula.identificador}</div>
                <div class="aula-edificio">${aula.edificio || 'Sin edificio'}</div>
            </div>
            <div class="aula-porcentaje high-demand">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

/**
 * Actualiza la lista de subutilizadas
 */
function updateSubutilizadasList(aulas) {
    const container = document.getElementById('subutilizadas-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = '<p>No hay datos de aulas subutilizadas</p>';
        return;
    }
    
    container.innerHTML = aulas.map(aula => `
        <div class="aula-item">
            <div class="aula-info">
                <div class="aula-nombre">${aula.identificador}</div>
                <div class="aula-edificio">${aula.edificio || 'Sin edificio'}</div>
            </div>
            <div class="aula-porcentaje underutilized">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

// =====================================================
// INFORMACIÓN DEL USUARIO
// =====================================================

/**
 * Muestra información del usuario en la barra superior
 * Si es director, muestra la lista de sus carreras (IDS/RIC, etc.)
 */
function displayUserInfo() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    try {
        const user = JSON.parse(userStr);
        let displayName = user.nombre || user.nombre_completo || 'Usuario';
        
        // Si es director y tiene carreras, mostrarlas entre paréntesis
        if (user.rol === 'director' && user.carreras && user.carreras.length > 0) {
            // Obtener solo las claves de las carreras (IDS, RIC, etc.)
            const carrerasClaves = user.carreras.map(c => c.clave_carrera).join('/');
            displayName = `${displayName} (${carrerasClaves})`;
        }
        
        const userInitial = displayName.charAt(0).toUpperCase();
        
        const nameElement = document.getElementById('user-name');
        const avatarElement = document.getElementById('user-avatar');
        
        if (nameElement) nameElement.textContent = displayName;
        if (avatarElement) avatarElement.textContent = userInitial;
    } catch (error) {
        console.error('Error mostrando usuario:', error);
    }
}

// =====================================================
// RECARGA AUTOMÁTICA DEL DASHBOARD
// =====================================================

/**
 * Inicia la recarga automática del dashboard (cada 30 segundos)
 */
function startDashboardRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }
    dashboardRefreshInterval = setInterval(() => {
        // Solo recargar si estamos en el dashboard
        if (window.location.pathname === '/dashboard') {
            window.loadDashboardData();
        }
    }, 30000);
}

/**
 * Detiene la recarga automática
 */
function stopDashboardRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
        dashboardRefreshInterval = null;
    }
}

// =====================================================
// CERRAR SESIÓN
// =====================================================

/**
 * Cierra la sesión del usuario
 * Limpia localStorage y redirige al login
 */
window.logout = function() {
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Detener recarga automática del dashboard si está activa
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
        dashboardRefreshInterval = null;
    }
    
    // Redirigir al login
    loadPage('/login');
    
    // Opcional: recargar la página para resetear todo
    // window.location.reload();
};

// =====================================================
// INICIALIZACIÓN
// =====================================================

// Escuchar cambios en la navegación (botones atrás/adelante)
window.addEventListener('popstate', () => {
    loadPage(window.location.pathname);
});

// Cargar la página inicial al arrancar
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    loadPage(path);
});