/**
 * SIGAE - LÓGICA DE DASHBOARD
 * Archivo: frontend/js/dashboard.js
 * 
 * Funciones específicas para el dashboard:
 * - Cargar estadísticas desde el servidor
 * - Mostrar tarjetas de datos
 * - Cargar listas de alta demanda y subutilizadas
 */

// =====================================================
// CARGAR DASHBOARD
// =====================================================
async function cargarDashboard() {
    try {
        const res = await fetch('/api/dashboard/stats');
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
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        document.getElementById('stats-grid').innerHTML = 
            '<div class="stat-card">❌ Error al cargar datos</div>';
    }
}

// =====================================================
// ACTUALIZAR TARJETAS DE ESTADÍSTICAS
// =====================================================
function actualizarTarjetas(stats) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    
    grid.innerHTML = `
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
    `;

    // ===== ACTUALIZAR GRÁFICA DE OCUPACIÓN GLOBAL =====
    // Actualizar números
    const porcentajeGlobal = stats.porcentaje_global || 0;
    document.getElementById('global-percentage').textContent = `${porcentajeGlobal}%`;
    document.getElementById('disponibles-count').textContent = stats.disponibles || 0;
    document.getElementById('parcial-count').textContent = stats.uso_parcial || 0;
    document.getElementById('ocupados-count').textContent = stats.ocupados || 0;

    // Actualizar el círculo (conic-gradient)
    const circle = document.querySelector('.circle-progress');
    if (circle) {
        const disponibles = stats.disponibles || 0;
        const total = stats.total_espacios || 1;
        const porcentajeDisponibles = Math.round((disponibles / total) * 100);
        circle.style.background = `conic-gradient(
            #27ae60 0% ${porcentajeDisponibles}%,
            rgba(255, 255, 255, 0.15) ${porcentajeDisponibles}% 100%
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

// =====================================================
// ACTUALIZAR LISTA DE SUBUTILIZADAS
// =====================================================
function actualizarSubutilizadas(aulas) {
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
// ACTUALIZAR OCUPACIÓN POR EDIFICIO (barras)
// =====================================================
function actualizarOcupacionEdificios(edificios) {
    const container = document.getElementById('ocupacion-edificios');
    if (!container) return;
    
    if (!edificios || edificios.length === 0) {
        container.innerHTML = '<p>No hay datos de ocupación por edificio</p>';
        return;
    }
    
    container.innerHTML = edificios.map(ed => `
        <div class="edificio-bar">
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
    cargarDashboard();
});