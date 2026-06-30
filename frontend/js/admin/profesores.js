/**
 * SIGAE - ADMIN - GESTIÓN DE PROFESORES
 * Archivo: frontend/js/admin/profesores.js
 * 
 * Funciones para el CRUD de profesores:
 * - Listar profesores
 * - Crear profesor
 * - Editar profesor
 * - Eliminar profesor
 */

// =====================================================
// VARIABLES
// =====================================================
let profesoresData = [];

// =====================================================
// CARGAR PROFESORES
// =====================================================
async function cargarProfesores() {
    try {
        const res = await fetch('/api/admin/profesores');
        const profesores = await res.json();
        profesoresData = profesores;
        mostrarProfesores(profesores);
    } catch (error) {
        console.error('Error cargando profesores:', error);
        document.getElementById('profesores-table').innerHTML = 
            '<tr><td colspan="5" style="text-align:center;color:red;">Error al cargar profesores</td></tr>';
        showToast('Error al cargar los profesores', 'error');
    }
}

function mostrarProfesores(profesores) {
    const tbody = document.getElementById('profesores-table');
    if (!profesores || profesores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay profesores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = profesores.map(p => `
        <tr>
            <td><strong>${p.clave}</strong></td>
            <td>${p.nombre_completo}</td>
            <td>${p.email || 'Sin email'}</td>
            <td>
                <span class="badge ${p.activo ? 'badge-success' : 'badge-danger'}">
                    ${p.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-warning" onclick="editarProfesor(${p.id_profesor})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="eliminarProfesor(${p.id_profesor})" title="Eliminar">
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
    document.getElementById('modal-title').textContent = 'Nuevo Profesor';
    document.getElementById('profesor-id').value = '';
    document.getElementById('profesor-clave').value = '';
    document.getElementById('profesor-nombre').value = '';
    document.getElementById('profesor-email').value = '';
    document.getElementById('profesor-activo').value = '1';
    document.getElementById('profesor-clave').readOnly = false;
    document.getElementById('profesorModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('profesorModal').classList.remove('active');
}

function editarProfesor(id) {
    const profesor = profesoresData.find(p => p.id_profesor === id);
    if (!profesor) return;

    document.getElementById('modal-title').textContent = 'Editar Profesor';
    document.getElementById('profesor-id').value = profesor.id_profesor;
    document.getElementById('profesor-clave').value = profesor.clave;
    // document.getElementById('profesor-clave').readOnly = true; -- Eliminado para permitir edición de clave
    document.getElementById('profesor-nombre').value = profesor.nombre_completo;
    document.getElementById('profesor-email').value = profesor.email || '';
    document.getElementById('profesor-activo').value = profesor.activo;
    document.getElementById('profesorModal').classList.add('active');
}

async function eliminarProfesor(id) {
    const confirmado = await showConfirm('¿Estás seguro de eliminar este profesor?', null, null);
    if (!confirmado) return;

    try {
        const res = await fetch(`/api/admin/profesores/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Profesor eliminado correctamente', 'success');
            cargarProfesores();
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
document.getElementById('profesorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('profesor-id').value;
    const data = {
        clave: document.getElementById('profesor-clave').value,
        nombre_completo: document.getElementById('profesor-nombre').value,
        email: document.getElementById('profesor-email').value || null,
        activo: parseInt(document.getElementById('profesor-activo').value)
    };

    // Validaciones básicas
    if (!data.clave || !data.nombre_completo) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        let url = '/api/admin/profesores';
        let method = 'POST';

        if (id) {
            url = `/api/admin/profesores/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Profesor actualizado correctamente' : 'Profesor creado correctamente', 'success');
            cerrarModal();
            cargarProfesores();
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
    cargarProfesores();
});