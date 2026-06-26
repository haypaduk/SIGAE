/**
 * SIGAE - ADMIN - GESTIÓN DE MATERIAS
 * Archivo: frontend/js/admin/materias.js
 * 
 * Funciones para el CRUD de materias:
 * - Listar materias
 * - Crear materia
 * - Editar materia
 * - Eliminar materia
 */

// =====================================================
// VARIABLES
// =====================================================
let materiasData = [];
let carrerasData = [];

// =====================================================
// CARGAR SELECTS (Carreras)
// =====================================================
async function cargarSelects() {
    try {
        const res = await fetch('/api/admin/selects/materias');
        const data = await res.json();
        carrerasData = data.carreras;
        
        const carreraSelect = document.getElementById('materia-carrera');
        carreraSelect.innerHTML = '<option value="">Seleccionar carrera</option>' +
            carrerasData.map(c => 
                `<option value="${c.id_carrera}">${c.clave_carrera} - ${c.nombre_carrera}</option>`
            ).join('');
        
    } catch (error) {
        console.error('Error cargando selects:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// =====================================================
// CARGAR MATERIAS
// =====================================================
async function cargarMaterias() {
    try {
        const res = await fetch('/api/admin/materias');
        const materias = await res.json();
        materiasData = materias;
        mostrarMaterias(materias);
    } catch (error) {
        console.error('Error cargando materias:', error);
        document.getElementById('materias-table').innerHTML = 
            '<tr><td colspan="5" style="text-align:center;color:red;">Error al cargar materias</td></tr>';
        showToast('Error al cargar las materias', 'error');
    }
}

function mostrarMaterias(materias) {
    const tbody = document.getElementById('materias-table');
    if (!materias || materias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay materias registradas</td></tr>';
        return;
    }

    tbody.innerHTML = materias.map(m => `
        <tr>
            <td><strong>${m.clave}</strong></td>
            <td>${m.nombre}</td>
            <td>${m.clave_carrera || 'Sin asignar'}</td>
            <td>
                <span class="badge ${m.activo ? 'badge-success' : 'badge-danger'}">
                    ${m.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-warning" onclick="editarMateria(${m.id_materia})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="eliminarMateria(${m.id_materia})" title="Eliminar">
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
    document.getElementById('modal-title').textContent = 'Nueva Materia';
    document.getElementById('materia-id').value = '';
    document.getElementById('materia-clave').value = '';
    document.getElementById('materia-nombre').value = '';
    document.getElementById('materia-carrera').value = '';
    document.getElementById('materia-activo').value = '1';
    document.getElementById('materiaModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('materiaModal').classList.remove('active');
}

function editarMateria(id) {
    const materia = materiasData.find(m => m.id_materia === id);
    if (!materia) return;

    document.getElementById('modal-title').textContent = 'Editar Materia';
    document.getElementById('materia-id').value = materia.id_materia;
    document.getElementById('materia-clave').value = materia.clave;
    document.getElementById('materia-clave').readOnly = true;
    document.getElementById('materia-nombre').value = materia.nombre;
    document.getElementById('materia-carrera').value = materia.id_carrera || '';
    document.getElementById('materia-activo').value = materia.activo;
    document.getElementById('materiaModal').classList.add('active');
}

async function eliminarMateria(id) {
    const confirmado = await showConfirm('¿Estás seguro de eliminar esta materia?', null, null);
    if (!confirmado) return;

    try {
        const res = await fetch(`/api/admin/materias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Materia eliminada correctamente', 'success');
            cargarMaterias();
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
document.getElementById('materiaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('materia-id').value;
    const data = {
        clave: document.getElementById('materia-clave').value,
        nombre: document.getElementById('materia-nombre').value,
        id_carrera: parseInt(document.getElementById('materia-carrera').value),
        activo: parseInt(document.getElementById('materia-activo').value)
    };

    // Validaciones básicas
    if (!data.clave || !data.nombre || !data.id_carrera) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        let url = '/api/admin/materias';
        let method = 'POST';

        if (id) {
            url = `/api/admin/materias/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Materia actualizada correctamente' : 'Materia creada correctamente', 'success');
            cerrarModal();
            cargarMaterias();
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
    cargarMaterias();
});