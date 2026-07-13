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
 * - Filtros y búsqueda
 * - Estadísticas en tiempo real
 */

// =====================================================
// VARIABLES
// =====================================================
let directoresData = [];
let filteredData = [];
let carrerasData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let searchTerm = '';

// =====================================================
// CARGAR SELECTS (TU LÓGICA ORIGINAL)
// =====================================================
async function cargarSelects() {
    try {
        const res = await fetch('/api/admin/selects/directores');
        const data = await res.json();
        carrerasData = data.carreras || [];
        
        const select = document.getElementById('director-carreras');
        if (select) {
            select.innerHTML = carrerasData.map(c => 
                `<option value="${c.id_carrera}">${c.clave_carrera} - ${c.nombre_carrera}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Error cargando selects:', error);
        showToast('Error al cargar carreras', 'error');
    }
}

// =====================================================
// CARGAR DIRECTORES (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
async function cargarDirectores() {
    try {
        const res = await fetch('/api/admin/directores');
        const directores = await res.json();
        directoresData = directores;
        filteredData = [...directoresData];
        currentPage = 1;
        actualizarEstadisticas();
        mostrarDirectores(filteredData);
        actualizarPaginacion();
    } catch (error) {
        console.error('Error cargando directores:', error);
        document.getElementById('directores-table').innerHTML = 
            `<tr>
                <td colspan="6" class="loading-state">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c; font-size: 2rem; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                    <span style="color: #e74c3c;">Error al cargar directores</span>
                    <button onclick="cargarDirectores()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i> Reintentar
                    </button>
                </td>
            </tr>`;
        showToast('Error al cargar los directores', 'error');
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================================
function actualizarEstadisticas() {
    const total = directoresData.length;
    const activos = directoresData.filter(d => d.activo === 1 || d.activo === true).length;
    const inactivos = total - activos;
    
    const totalEl = document.getElementById('totalDirectores');
    const activosEl = document.getElementById('directoresActivos');
    const inactivosEl = document.getElementById('directoresInactivos');
    
    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;
    if (inactivosEl) inactivosEl.textContent = inactivos;
}

// =====================================================
// MOSTRAR DIRECTORES (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarDirectores(directores) {
    const tbody = document.getElementById('directores-table');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!directores || directores.length === 0) {
        if (directoresData.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-state">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                        <span style="color: #94a3b8;">No se encontraron directores con los filtros aplicados</span>
                        <button onclick="limpiarFiltros()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                            <i class="fas fa-times" aria-hidden="true"></i> Limpiar filtros
                        </button>
                    </td>
                </tr>
            `;
            if (emptyState) emptyState.style.display = 'none';
        }
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Aplicar paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, directores.length);
    const pageData = directores.slice(start, end);
    
    // Actualizar info de paginación
    const inicioSpan = document.getElementById('inicioRegistro');
    const finSpan = document.getElementById('finRegistro');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (inicioSpan) inicioSpan.textContent = directores.length > 0 ? start + 1 : 0;
    if (finSpan) finSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = directores.length;

    tbody.innerHTML = pageData.map(u => {
        // Determinar badge de rol
        const rolBadge = u.rol === 'admin' 
            ? '<span class="badge" style="background: #fff3cd; color: #856404;">Administrador</span>'
            : '<span class="badge" style="background: #d1ecf1; color: #0c5460;">Director</span>';
        
        return `
            <tr>
                <td><strong>${u.nombre_completo || 'Sin nombre'}</strong></td>
                <td>${u.email || 'Sin email'}</td>
                <td>${rolBadge}</td>
                <td>${u.carreras || 'Ninguna'}</td>
                <td>
                    <span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">
                        ${u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editarDirector(${u.id_usuario})" title="Editar" aria-label="Editar director">
                            <i class="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarDirector(${u.id_usuario})" title="Eliminar" aria-label="Eliminar director">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =====================================================
// ACTUALIZAR PAGINACIÓN
// =====================================================
function actualizarPaginacion() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1 || filteredData.length === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
}

// =====================================================
// APLICAR FILTROS
// =====================================================
function aplicarFiltros() {
    let filtered = [...directoresData];
    
    if (currentFilter === 'activos') {
        filtered = filtered.filter(d => d.activo === 1 || d.activo === true);
    } else if (currentFilter === 'inactivos') {
        filtered = filtered.filter(d => d.activo === 0 || d.activo === false);
    } else if (currentFilter === 'director') {
        filtered = filtered.filter(d => d.rol === 'director');
    } else if (currentFilter === 'admin') {
        filtered = filtered.filter(d => d.rol === 'admin');
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(d => 
            (d.nombre_completo && d.nombre_completo.toLowerCase().includes(term)) ||
            (d.email && d.email.toLowerCase().includes(term)) ||
            (d.carreras && d.carreras.toLowerCase().includes(term))
        );
    }
    
    filteredData = filtered;
    currentPage = 1;
    mostrarDirectores(filteredData);
    actualizarPaginacion();
}

// =====================================================
// LIMPIAR FILTROS
// =====================================================
function limpiarFiltros() {
    const searchInput = document.getElementById('searchDirector');
    if (searchInput) searchInput.value = '';
    searchTerm = '';
    currentFilter = 'todos';
    
    document.querySelectorAll('.btn-filter').forEach(btn => {
        const isActive = btn.dataset.filter === 'todos';
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    
    aplicarFiltros();
}

// =====================================================
// CREAR / EDITAR / ELIMINAR (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function abrirModalCrear() {
    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('director-id');
    const nombreInput = document.getElementById('director-nombre');
    const emailInput = document.getElementById('director-email');
    const passwordInput = document.getElementById('director-password');
    const passwordRequired = document.getElementById('password-required');
    const passwordGroup = document.getElementById('password-group');
    const rolSelect = document.getElementById('director-rol');
    const activoSelect = document.getElementById('director-activo');
    const fotoInput = document.getElementById('director-foto');
    const preview = document.getElementById('foto-preview');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Nuevo Director';
    if (idInput) idInput.value = '';
    if (nombreInput) nombreInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.required = true;
    }
    if (passwordRequired) passwordRequired.style.display = 'inline';
    if (passwordGroup) passwordGroup.style.display = 'block';
    if (rolSelect) rolSelect.value = 'director';
    if (activoSelect) activoSelect.value = '1';
    if (fotoInput) fotoInput.value = '';
    if (preview) preview.innerHTML = '';
    if (submitText) submitText.textContent = 'Guardar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
    }
    
    // Resetear selección de carreras
    const select = document.getElementById('director-carreras');
    if (select) {
        for (let opt of select.options) opt.selected = false;
    }
    
    // Mostrar grupo de carreras según rol
    const carrerasGroup = document.getElementById('carreras-group');
    if (carrerasGroup) {
        carrerasGroup.style.display = rolSelect.value === 'director' ? 'block' : 'none';
    }
    
    const modal = document.getElementById('directorModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    setTimeout(() => {
        if (nombreInput) nombreInput.focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('directorModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function editarDirector(id) {
    const director = directoresData.find(u => u.id_usuario === id);
    if (!director) {
        showToast('Director no encontrado', 'error');
        return;
    }

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('director-id');
    const nombreInput = document.getElementById('director-nombre');
    const emailInput = document.getElementById('director-email');
    const passwordInput = document.getElementById('director-password');
    const passwordRequired = document.getElementById('password-required');
    const passwordGroup = document.getElementById('password-group');
    const rolSelect = document.getElementById('director-rol');
    const activoSelect = document.getElementById('director-activo');
    const fotoInput = document.getElementById('director-foto');
    const preview = document.getElementById('foto-preview');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Editar Director';
    if (idInput) idInput.value = director.id_usuario;
    if (nombreInput) nombreInput.value = director.nombre_completo || '';
    if (emailInput) emailInput.value = director.email || '';
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.required = false;
    }
    if (passwordRequired) passwordRequired.style.display = 'none';
    if (passwordGroup) passwordGroup.style.display = 'block';
    if (rolSelect) rolSelect.value = director.rol || 'director';
    if (activoSelect) activoSelect.value = director.activo;
    if (fotoInput) fotoInput.value = '';
    if (submitText) submitText.textContent = 'Actualizar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
    }
    
    // Mostrar foto actual
    if (preview) {
        if (director.foto_perfil && director.foto_perfil !== '/img/avatar.png') {
            preview.innerHTML = `
                <div class="foto-preview-container">
                    <img src="${director.foto_perfil}" class="foto-preview-img" alt="Foto actual">
                    <span class="foto-preview-label">Foto actual</span>
                </div>
            `;
        } else {
            preview.innerHTML = '<span class="foto-preview-label" style="color: #999;">Sin foto</span>';
        }
    }
    
    // Seleccionar carreras del director
    const carrerasDirector = director.carreras ? director.carreras.split(', ') : [];
    const select = document.getElementById('director-carreras');
    if (select) {
        for (let opt of select.options) {
            opt.selected = carrerasDirector.some(c => opt.text.includes(c));
        }
    }
    
    // Mostrar grupo de carreras según rol
    const carrerasGroup = document.getElementById('carreras-group');
    if (carrerasGroup) {
        carrerasGroup.style.display = rolSelect.value === 'director' ? 'block' : 'none';
    }
    
    const modal = document.getElementById('directorModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

async function eliminarDirector(id) {
    const director = directoresData.find(u => u.id_usuario === id);
    if (!director) {
        showToast('Director no encontrado', 'error');
        return;
    }
    
    const nombre = director.nombre_completo || 'este director';
    
    // Usar modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) {
            confirmMessage.textContent = `¿Estás seguro de eliminar al director "${nombre}"?`;
        }
        if (confirmDetail) {
            confirmDetail.textContent = 'Esta acción eliminará permanentemente al director y no se puede deshacer.';
        }
        confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            newBtn.addEventListener('click', function() {
                confirmarEliminar(id);
            });
        }
    } else {
        if (confirm(`¿Estás seguro de eliminar al director "${nombre}"?`)) {
            confirmarEliminar(id);
        }
    }
}

async function confirmarEliminar(id) {
    try {
        const res = await fetch(`/api/admin/directores/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Director eliminado correctamente', 'success');
            cerrarConfirmModal();
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

function cerrarConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// =====================================================
// FORMULARIO (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
document.getElementById('directorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('director-id').value;
    const nombreInput = document.getElementById('director-nombre');
    const emailInput = document.getElementById('director-email');
    const passwordInput = document.getElementById('director-password');
    const rolSelect = document.getElementById('director-rol');
    const activoSelect = document.getElementById('director-activo');
    const select = document.getElementById('director-carreras');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    const carrerasSeleccionadas = select ? Array.from(select.selectedOptions).map(opt => parseInt(opt.value)) : [];
    
    const data = {
        nombre_completo: nombreInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        rol: rolSelect.value,
        activo: parseInt(activoSelect.value),
        carreras: carrerasSeleccionadas
    };

    // Validaciones
    if (!data.nombre_completo) {
        showToast('El nombre completo es requerido', 'error');
        nombreInput.focus();
        return;
    }
    
    if (data.nombre_completo.length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        nombreInput.focus();
        return;
    }
    
    if (!data.email) {
        showToast('El correo electrónico es requerido', 'error');
        emailInput.focus();
        return;
    }
    
    if (!data.email.includes('@')) {
        showToast('Ingresa un correo electrónico válido', 'error');
        emailInput.focus();
        return;
    }
    
    if (!id && !data.password) {
        showToast('La contraseña es requerida para nuevos directores', 'error');
        passwordInput.focus();
        return;
    }
    
    if (data.password && data.password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        passwordInput.focus();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
    }

    try {
        let url = '/api/admin/directores';
        let method = 'POST';
        
        if (id) {
            url = `/api/admin/directores/${id}`;
            method = 'PUT';
            delete data.password;
        }

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
            if (fotoInput && fotoInput.files.length > 0) {
                const formData = new FormData();
                formData.append('foto', fotoInput.files[0]);
                formData.append('id_usuario', directorId);
                
                const fotoRes = await fetch('/api/admin/upload-foto', {
                    method: 'POST',
                    body: formData
                });
                
                if (fotoRes.ok) {
                    const fotoData = await fotoRes.json();
                    await fetch(`/api/admin/directores/${directorId}/foto`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ foto_perfil: fotoData.foto_perfil })
                    });
                }
            }
            
            const message = id ? 'Director actualizado correctamente' : 'Director creado correctamente';
            showToast(message, 'success');
            cerrarModal();
            cargarDirectores();
        } else {
            const error = await res.json();
            showToast(error.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            const text = id ? 'Actualizar' : 'Guardar';
            submitBtn.innerHTML = `<i class="fas fa-save" aria-hidden="true"></i> ${text}`;
        }
    }
});

// =====================================================
// MOSTRAR/OCULTAR CARRERAS SEGÚN ROL (TU LÓGICA ORIGINAL)
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const rolSelect = document.getElementById('director-rol');
    if (rolSelect) {
        rolSelect.addEventListener('change', function() {
            const carrerasGroup = document.getElementById('carreras-group');
            if (carrerasGroup) {
                carrerasGroup.style.display = this.value === 'admin' ? 'none' : 'block';
            }
        });
    }
});

// =====================================================
// PREVISUALIZAR FOTO (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
document.getElementById('director-foto').addEventListener('change', function(e) {
    const preview = document.getElementById('foto-preview');
    const file = this.files[0];
    
    if (file) {
        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showToast('Formato no permitido. Usa JPG, PNG o GIF.', 'error');
            this.value = '';
            preview.innerHTML = '';
            return;
        }
        
        // Validar tamaño (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no debe superar los 2MB.', 'error');
            this.value = '';
            preview.innerHTML = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="foto-preview-container">
                    <img src="${e.target.result}" class="foto-preview-img" alt="Vista previa">
                    <span class="foto-preview-label" style="color: #27ae60;">✅ Foto seleccionada</span>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
});

// =====================================================
// CONFIGURAR EVENTOS
// =====================================================
function configurarEventos() {
    // Búsqueda
    const searchInput = document.getElementById('searchDirector');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTerm = this.value.trim();
            aplicarFiltros();
        });
    }
    
    // Filtros
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            currentFilter = filter;
            
            document.querySelectorAll('.btn-filter').forEach(b => {
                const isActive = b.dataset.filter === filter;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            
            aplicarFiltros();
        });
    });
    
    // Paginación
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                mostrarDirectores(filteredData);
                actualizarPaginacion();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                mostrarDirectores(filteredData);
                actualizarPaginacion();
            }
        });
    }
}

// =====================================================
// INICIALIZAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    if (typeof mostrarUsuario === 'function') {
        mostrarUsuario();
    }
    
    cargarSelects();
    cargarDirectores();
    configurarEventos();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const directorModal = document.getElementById('directorModal');
            const confirmModal = document.getElementById('confirmModal');
            if (directorModal && directorModal.classList.contains('active')) {
                cerrarModal();
            }
            if (confirmModal && confirmModal.classList.contains('active')) {
                cerrarConfirmModal();
            }
        }
    });
    
    // Cerrar modales al hacer clic fuera
    const directorModal = document.getElementById('directorModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (directorModal) {
        directorModal.addEventListener('click', function(e) {
            if (e.target === this) cerrarModal();
        });
    }
    
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === this) cerrarConfirmModal();
        });
    }
});

// =====================================================
// EXPONER FUNCIONES GLOBALES
// =====================================================
window.cargarDirectores = cargarDirectores;
window.abrirModalCrear = abrirModalCrear;
window.cerrarModal = cerrarModal;
window.editarDirector = editarDirector;
window.eliminarDirector = eliminarDirector;
window.toggleDirector = toggleDirector;
window.cerrarConfirmModal = cerrarConfirmModal;
window.limpiarFiltros = limpiarFiltros;
window.showToast = showToast;