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
                        <h3>${e.nombre}</h3>
                        <p class="tipo">${e.tipo_edificio}</p>
                        <p class="click-hint">👆 Haz clic para ver aulas</p>
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
            <h3>🏢 ${edificioNombre} - Aulas</h3>
            <button class="btn-volver" onclick="volverAEdificios()">⬅ Volver a edificios</button>
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
            
            return `
                <div class="aula-card">
                    <div class="header">
                        <h4>${aula.identificador}</h4>
                        <span class="porcentaje ${clasePorcentaje}">${porcentaje}%</span>
                    </div>
                    <p class="detalles">${aula.piso} · ${aula.capacidad} lugares</p>
                    <p class="tipo-aula">${aula.tipo || 'Aula'} ${aula.carrera ? '· ' + aula.carrera : ''}</p>
                    <button class="btn-ver-horario" onclick="verHorario(${aula.id_aula})">
                        📅 Ver horario
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
    
    // Por ahora, modal simple
    // Después se implementará el horario completo
    alert(`📅 Horario del aula ID: ${aulaId}\n\n(Próximamente se mostrará el horario con materias, profesores y grupos)`);
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuario();
    cargarEdificios();
});