/**
 * SIGAE - ADMIN - GESTIÓN DE EDIFICIOS
 * Archivo: frontend/js/admin/edificios.js
 * 
 * Funciones para el CRUD de edificios:
 * - Listar edificios
 * - Crear edificio
 * - Editar edificio
 * - Eliminar edificio
 */

// =====================================================
// VARIABLES
// =====================================================
let edificiosData = [];

// =====================================================
// CARGAR EDIFICIOS
// =====================================================
async function cargarEdificios() {
    try {
        const res = await fetch('/api/admin/edificios');
        const edificios = await res.json();
        edificiosData = edificios;
        mostrarEdificios(edificios);
    } catch (error) {
        console.error('Error cargando edificios:', error);
        document.getElementById('edificios-table').innerHTML = 
            '<tr><td colspan="5" style="text-align:center;color:red;">Error al cargar edificios</td></tr>';
        showToast('Error al cargar los edificios', 'error');
    }
}

function mostrarEdificios(edificios) {
    const tbody = document.getElementById('edificios-table');
    if (!edificios || edificios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay edificios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = edificios.map(e => `
        <tr>
            <td><strong>${e.nombre}</strong></td>
            <td>${e.tipo_edificio}</td>
            <td>${e.ubicacion || 'Sin ubicación'}</td>
            <td>
                <span class="badge ${e.activo ? 'badge-success' : 'badge-danger'}">
                    ${e.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-warning" onclick="editarEdificio(${e.id_edificio})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="eliminarEdificio(${e.id_edificio})" title="Eliminar">
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
    document.getElementById('modal-title').textContent = 'Nuevo Edificio';
    document.getElementById('edificio-id').value = '';
    document.getElementById('edificio-nombre').value = '';
    document.getElementById('edificio-tipo').value = 'Docencia';
    document.getElementById('edificio-ubicacion').value = '';
    document.getElementById('edificio-activo').value = '1';
    document.getElementById('edificioModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('edificioModal').classList.remove('active');
}

function editarEdificio(id) {
    const edificio = edificiosData.find(e => e.id_edificio === id);
    if (!edificio) return;

    document.getElementById('modal-title').textContent = 'Editar Edificio';
    document.getElementById('edificio-id').value = edificio.id_edificio;
    document.getElementById('edificio-nombre').value = edificio.nombre;
    document.getElementById('edificio-tipo').value = edificio.tipo_edificio;
    document.getElementById('edificio-ubicacion').value = edificio.ubicacion || '';
    document.getElementById('edificio-activo').value = edificio.activo;
    document.getElementById('edificioModal').classList.add('active');
}

async function eliminarEdificio(id) {
    const confirmado = await showConfirm('¿Estás seguro de eliminar este edificio?', null, null);
    if (!confirmado) return;

    try {
        const res = await fetch(`/api/admin/edificios/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Edificio eliminado correctamente', 'success');
            cargarEdificios();
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
document.getElementById('edificioForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('edificio-id').value;
    const data = {
        nombre: document.getElementById('edificio-nombre').value,
        tipo_edificio: document.getElementById('edificio-tipo').value,
        ubicacion: document.getElementById('edificio-ubicacion').value,
        activo: parseInt(document.getElementById('edificio-activo').value)
    };

    try {
        let url = '/api/admin/edificios';
        let method = 'POST';

        if (id) {
            url = `/api/admin/edificios/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Edificio actualizado correctamente' : 'Edificio creado correctamente', 'success');
            cerrarModal();
            cargarEdificios();
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
    cargarEdificios();
});