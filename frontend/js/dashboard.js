/**
 * SIGAE - LÓGICA DE DASHBOARD
 * Archivo: frontend/js/dashboard.js
 * 
 * Funciones específicas para el dashboard:
 * - Cargar estadísticas desde el servidor
 * - Mostrar tarjetas de datos
 * - Cargar listas de alta demanda y subutilizadas
 * - Animaciones y mejoras UI/UX
 */

// =====================================================
// CARGAR DASHBOARD
// =====================================================
async function cargarDashboard() {
    try {
        // Mostrar loading
        mostrarLoading(true);
        
        // Obtener el usuario autenticado
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        // Enviar el ID del usuario en la petición
        const res = await fetch('/api/dashboard/stats', {
            method: 'GET',
            headers: {
                'X-User-Id': user ? user.id : '1',
                'Cache-Control': 'no-cache'
            }
        });
        const data = await res.json();
        
        if (data.stats) {
            actualizarTarjetas(data.stats);
        }
        
        if (data.alta_demanda) {
            actualizarAltaDemanda(data.alta_demanda);
        }
        
        if (data.subutilizadas) {
            actualizarSubutilizadas(data.subutilizadas);
        }
        
        if (data.ocupacion_edificios) {
            actualizarOcupacionEdificios(data.ocupacion_edificios);
        }
        
        mostrarLoading(false);
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        mostrarLoading(false);
        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3><i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i> Error al cargar datos</h3>
                <p style="color: #999; margin-top: 10px;">${error.message || 'Error de conexión con el servidor'}</p>
                <button onclick="cargarDashboard()" class="btn-primary" style="margin-top: 15px; padding: 8px 20px;">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// =====================================================
// MOSTRAR LOADING
// =====================================================
function mostrarLoading(show) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    
    if (show && !grid.querySelector('.loading-state')) {
        grid.innerHTML = `
            <div class="stat-card loading-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div class="spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f1f3f5; border-top-color: #8B1C2A; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="color: #999; margin-top: 12px;">Cargando datos...</p>
            </div>
        `;
    }
}

// =====================================================
// ACTUALIZAR TARJETAS DE ESTADÍSTICAS
// =====================================================
function actualizarTarjetas(stats) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    
    // Si no hay stats o no hay espacios, mostrar mensaje
    if (!stats || stats.total_espacios === 0) {
        grid.innerHTML = `
            <div class="stat-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div class="empty-state-dashboard">
                    <i class="fas fa-building"></i>
                    <h4>Sin datos disponibles</h4>
                    <p>No hay aulas registradas en tu carrera.</p>
                    <p style="font-size: 0.85rem; color: #adb5bd;">Contacta al administrador para asignar aulas a tu carrera.</p>
                </div>
            </div>
        `;
        
        // Resetear la tarjeta de ocupación global
        actualizarGlobal(0, 0, 0, 0);
        return;
    }
    
    const esAdmin = stats.total_edificios !== undefined;
    
    let html = '';
    
    if (esAdmin) {
        // ADMIN - 4 tarjetas
        html = `
            <div class="stat-card">
                <h3><i class="fas fa-building"></i> Total Espacios</h3>
                <div class="stat-number">${stats.total_espacios || 0}</div>
                <div class="stat-percent">${stats.total_edificios || 0} edificios registrados</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-check-circle"></i> Disponibles</h3>
                <div class="stat-number">${stats.disponibles || 0}</div>
                <div class="stat-percent">${stats.porcentaje_disponibles || 0}% del total</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-clock"></i> USO PARCIAL</h3>
                <div class="stat-number">${stats.uso_parcial || 0}</div>
                <div class="stat-percent">${stats.porcentaje_parcial || 0}% del total</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-user"></i> OCUPADOS</h3>
                <div class="stat-number">${stats.ocupados || 0}</div>
                <div class="stat-percent">${stats.porcentaje_ocupados || 0}% del total</div>
            </div>
        `;
    } else {
        // DIRECTOR - 3 tarjetas
        html = `
            <div class="stat-card">
                <h3><i class="fas fa-building"></i> Mis Espacios</h3>
                <div class="stat-number">${stats.total_espacios || 0}</div>
                <div class="stat-percent">Aulas de tu carrera</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-check-circle"></i> Disponibles</h3>
                <div class="stat-number">${stats.disponibles || 0}</div>
                <div class="stat-percent">Aulas sin reservas</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-user"></i> Ocupados</h3>
                <div class="stat-number">${stats.ocupados || 0}</div>
                <div class="stat-percent">Aulas con reservas activas</div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
    
    // Actualizar tarjeta global
    const disponibles = stats.disponibles || 0;
    const usoParcial = esAdmin ? (stats.uso_parcial || 0) : 0;
    const ocupados = stats.ocupados || 0;
    const total = stats.total_espacios || 1;
    
    actualizarGlobal(disponibles, usoParcial, ocupados, total);
}

// =====================================================
// ACTUALIZAR TARJETA GLOBAL
// =====================================================
function actualizarGlobal(disponibles, usoParcial, ocupados, total) {
    const porcentajeDisponibles = total > 0 ? Math.round((disponibles / total) * 100) : 0;
    
    // Actualizar porcentaje
    const globalEl = document.getElementById('global-percentage');
    if (globalEl) {
        globalEl.textContent = `${porcentajeDisponibles}%`;
        // Animación del número
        globalEl.style.transition = 'all 0.5s ease';
    }
    
    // Actualizar contadores
    const disponiblesEl = document.getElementById('disponibles-count');
    const parcialEl = document.getElementById('parcial-count');
    const ocupadosEl = document.getElementById('ocupados-count');
    
    if (disponiblesEl) disponiblesEl.textContent = disponibles;
    if (parcialEl) parcialEl.textContent = usoParcial;
    if (ocupadosEl) ocupadosEl.textContent = ocupados;
    
    // Actualizar el círculo
    const circle = document.querySelector('.circle-progress');
    if (circle) {
        const safePercentage = Math.min(Math.max(porcentajeDisponibles, 0), 100);
        circle.style.background = `conic-gradient(
            #27ae60 0% ${safePercentage}%,
            rgba(255, 255, 255, 0.15) ${safePercentage}% 100%
        )`;
    }
}

// =====================================================
// ACTUALIZAR LISTA DE ALTA DEMANDA
// =====================================================
function actualizarAltaDemanda(aulas) {
    const container = document.getElementById('alta-demanda-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = `
            <div class="empty-state-dashboard" style="padding: 20px;">
                <i class="fas fa-fire" style="font-size: 2rem;"></i>
                <p style="margin-top: 8px;">No hay datos de alta demanda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = aulas.map((aula, index) => `
        <div class="aula-item" style="animation: slideIn 0.3s ease ${index * 0.05}s both;">
            <div class="aula-info">
                <div class="aula-nombre">${aula.identificador || 'N/A'}</div>
                <div class="aula-edificio">${aula.edificio || 'Sin edificio'}</div>
            </div>
            <div class="aula-porcentaje high-demand">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

// =====================================================
// ACTUALIZAR LISTA DE SUBUTILIZADAS
// =====================================================
function actualizarSubutilizadas(aulas) {
    const container = document.getElementById('subutilizadas-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = `
            <div class="empty-state-dashboard" style="padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                <p style="margin-top: 8px;">No hay datos de aulas subutilizadas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = aulas.map((aula, index) => `
        <div class="aula-item" style="animation: slideIn 0.3s ease ${index * 0.05}s both;">
            <div class="aula-info">
                <div class="aula-nombre">${aula.identificador || 'N/A'}</div>
                <div class="aula-edificio">${aula.edificio || 'Sin edificio'}</div>
            </div>
            <div class="aula-porcentaje underutilized">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

// =====================================================
// ACTUALIZAR OCUPACIÓN POR EDIFICIO (barras)
// =====================================================
function actualizarOcupacionEdificios(edificios) {
    const container = document.getElementById('ocupacion-edificios');
    if (!container) return;
    
    if (!edificios || edificios.length === 0) {
        container.innerHTML = `
            <div class="empty-state-dashboard" style="padding: 20px;">
                <i class="fas fa-building" style="font-size: 2rem;"></i>
                <p style="margin-top: 8px;">No hay datos de ocupación por edificio</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = edificios.map((ed, index) => `
        <div class="edificio-bar" style="animation: slideIn 0.3s ease ${index * 0.08}s both;">
            <span class="nombre">${ed.nombre}</span>
            <div class="barra">
                <div class="fill" style="width: ${ed.porcentaje || 0}%;"></div>
            </div>
            <span class="porcentaje">${ed.porcentaje || 0}%</span>
        </div>
    `).join('');
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOMContentLoaded - Dashboard');
    
    // Mostrar usuario
    if (typeof mostrarUsuario === 'function') {
        mostrarUsuario();
    }
    
    // Cargar dashboard
    cargarDashboard();
    
    // Agregar animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-10px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});