/**
 * SIGAE - LÓGICA DE INFRAESTRUCTURA
 * Archivo: frontend/js/infraestructura.js
 */

let edificiosData = [];
let aulasData = [];
let edificioSeleccionado = null;
let filtroActual = 'todas';
let estadoActual = 'todos';

// =====================================================
// CARGAR EDIFICIOS
// =====================================================
async function cargarEdificios() {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const res = await fetch('/api/infraestructura/edificios', {
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        edificiosData = await res.json();
        
        const container = document.getElementById('edificios-container');
        
        if (!edificiosData || edificiosData.length === 0) {
            container.innerHTML = '<p>No hay edificios registrados</p>';
            return;
        }
        
        const totalEdificios = edificiosData.length;
        const totalAulas = edificiosData.reduce((sum, e) => sum + (e.total_aulas || 0), 0);
        
        container.innerHTML = `
            <div class="edificios-header">
                <div class="edificios-stats">
                    <span class="stat"><strong>${totalEdificios}</strong> edificios</span>
                    <br>
                    <span class="stat"><strong>${totalAulas}</strong> aulas totales</span>
                </div>
            </div>
            <div class="edificios-grid">
                ${edificiosData.map(e => `
                    <div class="edificio-card ${edificioSeleccionado === e.id_edificio ? 'active' : ''}" 
                         data-id="${e.id_edificio}"
                         onclick="seleccionarEdificio(${e.id_edificio})">
                        <div class="edificio-nombre"><i class="fas fa-building" style="color: #8B1C2A; margin-right: 6px;"></i>${e.nombre}</div>
                        <div class="edificio-espacios">${e.total_aulas || 0} espacios</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        if (edificiosData.length > 0 && !edificioSeleccionado) {
            seleccionarEdificio(edificiosData[0].id_edificio);
        }
        
    } catch (error) {
        console.error('Error cargando edificios:', error);
        document.getElementById('edificios-container').innerHTML = 
            '<p style="color: red;">❌ Error al cargar edificios</p>';
    }
}

// =====================================================
// SELECCIONAR EDIFICIO
// =====================================================
async function seleccionarEdificio(edificioId) {
    edificioSeleccionado = edificioId;
    
    const cards = document.querySelectorAll('.edificio-card');
    cards.forEach(card => {
        card.classList.remove('active');
        if (card.dataset.id == edificioId) {
            card.classList.add('active');
        }
    });
    
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const res = await fetch(`/api/infraestructura/edificio/${edificioId}/detalle`, {
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        const data = await res.json();
        
        aulasData = data.aulas || [];
        
        mostrarResumen(data);
        mostrarAulas(aulasData);
        
    } catch (error) {
        console.error('Error cargando aulas:', error);
        document.getElementById('aulas-container').innerHTML = 
            '<p style="color: red;">❌ Error al cargar las aulas</p>';
    }
}

// =====================================================
// MOSTRAR RESUMEN DEL EDIFICIO
// =====================================================
function mostrarResumen(data) {
    const container = document.getElementById('aulas-container');
    if (!container) return;
    
    const total = data.total_aulas || 0;
    const libres = data.libres || 0;
    const parciales = data.parciales || 0;
    const ocupados = data.ocupados || 0;
    
    let html = `
        <div class="edificio-resumen">
            <div class="resumen-header">
                <h3><i class="fas fa-building"></i> ${data.edificio_nombre}</h3>
                <div class="resumen-stats">
                    <span class="stat-total">${total} espacios</span>
                </div>
            </div>
            <div class="resumen-estados">
                <span class="estado-libre"><span class="dot green"></span> ${libres} libres</span>
                <span class="estado-parcial"><span class="dot orange"></span> ${parciales} parciales</span>
                <span class="estado-ocupado"><span class="dot red"></span> ${ocupados} ocupados</span>
            </div>
        </div>
    `;
    
    html += `
        <div class="filtros-container">
            <button class="filtro-btn ${filtroActual === 'todas' ? 'active' : ''}" onclick="aplicarFiltro('todas')">
                <i class="fas fa-layer-group"></i> Todas las plantas
            </button>
            <button class="filtro-btn ${filtroActual === 'baja' ? 'active' : ''}" onclick="aplicarFiltro('baja')">
                <i class="fas fa-arrow-down"></i> Planta Baja
            </button>
            <button class="filtro-btn ${filtroActual === 'alta' ? 'active' : ''}" onclick="aplicarFiltro('alta')">
                <i class="fas fa-arrow-up"></i> Planta Alta
            </button>
            <span class="filtro-separador">|</span>
            <button class="filtro-btn ${estadoActual === 'todos' ? 'active' : ''}" onclick="aplicarEstado('todos')">
                <i class="fas fa-check-circle"></i> Todos
            </button>
            <button class="filtro-btn ${estadoActual === 'libre' ? 'active' : ''}" onclick="aplicarEstado('libre')">
                <i class="fas fa-circle" style="color: #2ecc71;"></i> Libre
            </button>
            <button class="filtro-btn ${estadoActual === 'parcial' ? 'active' : ''}" onclick="aplicarEstado('parcial')">
                <i class="fas fa-circle" style="color: #f39c12;"></i> Parcial
            </button>
            <button class="filtro-btn ${estadoActual === 'ocupado' ? 'active' : ''}" onclick="aplicarEstado('ocupado')">
                <i class="fas fa-circle" style="color: #e74c3c;"></i> Ocupado
            </button>
        </div>
    `;
    
    html += `<div id="aulas-grid"></div>`;
    
    container.innerHTML = html;
}

// =====================================================
// MOSTRAR AULAS (con filtros)
// =====================================================
function mostrarAulas(aulas) {
    const grid = document.getElementById('aulas-grid');
    if (!grid) return;
    
    let aulasFiltradas = [...aulas];
    
    if (filtroActual === 'baja') {
        aulasFiltradas = aulasFiltradas.filter(a => a.piso === 'Planta Baja');
    } else if (filtroActual === 'alta') {
        aulasFiltradas = aulasFiltradas.filter(a => a.piso === 'Planta Alta');
    }
    
    if (estadoActual === 'libre') {
        aulasFiltradas = aulasFiltradas.filter(a => a.porcentaje_ocupacion === 0 || a.porcentaje_ocupacion < 20);
    } else if (estadoActual === 'parcial') {
        aulasFiltradas = aulasFiltradas.filter(a => a.porcentaje_ocupacion >= 20 && a.porcentaje_ocupacion < 80);
    } else if (estadoActual === 'ocupado') {
        aulasFiltradas = aulasFiltradas.filter(a => a.porcentaje_ocupacion >= 80);
    }
    
    if (!aulasFiltradas || aulasFiltradas.length === 0) {
        grid.innerHTML = '<p class="no-aulas">No hay aulas que coincidan con los filtros seleccionados.</p>';
        return;
    }
    
    grid.innerHTML = aulasFiltradas.map(aula => {
        const porcentaje = aula.porcentaje_ocupacion || 0;
        let estado = 'libre';
        let estadoLabel = 'Disponible';
        if (porcentaje >= 80) {
            estado = 'ocupado';
            estadoLabel = 'Alta Demanda';
        } else if (porcentaje >= 20) {
            estado = 'parcial';
            estadoLabel = 'Uso Parcial';
        }
        
        const iconoTipo = aula.tipo === 'Auditorio' ? 'fa-users' : 
                         aula.tipo === 'Laboratorio' ? 'fa-flask' : 'fa-chalkboard';
        
        return `
            <div class="aula-item ${estado}" data-id="${aula.id_aula}">
                <div class="aula-header">
                    <span class="aula-nombre"><i class="fas ${iconoTipo}"></i> ${aula.identificador}</span>
                    <span class="aula-porcentaje ${estado}">${porcentaje}%</span>
                </div>
                <div class="aula-detalles">
                    <span class="aula-capacidad"><i class="fas fa-users"></i> ${aula.capacidad} lug.</span>
                    <span class="aula-estado ${estado}">${estadoLabel}</span>
                </div>
                <div class="aula-piso">
                    <i class="fas fa-layer-group"></i> ${aula.piso}
                </div>
                <button class="btn-ver-horario" onclick="verHorario(${aula.id_aula})">
                    <i class="fas fa-calendar-alt"></i> Ver horario
                </button>
            </div>
        `;
    }).join('');
}

// =====================================================
// FILTROS
// =====================================================
function aplicarFiltro(filtro) {
    filtroActual = filtro;
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        if (btn.textContent.includes('Todas') || btn.textContent.includes('Planta')) {
            btn.classList.remove('active');
        }
    });
    const btns = document.querySelectorAll('.filtro-btn');
    const indices = {
        'todas': 0,
        'baja': 1,
        'alta': 2
    };
    if (indices[filtro] !== undefined) {
        btns[indices[filtro]]?.classList.add('active');
    }
    
    mostrarAulas(aulasData);
}

function aplicarEstado(estado) {
    estadoActual = estado;
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        if (btn.textContent.includes('Todos') || btn.textContent.includes('Libre') || 
            btn.textContent.includes('Parcial') || btn.textContent.includes('Ocupado')) {
            btn.classList.remove('active');
        }
    });
    const btns = document.querySelectorAll('.filtro-btn');
    const indices = {
        'todos': 3,
        'libre': 4,
        'parcial': 5,
        'ocupado': 6
    };
    if (indices[estado] !== undefined) {
        btns[indices[estado]]?.classList.add('active');
    }
    
    mostrarAulas(aulasData);
}

// =====================================================
// VER HORARIO DE UN AULA
// =====================================================
function verHorario(aulaId) {
    console.log('📅 Ver horario del aula ID:', aulaId);
    
    document.getElementById('horarioModal').classList.add('active');
    
    cargarDatosReservas().then(() => {
        cargarHorario(aulaId);
    }).catch(error => {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar el horario', 'error');
    });
}

// =====================================================
// IMPRIMIR HORARIO
// =====================================================
function imprimirHorario() {
    const contenido = document.getElementById('horario-container');
    if (!contenido) return;
    
    // Crear una ventana de impresión
    const ventana = window.open('', '_blank', 'width=1200,height=800');
    if (!ventana) {
        showToast('Por favor, permite las ventanas emergentes para imprimir', 'warning');
        return;
    }
    
    // Construir el contenido para imprimir
    const titulo = document.getElementById('horario-titulo').textContent || 'Horario';
    const aulaInfo = document.querySelector('.horario-aula-info');
    const tabla = contenido.querySelector('.horario-table');
    
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${titulo}</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; }
                h2 { color: #691c32; text-align: center; margin-bottom: 20px; }
                .info { display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap; }
                .info-item { text-align: center; }
                .info-item label { color: #999; font-size: 0.8rem; display: block; }
                .info-item value { font-weight: bold; font-size: 1rem; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #691c32; color: white; padding: 10px; text-align: center; border: 1px solid #691c32; }
                td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                .hora { background: #f8f9fa; font-weight: bold; }
                .ocupado { background: #fce4ec; }
                .disponible { background: #e8f5e9; }
                .leyenda { margin-top: 20px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 0.8rem; }
                .leyenda-item { display: flex; align-items: center; gap: 5px; }
                .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
                .dot-green { background: #27ae60; }
                .dot-red { background: #e74c3c; }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h2>${titulo}</h2>
            <div class="info">
                ${aulaInfo ? aulaInfo.innerHTML : ''}
            </div>
            ${tabla ? tabla.outerHTML : '<p>No hay datos de horario disponibles</p>'}
            <div class="leyenda">
                <span class="leyenda-item"><span class="dot dot-green"></span> Disponible</span>
                <span class="leyenda-item"><span class="dot dot-red"></span> Ocupado</span>
            </div>
            <p style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8rem;">
                ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 30px; background: #691c32; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Imprimir
                </button>
            </div>
            <script>
                // Auto-imprimir después de cargar
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    
    ventana.document.close();
}


// =====================================================
// CERRAR MODAL DE HORARIO (GLOBAL)
// =====================================================
window.cerrarHorarioModal = function() {
    const modal = document.getElementById('horarioModal');
    if (modal) {
        modal.classList.remove('active');
    }
    console.log('🔒 Modal de horario cerrado');
};

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuario();
    cargarEdificios();
});