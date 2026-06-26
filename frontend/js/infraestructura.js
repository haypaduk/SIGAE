/**
 * SIGAE - LÓGICA DE INFRAESTRUCTURA
 * Archivo: frontend/js/infraestructura.js
 * 
 * Funciones específicas para la página de infraestructura:
 * - Cargar edificios desde el servidor
 * - Cargar aulas de un edificio al hacer clic
 * - Ver horario de un aula
 */

// =====================================================
// CARGAR EDIFICIOS
// =====================================================
async function cargarEdificios() {
    try {
        const res = await fetch('/api/infraestructura/edificios');
        const edificios = await res.json();
        
        const container = document.getElementById('edificios-container');
        
        if (!edificios || edificios.length === 0) {
            container.innerHTML = '<p>No hay edificios registrados</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="grid-edificios">
                ${edificios.map(e => `
                    <div class="edificio-card" onclick="cargarAulas(${e.id_edificio}, '${e.nombre}')">
                        <h3><i class="fas fa-building" style="color: #8B1C2A; margin-right: 8px;"></i>${e.nombre}</h3>
                        <p class="tipo"><i class="fas fa-tag" style="margin-right: 5px;"></i>${e.tipo_edificio}</p>
                        <p class="click-hint"><i class="fas fa-hand-pointer" style="margin-right: 5px;"></i>Haz clic para ver aulas</p>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando edificios:', error);
        document.getElementById('edificios-container').innerHTML = 
            '<p style="color: red;">❌ Error al cargar edificios</p>';
    }
}

// =====================================================
// CARGAR AULAS DE UN EDIFICIO
// =====================================================
async function cargarAulas(edificioId, edificioNombre) {
    try {
        // Mostrar sección de aulas
        const container = document.getElementById('aulas-container');
        container.innerHTML = `
            <h3><i class="fas fa-building" style="color: #8B1C2A; margin-right: 8px;"></i> ${edificioNombre} - Aulas</h3>
            <button class="btn-volver" onclick="volverAEdificios()">
                <i class="fas fa-arrow-left" style="margin-right: 5px;"></i> Volver a edificios
            </button>
            <div class="grid-aulas" id="aulas-grid">
                <p>Cargando aulas...</p>
            </div>
        `;
        
        const res = await fetch(`/api/infraestructura/edificios/${edificioId}/aulas`);
        const aulas = await res.json();
        
        const grid = document.getElementById('aulas-grid');
        
        if (!aulas || aulas.length === 0) {
            grid.innerHTML = '<p>No hay aulas en este edificio</p>';
            return;
        }
        
        grid.innerHTML = aulas.map(aula => {
            const porcentaje = aula.porcentaje_ocupacion || 0;
            let clasePorcentaje = 'baja';
            if (porcentaje >= 80) clasePorcentaje = 'alta';
            else if (porcentaje >= 50) clasePorcentaje = 'media';
            
            // Icono según el tipo de aula
            let iconoTipo = 'fa-chalkboard'; // Aula
            if (aula.tipo === 'Auditorio') iconoTipo = 'fa-users';
            else if (aula.tipo === 'Laboratorio') iconoTipo = 'fa-flask';
            
            return `
                <div class="aula-card">
                    <div class="header">
                        <h4><i class="fas ${iconoTipo}" style="color: #8B1C2A; margin-right: 8px;"></i>${aula.identificador}</h4>
                        <span class="porcentaje ${clasePorcentaje}">${porcentaje}%</span>
                    </div>
                    <p class="detalles"><i class="fas fa-layer-group" style="margin-right: 5px;"></i>${aula.piso} · <i class="fas fa-users" style="margin-right: 5px;"></i>${aula.capacidad} lugares</p>
                    <p class="tipo-aula"><i class="fas fa-tag" style="margin-right: 5px;"></i>${aula.tipo || 'Aula'} ${aula.carrera ? '· ' + aula.carrera : ''}</p>
                    <button class="btn-ver-horario" onclick="verHorario(${aula.id_aula})">
                        <i class="fas fa-calendar-alt" style="margin-right: 5px;"></i> Ver horario
                    </button>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error cargando aulas:', error);
        document.getElementById('aulas-container').innerHTML = 
            '<p style="color: red;">❌ Error al cargar aulas</p>';
    }
}

// =====================================================
// VOLVER A EDIFICIOS
// =====================================================
function volverAEdificios() {
    document.getElementById('aulas-container').innerHTML = '';
    // Recargar edificios para refrescar
    cargarEdificios();
}

// =====================================================
// VER HORARIO DE UN AULA
// =====================================================
function verHorario(aulaId) {
    console.log('📅 Ver horario del aula ID:', aulaId);
    
    // Cargar datos para reservas (materias, profesores, días, bloques)
    cargarDatosReservas().then(() => {
        // Cargar el horario del aula
        cargarHorario(aulaId);
    });
    
    // Abrir el modal de horario
    document.getElementById('horarioModal').classList.add('active');
}

function cerrarHorarioModal() {
    document.getElementById('horarioModal').classList.remove('active');
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuario();
    cargarEdificios();
});