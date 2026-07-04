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
        // Obtener el usuario autenticado
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        // Enviar el ID del usuario en la petición
        const res = await fetch('/api/dashboard/stats', {
            method: 'GET',
            headers: {
                'X-User-Id': user ? user.id : '1'  // Enviar ID del usuario
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
    
    // Si no hay stats o no hay espacios, mostrar mensaje
    if (!stats || stats.total_espacios === 0) {
        grid.innerHTML = `
            <div class="stat-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>📊 Sin datos disponibles</h3>
                <p style="color: #999; margin-top: 10px;">No hay aulas registradas en tu carrera.</p>
                <p style="color: #999; font-size: 0.9rem;">Contacta al administrador para asignar aulas a tu carrera.</p>
            </div>
        `;
        
        // Resetear la tarjeta de ocupación global
        document.getElementById('global-percentage').textContent = '0%';
        document.getElementById('disponibles-count').textContent = '0';
        document.getElementById('parcial-count').textContent = '0';
        document.getElementById('ocupados-count').textContent = '0';
        return;
    }
    
    const esAdmin = stats.total_edificios !== undefined;
    
    if (esAdmin) {
        // ADMIN
        grid.innerHTML = `
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
        // DIRECTOR
        grid.innerHTML = `
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
    
    // ===== ACTUALIZAR LA TARJETA DE OCUPACIÓN GLOBAL =====
    const porcentajeGlobal = stats.porcentaje_global || 0;
    const disponibles = stats.disponibles || 0;
    const usoParcial = esAdmin ? (stats.uso_parcial || 0) : 0;
    const ocupados = stats.ocupados || 0;
    
    document.getElementById('global-percentage').textContent = `${porcentajeGlobal}%`;
    document.getElementById('disponibles-count').textContent = disponibles;
    document.getElementById('parcial-count').textContent = usoParcial;
    document.getElementById('ocupados-count').textContent = ocupados;
    
    // Actualizar el círculo
    const circle = document.querySelector('.circle-progress');
    if (circle) {
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
        container.innerHTML = `
            <p style="color: #999; text-align: center; padding: 20px;">
                <i class="fas fa-building" style="display: block; font-size: 2rem; margin-bottom: 10px; color: #ddd;"></i>
                No hay datos de ocupación por edificio
            </p>
        `;
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