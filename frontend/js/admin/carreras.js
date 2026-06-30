/**
 * SIGAE - ADMIN - GESTIÓN DE CARRERAS
 * Archivo: frontend/js/admin/carreras.js
 * 
 * Funciones para el CRUD de carreras:
 * - Listar carreras
 * - Crear carrera
 * - Editar carrera
 * - Eliminar carrera
 */

// =====================================================
// VARIABLES
// =====================================================
let carrerasData = [];

// =====================================================
// CARGAR CARRERAS
// =====================================================
async function cargarCarreras() {
    try {
        const res = await fetch('/api/admin/carreras');
        const carreras = await res.json();
        carrerasData = carreras;
        mostrarCarreras(carreras);
    } catch (error) {
        console.error('Error cargando carreras:', error);
        document.getElementById('carreras-table').innerHTML = 
            '<tr><td colspan="4" style="text-align:center;color:red;">Error al cargar carreras</td></tr>';
        showToast('Error al cargar las carreras', 'error');
    }
}

function mostrarCarreras(carreras) {
    const tbody = document.getElementById('carreras-table');
    if (!carreras || carreras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay carreras registradas</td></tr>';
        return;
    }

    tbody.innerHTML = carreras.map(c => `
        <tr>
            <td><strong>${c.clave_carrera}</strong></td>
            <td>${c.nombre_carrera}</td>
            <td>
                <span class="badge ${c.activo ? 'badge-success' : 'badge-danger'}">
                    ${c.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-warning" onclick="editarCarrera(${c.id_carrera})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="eliminarCarrera(${c.id_carrera})">
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
    document.getElementById('modal-title').textContent = 'Nueva Carrera';
    document.getElementById('carrera-id').value = '';
    document.getElementById('carrera-clave').value = '';
    document.getElementById('carrera-nombre').value = '';
    document.getElementById('carrera-activo').value = '1';
    
    // FORZAR eliminación del atributo readonly
    const claveInput = document.getElementById('carrera-clave');
    claveInput.removeAttribute('readonly');
    claveInput.readOnly = false;
    
    document.getElementById('carreraModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('carreraModal').classList.remove('active');
}

function editarCarrera(id) {
    const carrera = carrerasData.find(c => c.id_carrera === id);
    if (!carrera) return;

    document.getElementById('modal-title').textContent = 'Editar Carrera';
    document.getElementById('carrera-id').value = carrera.id_carrera;
    document.getElementById('carrera-clave').value = carrera.clave_carrera;
    // document.getElementById('carrera-clave').readOnly = true; -- Eliminado para permitir edición de clave
    document.getElementById('carrera-nombre').value = carrera.nombre_carrera;
    document.getElementById('carrera-activo').value = carrera.activo;
    document.getElementById('carreraModal').classList.add('active');
}

async function eliminarCarrera(id) {
    if (!confirm('¿Estás seguro de eliminar esta carrera?')) return;

    try {
        const res = await fetch(`/api/admin/carreras/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Carrera eliminada correctamente', 'success');
            cargarCarreras();
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
document.getElementById('carreraForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('carrera-id').value;
    const data = {
        clave_carrera: document.getElementById('carrera-clave').value,
        nombre_carrera: document.getElementById('carrera-nombre').value,
        activo: parseInt(document.getElementById('carrera-activo').value)
    };

    try {
        let url = '/api/admin/carreras';
        let method = 'POST';

        if (id) {
            url = `/api/admin/carreras/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Carrera actualizada correctamente' : 'Carrera creada correctamente', 'success');
            cerrarModal();
            cargarCarreras();
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
    cargarCarreras();
});