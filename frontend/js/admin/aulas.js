/**
 * SIGAE - ADMIN - GESTIÓN DE AULAS
 * Archivo: frontend/js/admin/aulas.js
 * 
 * Funciones para el CRUD de aulas:
 * - Listar aulas
 * - Crear aula
 * - Editar aula
 * - Eliminar aula
 */

// =====================================================
// VARIABLES
// =====================================================
let aulasData = [];
let selectsData = {};

// =====================================================
// CARGAR SELECTS
// =====================================================
async function cargarSelects() {
    try {
        const res = await fetch('/api/admin/selects/aulas');
        selectsData = await res.json();
        
        // Llenar selects del modal
        const edificioSelect = document.getElementById('aula-edificio');
        const tipoSelect = document.getElementById('aula-tipo');
        const carreraSelect = document.getElementById('aula-carrera');
        
        edificioSelect.innerHTML = '<option value="">Seleccionar edificio</option>' +
            selectsData.edificios.map(e => 
                `<option value="${e.id_edificio}">${e.nombre}</option>`
            ).join('');
        
        tipoSelect.innerHTML = '<option value="">Seleccionar tipo</option>' +
            selectsData.tipos.map(t => 
                `<option value="${t.id_tipo_aula}">${t.nombre_tipo}</option>`
            ).join('');
        
        carreraSelect.innerHTML = '<option value="">Sin asignar</option>' +
            selectsData.carreras.map(c => 
                `<option value="${c.id_carrera}">${c.clave_carrera} - ${c.nombre_carrera}</option>`
            ).join('');
        
    } catch (error) {
        console.error('Error cargando selects:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// =====================================================
// CARGAR AULAS
// =====================================================
async function cargarAulas() {
    try {
        const res = await fetch('/api/admin/aulas');
        const aulas = await res.json();
        aulasData = aulas;
        mostrarAulas(aulas);
    } catch (error) {
        console.error('Error cargando aulas:', error);
        document.getElementById('aulas-table').innerHTML = 
            '<tr><td colspan="7" style="text-align:center;color:red;">Error al cargar aulas</td></tr>';
        showToast('Error al cargar las aulas', 'error');
    }
}

function mostrarAulas(aulas) {
    const tbody = document.getElementById('aulas-table');
    if (!aulas || aulas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay aulas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = aulas.map(a => `
        <tr>
            <td><strong>${a.identificador}</strong></td>
            <td>${a.edificio_nombre || 'Sin edificio'}</td>
            <td>${a.tipo_nombre || 'Sin tipo'}</td>
            <td>${a.piso}</td>
            <td>${a.capacidad}</td>
            <td>${a.clave_carrera || 'Sin asignar'}</td>
            <td>
                <span class="badge ${a.activo ? 'badge-success' : 'badge-danger'}">
                    ${a.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-warning" onclick="editarAula(${a.id_aula})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="eliminarAula(${a.id_aula})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// =====================================================
// CREAR / EDITAR / ELIMINAR
// =====================================================
function abrirModalCrear() {
    document.getElementById('modal-title').textContent = 'Nueva Aula';
    document.getElementById('aula-id').value = '';
    document.getElementById('aula-identificador').value = '';
    document.getElementById('aula-edificio').value = '';
    document.getElementById('aula-tipo').value = '';
    document.getElementById('aula-piso').value = '';
    document.getElementById('aula-capacidad').value = '';
    document.getElementById('aula-carrera').value = '';
    document.getElementById('aula-activo').value = '1';
    document.getElementById('aulaModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('aulaModal').classList.remove('active');
}

function editarAula(id) {
    const aula = aulasData.find(a => a.id_aula === id);
    if (!aula) return;

    document.getElementById('modal-title').textContent = 'Editar Aula';
    document.getElementById('aula-id').value = aula.id_aula;
    document.getElementById('aula-identificador').value = aula.identificador;
    document.getElementById('aula-edificio').value = aula.id_edificio || '';
    document.getElementById('aula-tipo').value = aula.id_tipo_aula || '';
    document.getElementById('aula-piso').value = aula.piso;
    document.getElementById('aula-capacidad').value = aula.capacidad;
    document.getElementById('aula-carrera').value = aula.id_carrera || '';
    document.getElementById('aula-activo').value = aula.activo;
    document.getElementById('aulaModal').classList.add('active');
}

async function eliminarAula(id) {
    const confirmado = await showConfirm('¿Estás seguro de eliminar esta aula?', null, null);
    if (!confirmado) return;

    try {
        const res = await fetch(`/api/admin/aulas/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Aula eliminada correctamente', 'success');
            cargarAulas();
        } else {
            const data = await res.json();
            showToast(data.error || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

// =====================================================
// FORMULARIO
// =====================================================
document.getElementById('aulaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('aula-id').value;
    const data = {
        identificador: document.getElementById('aula-identificador').value,
        id_edificio: parseInt(document.getElementById('aula-edificio').value),
        id_tipo_aula: parseInt(document.getElementById('aula-tipo').value),
        piso: document.getElementById('aula-piso').value,
        capacidad: parseInt(document.getElementById('aula-capacidad').value),
        id_carrera_asignada: document.getElementById('aula-carrera').value ? 
            parseInt(document.getElementById('aula-carrera').value) : null,
        activo: parseInt(document.getElementById('aula-activo').value)
    };

    // Validaciones básicas
    if (!data.identificador || !data.id_edificio || !data.id_tipo_aula || !data.piso || !data.capacidad) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        let url = '/api/admin/aulas';
        let method = 'POST';

        if (id) {
            url = `/api/admin/aulas/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Aula actualizada correctamente' : 'Aula creada correctamente', 'success');
            cerrarModal();
            cargarAulas();
        } else {
            const error = await res.json();
            showToast(error.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
});

// =====================================================
// INICIALIZAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuario();
    cargarSelects();
    cargarAulas();
});