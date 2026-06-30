/**
 * SIGAE - ADMIN - GESTIÓN DE DIRECTORES
 * Archivo: frontend/js/admin/directores.js
 * 
 * Funciones para el CRUD de directores:
 * - Listar directores
 * - Crear director
 * - Editar director
 * - Eliminar director
 * - Asignar carreras
 */

// =====================================================
// VARIABLES
// =====================================================
let directoresData = [];
let carrerasData = [];

// =====================================================
// CARGAR SELECTS
// =====================================================
async function cargarSelects() {
    try {
        const res = await fetch('/api/admin/selects/directores');
        const data = await res.json();
        carrerasData = data.carreras;
        
        const select = document.getElementById('director-carreras');
        select.innerHTML = carrerasData.map(c => 
            `<option value="${c.id_carrera}">${c.clave_carrera} - ${c.nombre_carrera}</option>`
        ).join('');
    } catch (error) {
        console.error('Error cargando selects:', error);
        showToast('Error al cargar carreras', 'error');
    }
}

// =====================================================
// CARGAR DIRECTORES
// =====================================================
async function cargarDirectores() {
    try {
        const res = await fetch('/api/admin/directores');
        const directores = await res.json();
        directoresData = directores;
        mostrarDirectores(directores);
    } catch (error) {
        console.error('Error cargando directores:', error);
        document.getElementById('directores-table').innerHTML = 
            '<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar directores</td></tr>';
        showToast('Error al cargar los directores', 'error');
    }
}

function mostrarDirectores(directores) {
    const tbody = document.getElementById('directores-table');
    if (!directores || directores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay directores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = directores.map(u => `
        <tr>
            <td><strong>${u.nombre_completo}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.rol === 'admin' ? 'badge-warning' : 'badge-info'}">${u.rol}</span></td>
            <td>${u.carreras || 'Ninguna'}</td>
            <td>
                <span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">
                    ${u.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-warning" onclick="editarDirector(${u.id_usuario})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="eliminarDirector(${u.id_usuario})" title="Eliminar">
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
    document.getElementById('modal-title').textContent = 'Nuevo Director';
    document.getElementById('director-id').value = '';
    document.getElementById('director-nombre').value = '';
    document.getElementById('director-email').value = '';
    document.getElementById('director-password').value = '';
    document.getElementById('director-password').required = true;
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('director-rol').value = 'director';
    document.getElementById('director-activo').value = '1';
    document.getElementById('director-foto').value = '';
    document.getElementById('foto-preview').innerHTML = '';
    
    const select = document.getElementById('director-carreras');
    for (let opt of select.options) opt.selected = false;
    
    document.getElementById('directorModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('directorModal').classList.remove('active');
}

function editarDirector(id) {
    const director = directoresData.find(u => u.id_usuario === id);
    if (!director) return;

    document.getElementById('modal-title').textContent = 'Editar Director';
    document.getElementById('director-id').value = director.id_usuario;
    document.getElementById('director-nombre').value = director.nombre_completo;
    document.getElementById('director-email').value = director.email;
    document.getElementById('director-password').value = '';
    document.getElementById('director-password').required = false;
    document.getElementById('password-group').style.display = 'none';
    document.getElementById('director-rol').value = director.rol;
    document.getElementById('director-activo').value = director.activo;
    document.getElementById('director-foto').value = '';
    
    // Mostrar foto actual
    const preview = document.getElementById('foto-preview');
    if (director.foto_perfil && director.foto_perfil !== '/img/avatar.png') {
        preview.innerHTML = `
            <img src="${director.foto_perfil}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;">
            <p style="font-size: 0.7rem; color: #999; margin-top: 5px;">Foto actual</p>
        `;
    } else {
        preview.innerHTML = '<p style="font-size: 0.7rem; color: #999;">Sin foto</p>';
    }
    
    const carrerasDirector = director.carreras ? director.carreras.split(', ') : [];
    const select = document.getElementById('director-carreras');
    for (let opt of select.options) {
        opt.selected = carrerasDirector.some(c => opt.text.includes(c));
    }
    
    document.getElementById('directorModal').classList.add('active');
}

async function eliminarDirector(id) {
    const confirmado = await showConfirm('¿Estás seguro de eliminar este director?', null, null);
    if (!confirmado) return;

    try {
        const res = await fetch(`/api/admin/directores/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Director eliminado correctamente', 'success');
            cargarDirectores();
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
document.getElementById('directorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('director-id').value;
    const select = document.getElementById('director-carreras');
    const carrerasSeleccionadas = Array.from(select.selectedOptions).map(opt => parseInt(opt.value));
    
    const data = {
        nombre_completo: document.getElementById('director-nombre').value,
        email: document.getElementById('director-email').value,
        password: document.getElementById('director-password').value,
        rol: document.getElementById('director-rol').value,
        activo: parseInt(document.getElementById('director-activo').value),
        carreras: carrerasSeleccionadas
    };

    if (!id && !data.password) {
        showToast('La contraseña es requerida para nuevos directores', 'error');
        return;
    }

    try {
        let url = '/api/admin/directores';
        let method = 'POST';
        
        if (id) {
            url = `/api/admin/directores/${id}`;
            method = 'PUT';
            delete data.password;
        }

        // Primero crear/actualizar el director
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const result = await res.json();
            let directorId = id || result.id;
            
            // Subir foto si se seleccionó
            const fotoInput = document.getElementById('director-foto');
            if (fotoInput.files.length > 0) {
                const formData = new FormData();
                formData.append('foto', fotoInput.files[0]);
                formData.append('id_usuario', directorId);
                
                const fotoRes = await fetch('/api/admin/upload-foto', {
                    method: 'POST',
                    body: formData
                });
                
                if (fotoRes.ok) {
                    const fotoData = await fotoRes.json();
                    // Actualizar la foto en la base de datos
                    await fetch(`/api/admin/directores/${directorId}/foto`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ foto_perfil: fotoData.foto_perfil })
                    });
                }
            }
            
            showToast(id ? 'Director actualizado correctamente' : 'Director creado correctamente', 'success');
            cerrarModal();
            cargarDirectores();
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
// MOSTRAR/OCULTAR CARRERAS SEGÚN ROL
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const rolSelect = document.getElementById('director-rol');
    if (rolSelect) {
        rolSelect.addEventListener('change', function() {
            const carrerasGroup = document.getElementById('carreras-group');
            if (this.value === 'admin') {
                carrerasGroup.style.display = 'none';
            } else {
                carrerasGroup.style.display = 'block';
            }
        });
    }
});

// =====================================================
// PREVISUALIZAR FOTO
// =====================================================
document.getElementById('director-foto').addEventListener('change', function(e) {
    const preview = document.getElementById('foto-preview');
    const file = this.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #8B1C2A;">
                <p style="font-size: 0.7rem; color: #27ae60; margin-top: 5px;">✅ Foto seleccionada</p>
            `;
        };
        reader.readAsDataURL(file);
    }
});

// =====================================================
// INICIALIZAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuario();
    cargarSelects();
    cargarDirectores();
});