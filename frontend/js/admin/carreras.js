/**
 * SIGAE - ADMIN - GESTIÓN DE CARRERAS
 * Archivo: frontend/js/admin/carreras.js
 * 
 * Funciones para el CRUD de carreras:
 * - Listar carreras
 * - Crear carrera
 * - Editar carrera
 * - Eliminar carrera
 * - Búsqueda y filtrado (MEJORADO)
 */

// =====================================================
// VARIABLES
// =====================================================
let carrerasData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let searchTerm = '';

// =====================================================
// FUNCIONES DE UTILERÍA
// =====================================================

/**
 * Cerrar modal de confirmación
 */
function cerrarConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Mostrar toast (notificación)
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.log(message);
        return;
    }
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const titleMap = {
        success: 'Éxito',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconMap[type] || iconMap.info}" aria-hidden="true"></i>
        </div>
        <div class="toast-content">
            <h4>${titleMap[type] || 'Info'}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close" aria-label="Cerrar notificación">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removerToast(toast);
    });
    
    setTimeout(() => {
        removerToast(toast);
    }, 5000);
}

function removerToast(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 400);
}

// =====================================================
// CARGAR CARRERAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
async function cargarCarreras() {
    try {
        const res = await fetch('/api/admin/carreras');
        const carreras = await res.json();
        carrerasData = carreras;
        filteredData = [...carrerasData];
        currentPage = 1;
        actualizarEstadisticas();
        mostrarCarreras(filteredData);
        actualizarPaginacion();
    } catch (error) {
        console.error('Error cargando carreras:', error);
        document.getElementById('carreras-table').innerHTML = 
            `<tr>
                <td colspan="4" class="loading-state">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c; font-size: 2rem; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                    <span style="color: #e74c3c;">Error al cargar carreras</span>
                    <button onclick="cargarCarreras()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i> Reintentar
                    </button>
                </td>
            </tr>`;
        showToast('Error al cargar las carreras', 'error');
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS (NUEVO)
// =====================================================
function actualizarEstadisticas() {
    const total = carrerasData.length;
    const activas = carrerasData.filter(c => c.activo === 1 || c.activo === true).length;
    const inactivas = total - activas;
    
    const totalEl = document.getElementById('totalCarreras');
    const activasEl = document.getElementById('carrerasActivas');
    const inactivasEl = document.getElementById('carrerasInactivas');
    
    if (totalEl) totalEl.textContent = total;
    if (activasEl) activasEl.textContent = activas;
    if (inactivasEl) inactivasEl.textContent = inactivas;
}

// =====================================================
// MOSTRAR CARRERAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarCarreras(carreras) {
    const tbody = document.getElementById('carreras-table');
    const emptyState = document.getElementById('emptyState');
    
    if (!carreras || carreras.length === 0) {
        if (carrerasData.length === 0) {
            // No hay carreras en total
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            // No hay resultados con los filtros
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-state">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                        <span style="color: #94a3b8;">No se encontraron carreras con los filtros aplicados</span>
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
    const end = Math.min(start + itemsPerPage, carreras.length);
    const pageData = carreras.slice(start, end);
    
    // Actualizar info de paginación
    const inicioSpan = document.getElementById('inicioRegistro');
    const finSpan = document.getElementById('finRegistro');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (inicioSpan) inicioSpan.textContent = carreras.length > 0 ? start + 1 : 0;
    if (finSpan) finSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = carreras.length;

    tbody.innerHTML = pageData.map(c => `
        <tr>
            <td><strong>${c.clave_carrera}</strong></td>
            <td>${c.nombre_carrera}</td>
            <td>
                <span class="badge ${c.activo ? 'badge-success' : 'badge-danger'}">
                    ${c.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editarCarrera(${c.id_carrera})" title="Editar" aria-label="Editar carrera">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarCarrera(${c.id_carrera})" title="Eliminar" aria-label="Eliminar carrera">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// =====================================================
// ACTUALIZAR PAGINACIÓN (NUEVO)
// =====================================================
function actualizarPaginacion() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
}

// =====================================================
// APLICAR FILTROS (NUEVO)
// =====================================================
function aplicarFiltros() {
    let filtered = [...carrerasData];
    
    // Filtrar por estado
    if (currentFilter === 'activos') {
        filtered = filtered.filter(c => c.activo === 1 || c.activo === true);
    } else if (currentFilter === 'inactivos') {
        filtered = filtered.filter(c => c.activo === 0 || c.activo === false);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(c => 
            c.clave_carrera.toLowerCase().includes(term) ||
            c.nombre_carrera.toLowerCase().includes(term)
        );
    }
    
    filteredData = filtered;
    currentPage = 1;
    mostrarCarreras(filteredData);
    actualizarPaginacion();
}

// =====================================================
// LIMPIAR FILTROS (NUEVO)
// =====================================================
function limpiarFiltros() {
    const searchInput = document.getElementById('searchCarrera');
    if (searchInput) searchInput.value = '';
    searchTerm = '';
    currentFilter = 'todos';
    
    // Actualizar botones de filtro
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
    const idInput = document.getElementById('carrera-id');
    const claveInput = document.getElementById('carrera-clave');
    const nombreInput = document.getElementById('carrera-nombre');
    const activoSelect = document.getElementById('carrera-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Nueva Carrera';
    if (idInput) idInput.value = '';
    if (claveInput) {
        claveInput.value = '';
        claveInput.removeAttribute('readonly');
        claveInput.readOnly = false;
    }
    if (nombreInput) nombreInput.value = '';
    if (activoSelect) activoSelect.value = '1';
    if (submitText) submitText.textContent = 'Guardar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
    }
    
    document.getElementById('carreraModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        if (claveInput) claveInput.focus();
    }, 100);
}

function cerrarModal() {
    document.getElementById('carreraModal').classList.remove('active');
    document.body.style.overflow = '';
}

function editarCarrera(id) {
    const carrera = carrerasData.find(c => c.id_carrera === id);
    if (!carrera) {
        showToast('Carrera no encontrada', 'error');
        return;
    }

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('carrera-id');
    const claveInput = document.getElementById('carrera-clave');
    const nombreInput = document.getElementById('carrera-nombre');
    const activoSelect = document.getElementById('carrera-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Editar Carrera';
    if (idInput) idInput.value = carrera.id_carrera;
    if (claveInput) {
        claveInput.value = carrera.clave_carrera;
        claveInput.removeAttribute('readonly');
        claveInput.readOnly = false;
    }
    if (nombreInput) nombreInput.value = carrera.nombre_carrera;
    if (activoSelect) activoSelect.value = carrera.activo;
    if (submitText) submitText.textContent = 'Actualizar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
    }
    
    document.getElementById('carreraModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function eliminarCarrera(id) {
    const carrera = carrerasData.find(c => c.id_carrera === id);
    if (!carrera) return;
    
    const nombre = carrera.nombre_carrera;
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmDetail = document.getElementById('confirmDetail');
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    if (confirmModal && confirmMessage) {
        confirmMessage.textContent = `¿Estás seguro de eliminar "${nombre}"?`;
        if (confirmDetail) {
            confirmDetail.textContent = 'Esta acción eliminará permanentemente la carrera y no se puede deshacer.';
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
        if (confirm(`¿Estás seguro de eliminar la carrera "${nombre}"?`)) {
            confirmarEliminar(id);
        }
    }
}

async function confirmarEliminar(id) {
    try {
        const res = await fetch(`/api/admin/carreras/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Carrera eliminada correctamente', 'success');
            cerrarConfirmModal();
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
// FORMULARIO (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
document.getElementById('carreraForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('carrera-id').value;
    const claveInput = document.getElementById('carrera-clave');
    const nombreInput = document.getElementById('carrera-nombre');
    const activoSelect = document.getElementById('carrera-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    const data = {
        clave_carrera: claveInput.value.trim().toUpperCase(),
        nombre_carrera: nombreInput.value.trim(),
        activo: parseInt(activoSelect.value)
    };

    // Validaciones
    if (!data.clave_carrera) {
        showToast('La clave de la carrera es requerida', 'error');
        claveInput.focus();
        return;
    }
    
    if (data.clave_carrera.length < 2) {
        showToast('La clave debe tener al menos 2 caracteres', 'error');
        claveInput.focus();
        return;
    }
    
    if (!data.nombre_carrera) {
        showToast('El nombre de la carrera es requerido', 'error');
        nombreInput.focus();
        return;
    }
    
    if (data.nombre_carrera.length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        nombreInput.focus();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
    }

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
            const message = id ? 'Carrera actualizada correctamente' : 'Carrera creada correctamente';
            showToast(message, 'success');
            cerrarModal();
            cargarCarreras();
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
// CONFIGURAR EVENTOS (NUEVO)
// =====================================================
function configurarEventos() {
    const searchInput = document.getElementById('searchCarrera');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTerm = this.value.trim();
            aplicarFiltros();
        });
    }
    
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
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                mostrarCarreras(filteredData);
                actualizarPaginacion();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                mostrarCarreras(filteredData);
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
    
    cargarCarreras();
    configurarEventos();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('carreraModal').classList.contains('active')) {
                cerrarModal();
            }
            if (document.getElementById('confirmModal').classList.contains('active')) {
                cerrarConfirmModal();
            }
        }
    });
    
    document.getElementById('carreraModal').addEventListener('click', function(e) {
        if (e.target === this) cerrarModal();
    });
    
    document.getElementById('confirmModal').addEventListener('click', function(e) {
        if (e.target === this) cerrarConfirmModal();
    });
});