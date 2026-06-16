/**
 * SIGAE - Módulo del Dashboard
 * Archivo: frontend/js/modules/dashboard.js
 * 
 * Este archivo contiene TODA la lógica del dashboard:
 * - Cargar estadísticas desde la API
 * - Actualizar tarjetas de datos
 * - Mostrar aulas de alta demanda
 * - Mostrar aulas subutilizadas
 * - Recarga automática cada 30 segundos
 */

// =====================================================
// VARIABLES GLOBALES DEL MÓDULO
// =====================================================

let refreshInterval = null;  // Para controlar el intervalo de actualización

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Inicializa el dashboard
 * - Carga datos iniciales
 * - Configura recarga automática
 * - Muestra información del usuario
 */
export async function initDashboard() {
    console.log('📊 Inicializando Dashboard...');
    
    // Cargar datos iniciales
    await loadDashboardData();
    
    // Configurar recarga automática cada 30 segundos
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(loadDashboardData, 30000);
    
    // Mostrar información del usuario
    displayUserInfo();
}

/**
 * Carga todos los datos del dashboard desde la API
 */
export async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (response.ok) {
            // Actualizar cada sección
            updateStatsCards(data.stats);
            updateHighDemandList(data.alta_demanda);
            updateUnderutilizedList(data.subutilizadas);
            
            console.log('✅ Dashboard actualizado');
        } else {
            console.error('Error en respuesta:', data.error);
            showError('Error al cargar datos del dashboard');
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showError('Error de conexión con el servidor');
    }
}

// =====================================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// =====================================================

/**
 * Actualiza las tarjetas de estadísticas
 * @param {Object} stats - Objeto con todas las estadísticas
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
 * Actualiza la lista de aulas de alta demanda
 * @param {Array} aulas - Lista de aulas con alto porcentaje
 */
function updateHighDemandList(aulas) {
    const container = document.getElementById('alta-demanda-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = '<p>No hay datos de alta demanda</p>';
        return;
    }
    
    container.innerHTML = aulas.map(aula => `
        <div class="aula-item">
            <div class="aula-info">
                <div class="aula-nombre">${escapeHtml(aula.identificador)}</div>
                <div class="aula-edificio">${escapeHtml(aula.edificio || 'Sin edificio')}</div>
            </div>
            <div class="aula-porcentaje high-demand">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

/**
 * Actualiza la lista de aulas subutilizadas
 * @param {Array} aulas - Lista de aulas con bajo porcentaje
 */
function updateUnderutilizedList(aulas) {
    const container = document.getElementById('subutilizadas-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = '<p>No hay datos de aulas subutilizadas</p>';
        return;
    }
    
    container.innerHTML = aulas.map(aula => `
        <div class="aula-item">
            <div class="aula-info">
                <div class="aula-nombre">${escapeHtml(aula.identificador)}</div>
                <div class="aula-edificio">${escapeHtml(aula.edificio || 'Sin edificio')}</div>
            </div>
            <div class="aula-porcentaje underutilized">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Muestra la información del usuario en la barra superior
 */
function displayUserInfo() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    try {
        const user = JSON.parse(userStr);
        const userName = user.nombre || user.nombre_completo || 'Usuario';
        const userInitial = userName.charAt(0).toUpperCase();
        
        const nameElement = document.getElementById('user-name');
        const avatarElement = document.getElementById('user-avatar');
        
        if (nameElement) nameElement.textContent = userName;
        if (avatarElement) avatarElement.textContent = userInitial;
    } catch (error) {
        console.error('Error parsing user info:', error);
    }
}

/**
 * Muestra un mensaje de error en la consola y en la UI
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    console.error(message);
    
    // Mostrar en la UI si hay un contenedor de errores
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid && statsGrid.innerHTML.includes('Cargando')) {
        statsGrid.innerHTML = `<div class="stat-card">❌ ${message}</div>`;
    }
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// =====================================================
// LIMPIEZA (para cuando se cambia de página)
// =====================================================

/**
 * Limpia los intervalos y recursos del módulo
 * Se llama cuando se sale del dashboard
 */
export function destroyDashboard() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    console.log('🧹 Dashboard destruido');
}