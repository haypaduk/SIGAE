/**
 * SIGAE - LÓGICA DE DASHBOARD
 * Archivo: frontend/js/dashboard.js
 * 
 * Funciones específicas para el dashboard:
 * - Cargar estadísticas desde el servidor
 * - Mostrar tarjetas de datos con íconos
 * - Cargar listas de alta demanda y subutilizadas
 * - Mostrar usuario en top bar
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
        const grid = document.getElementById('stats-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="stat-card">
                    <h3><i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> Error</h3>
                    <div class="stat-number">---</div>
                    <div class="stat-percent">No se pudieron cargar los datos</div>
                </div>
            `;
        }
    }
}

// =====================================================
// ACTUALIZAR TARJETAS DE ESTADÍSTICAS (CON ÍCONOS)
// =====================================================
function actualizarTarjetas(stats) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="stat-card">
            <h3><i class="fas fa-building" style="color: #8B1C2A;"></i> Total Espacios</h3>
            <div class="stat-number">${stats.total_espacios || 0}</div>
            <div class="stat-percent">${stats.total_edificios || 0} edificios registrados</div>
        </div>
        <div class="stat-card">
            <h3><i class="fas fa-check-circle" style="color: #27ae60;"></i> Disponibles</h3>
            <div class="stat-number">${stats.disponibles || 0}</div>
            <div class="stat-percent">${stats.porcentaje_disponibles || 0}% del total</div>
        </div>
        <div class="stat-card">
            <h3><i class="fas fa-clock" style="color: #f39c12;"></i> USO PARCIAL</h3>
            <div class="stat-number">${stats.uso_parcial || 0}</div>
            <div class="stat-percent">${stats.porcentaje_parcial || 0}% del total</div>
        </div>
        <div class="stat-card">
            <h3><i class="fas fa-times-circle" style="color: #e74c3c;"></i> OCUPADOS</h3>
            <div class="stat-number">${stats.ocupados || 0}</div>
            <div class="stat-percent">${stats.porcentaje_ocupados || 0}% del total</div>
        </div>
        <!-- ============================================================ -->
        <!-- TARJETA DE OCUPACIÓN GLOBAL (con círculo y colores en números) -->
        <!-- ============================================================ -->
        <div class="stat-card global-occupancy" id="global-occupancy-card">
            <h3><i class="fas fa-chart-simple" style="color: rgba(255,255,255,0.8);"></i> Ocupación Global</h3>
            <div class="global-occupancy-content">
                <div class="circle-container">
                    <div class="circle-progress" id="circle-progress">
                        <span class="circle-percentage" id="circle-percentage">${stats.porcentaje_global || 0}%</span>
                    </div>
                </div>
                <div class="status-indicators">
                    <div class="status-item">
                        <span class="status-dot green"></span>
                        <span class="status-label">Disponibles</span>
                        <span class="status-number green-text" id="status-disponibles">${stats.disponibles || 0} aulas</span>
                    </div>
                    <div class="status-item">
                        <span class="status-dot orange"></span>
                        <span class="status-label">Uso parcial</span>
                        <span class="status-number orange-text" id="status-parcial">${stats.uso_parcial || 0} aulas</span>
                    </div>
                    <div class="status-item">
                        <span class="status-dot red"></span>
                        <span class="status-label">Alta demanda</span>
                        <span class="status-number red-text" id="status-alta">${stats.ocupados || 0} aulas</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar el círculo con el porcentaje
    actualizarCirculo(stats.porcentaje_global || 0);
}

// =====================================================
// ACTUALIZAR CÍRCULO DE OCUPACIÓN GLOBAL
// =====================================================
function actualizarCirculo(porcentaje) {
    const circle = document.getElementById('circle-progress');
    const percentageText = document.getElementById('circle-percentage');
    
    if (!circle || !percentageText) return;
    
    const valor = Math.min(100, Math.max(0, porcentaje));
    
    circle.style.background = `conic-gradient(
        #27ae60 0% ${valor}%,
        rgba(255, 255, 255, 0.15) ${valor}% 100%
    )`;
    
    percentageText.textContent = `${valor}%`;
}

// =====================================================
// ACTUALIZAR LISTA DE ALTA DEMANDA (CON ÍCONOS)
// =====================================================
function actualizarAltaDemanda(aulas) {
    const container = document.getElementById('alta-demanda-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = '<p><i class="fas fa-check-circle" style="color: #27ae60;"></i> No hay aulas con alta demanda</p>';
        return;
    }
    
    container.innerHTML = aulas.map(aula => `
        <div class="aula-item">
            <div class="aula-info">
                <div class="aula-nombre"><i class="fas fa-fire" style="color: #e74c3c;"></i> ${aula.identificador}</div>
                <div class="aula-edificio"><i class="fas fa-building"></i> ${aula.edificio || 'Sin edificio'}</div>
            </div>
            <div class="aula-porcentaje high-demand">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

// =====================================================
// ACTUALIZAR LISTA DE SUBUTILIZADAS (CON ÍCONOS)
// =====================================================
function actualizarSubutilizadas(aulas) {
    const container = document.getElementById('subutilizadas-list');
    if (!container) return;
    
    if (!aulas || aulas.length === 0) {
        container.innerHTML = '<p><i class="fas fa-check-circle" style="color: #27ae60;"></i> No hay aulas subutilizadas</p>';
        return;
    }
    
    container.innerHTML = aulas.map(aula => `
        <div class="aula-item">
            <div class="aula-info">
                <div class="aula-nombre"><i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i> ${aula.identificador}</div>
                <div class="aula-edificio"><i class="fas fa-building"></i> ${aula.edificio || 'Sin edificio'}</div>
            </div>
            <div class="aula-porcentaje underutilized">${aula.porcentaje_ocupacion || 0}%</div>
        </div>
    `).join('');
}

// =====================================================
// ACTUALIZAR OCUPACIÓN POR EDIFICIO (CON ÍCONOS)
// =====================================================
function actualizarOcupacionEdificios(edificios) {
    const container = document.getElementById('ocupacion-edificios');
    if (!container) return;
    
    if (!edificios || edificios.length === 0) {
        container.innerHTML = '<p><i class="fas fa-building" style="color: #667eea;"></i> No hay datos de edificios</p>';
        return;
    }
    
    edificios.sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0));
    
    container.innerHTML = edificios.map(ed => `
        <div class="edificio-bar">
            <span class="nombre"><i class="fas fa-building" style="color: #667eea;"></i> ${ed.nombre}</span>
            <div class="barra">
                <div class="fill" style="width: ${ed.porcentaje || 0}%;"></div>
            </div>
            <span class="porcentaje">${ed.porcentaje || 0}%</span>
        </div>
    `).join('');
}

// =====================================================
// FUNCIÓN: Mostrar usuario en top bar
// =====================================================
function mostrarUsuario(nombre, avatar) {
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    
    if (!avatarEl || !nameEl) return;
    
    let nombreFinal = nombre;
    let avatarFinal = avatar;
    let carrerasTexto = '';
    
    if (!nombreFinal) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                nombreFinal = user.nombre || 'Usuario';
                
                if (user.rol === 'director' && user.carreras && user.carreras.length > 0) {
                    const claves = user.carreras.map(c => c.clave_carrera).join('/');
                    carrerasTexto = `<span class="carreras">(${claves})</span>`;
                }
                
                avatarFinal = user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';
            } catch (e) {
                nombreFinal = 'Usuario';
                avatarFinal = 'U';
            }
        } else {
            nombreFinal = 'Usuario';
            avatarFinal = 'U';
        }
    }
    
    if (!avatarFinal) {
        avatarFinal = nombreFinal.charAt(0).toUpperCase();
    }
    
    avatarEl.textContent = avatarFinal;
    
    if (carrerasTexto) {
        nameEl.innerHTML = `${nombreFinal} ${carrerasTexto}`;
    } else {
        nameEl.textContent = nombreFinal;
    }
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    cargarDashboard();
    
    if (localStorage.getItem('user')) {
        mostrarUsuario();
    }
});

// Recargar cada 30 segundos (opcional)
// setInterval(cargarDashboard, 30000);