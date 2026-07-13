/**
 * SIGAE - ADMIN - GESTIÓN DE PROFESORES
 * Archivo: frontend/js/admin/profesores.js
 * 
 * Funciones para el CRUD de profesores:
 * - Listar profesores
 * - Crear profesor
 * - Editar profesor
 * - Eliminar profesor
 * - Filtros y búsqueda
 * - Estadísticas en tiempo real
 */

// =====================================================
// VARIABLES
// =====================================================
let profesoresData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let searchTerm = '';

// =====================================================
// CARGAR PROFESORES (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
async function cargarProfesores() {
    try {
        const res = await fetch('/api/admin/profesores');
        const profesores = await res.json();
        profesoresData = profesores;
        filteredData = [...profesoresData];
        currentPage = 1;
        actualizarEstadisticas();
        mostrarProfesores(filteredData);
        actualizarPaginacion();
    } catch (error) {
        console.error('Error cargando profesores:', error);
        document.getElementById('profesores-table').innerHTML = 
            `<tr>
                <td colspan="5" class="loading-state">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c; font-size: 2rem; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                    <span style="color: #e74c3c;">Error al cargar profesores</span>
                    <button onclick="cargarProfesores()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i> Reintentar
                    </button>
                </td>
            </tr>`;
        showToast('Error al cargar los profesores', 'error');
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================================
function actualizarEstadisticas() {
    const total = profesoresData.length;
    const activos = profesoresData.filter(p => p.activo === 1 || p.activo === true).length;
    const inactivos = total - activos;
    
    const totalEl = document.getElementById('totalProfesores');
    const activosEl = document.getElementById('profesoresActivos');
    const inactivosEl = document.getElementById('profesoresInactivos');
    
    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;
    if (inactivosEl) inactivosEl.textContent = inactivos;
}

// =====================================================
// MOSTRAR PROFESORES (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarProfesores(profesores) {
    const tbody = document.getElementById('profesores-table');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!profesores || profesores.length === 0) {
        if (profesoresData.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-state">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                        <span style="color: #94a3b8;">No se encontraron profesores con los filtros aplicados</span>
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
    const end = Math.min(start + itemsPerPage, profesores.length);
    const pageData = profesores.slice(start, end);
    
    // Actualizar info de paginación
    const inicioSpan = document.getElementById('inicioRegistro');
    const finSpan = document.getElementById('finRegistro');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (inicioSpan) inicioSpan.textContent = profesores.length > 0 ? start + 1 : 0;
    if (finSpan) finSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = profesores.length;

    tbody.innerHTML = pageData.map(p => `
        <tr>
            <td><strong>${p.clave || 'N/A'}</strong></td>
            <td>${p.nombre_completo || 'Sin nombre'}</td>
            <td>${p.email || 'Sin email'}</td>
            <td>
                <span class="badge ${p.activo ? 'badge-success' : 'badge-danger'}">
                    ${p.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editarProfesor(${p.id_profesor})" title="Editar" aria-label="Editar profesor">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarProfesor(${p.id_profesor})" title="Eliminar" aria-label="Eliminar profesor">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
    let filtered = [...profesoresData];
    
    if (currentFilter === 'activos') {
        filtered = filtered.filter(p => p.activo === 1 || p.activo === true);
    } else if (currentFilter === 'inactivos') {
        filtered = filtered.filter(p => p.activo === 0 || p.activo === false);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            (p.clave && p.clave.toLowerCase().includes(term)) ||
            (p.nombre_completo && p.nombre_completo.toLowerCase().includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term))
        );
    }
    
    filteredData = filtered;
    currentPage = 1;
    mostrarProfesores(filteredData);
    actualizarPaginacion();
}

// =====================================================
// LIMPIAR FILTROS
// =====================================================
function limpiarFiltros() {
    const searchInput = document.getElementById('searchProfesor');
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
    const idInput = document.getElementById('profesor-id');
    const claveInput = document.getElementById('profesor-clave');
    const nombreInput = document.getElementById('profesor-nombre');
    const emailInput = document.getElementById('profesor-email');
    const activoSelect = document.getElementById('profesor-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Nuevo Profesor';
    if (idInput) idInput.value = '';
    if (claveInput) {
        claveInput.value = '';
        claveInput.removeAttribute('readonly');
        claveInput.readOnly = false;
    }
    if (nombreInput) nombreInput.value = '';
    if (emailInput) emailInput.value = '';
    if (activoSelect) activoSelect.value = '1';
    if (submitText) submitText.textContent = 'Guardar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
    }
    
    const modal = document.getElementById('profesorModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    setTimeout(() => {
        if (claveInput) claveInput.focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('profesorModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function editarProfesor(id) {
    const profesor = profesoresData.find(p => p.id_profesor === id);
    if (!profesor) {
        showToast('Profesor no encontrado', 'error');
        return;
    }

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('profesor-id');
    const claveInput = document.getElementById('profesor-clave');
    const nombreInput = document.getElementById('profesor-nombre');
    const emailInput = document.getElementById('profesor-email');
    const activoSelect = document.getElementById('profesor-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Editar Profesor';
    if (idInput) idInput.value = profesor.id_profesor;
    if (claveInput) {
        claveInput.value = profesor.clave;
        claveInput.removeAttribute('readonly');
        claveInput.readOnly = false;
    }
    if (nombreInput) nombreInput.value = profesor.nombre_completo;
    if (emailInput) emailInput.value = profesor.email || '';
    if (activoSelect) activoSelect.value = profesor.activo;
    if (submitText) submitText.textContent = 'Actualizar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
    }
    
    const modal = document.getElementById('profesorModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

async function eliminarProfesor(id) {
    const profesor = profesoresData.find(p => p.id_profesor === id);
    if (!profesor) {
        showToast('Profesor no encontrado', 'error');
        return;
    }
    
    const nombre = profesor.nombre_completo || 'este profesor';
    
    // Usar modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) {
            confirmMessage.textContent = `¿Estás seguro de eliminar al profesor "${nombre}"?`;
        }
        if (confirmDetail) {
            confirmDetail.textContent = 'Esta acción eliminará permanentemente al profesor y no se puede deshacer.';
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
        if (confirm(`¿Estás seguro de eliminar al profesor "${nombre}"?`)) {
            confirmarEliminar(id);
        }
    }
}

async function confirmarEliminar(id) {
    try {
        const res = await fetch(`/api/admin/profesores/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Profesor eliminado correctamente', 'success');
            cerrarConfirmModal();
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
document.getElementById('profesorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('profesor-id').value;
    const claveInput = document.getElementById('profesor-clave');
    const nombreInput = document.getElementById('profesor-nombre');
    const emailInput = document.getElementById('profesor-email');
    const activoSelect = document.getElementById('profesor-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    const data = {
        clave: claveInput.value.trim().toUpperCase(),
        nombre_completo: nombreInput.value.trim(),
        email: emailInput.value.trim() || null,
        activo: parseInt(activoSelect.value)
    };

    // Validaciones
    if (!data.clave) {
        showToast('La clave del profesor es requerida', 'error');
        claveInput.focus();
        return;
    }
    
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
    
    // Validar email si se proporciona
    if (data.email && !data.email.includes('@')) {
        showToast('Ingresa un email válido', 'error');
        emailInput.focus();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
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
            const message = id ? 'Profesor actualizado correctamente' : 'Profesor creado correctamente';
            showToast(message, 'success');
            cerrarModal();
            cargarProfesores();
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
// CONFIGURAR EVENTOS
// =====================================================
function configurarEventos() {
    // Búsqueda
    const searchInput = document.getElementById('searchProfesor');
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
                mostrarProfesores(filteredData);
                actualizarPaginacion();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                mostrarProfesores(filteredData);
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
    
    cargarProfesores();
    configurarEventos();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const profesorModal = document.getElementById('profesorModal');
            const confirmModal = document.getElementById('confirmModal');
            if (profesorModal && profesorModal.classList.contains('active')) {
                cerrarModal();
            }
            if (confirmModal && confirmModal.classList.contains('active')) {
                cerrarConfirmModal();
            }
        }
    });
    
    // Cerrar modales al hacer clic fuera
    const profesorModal = document.getElementById('profesorModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (profesorModal) {
        profesorModal.addEventListener('click', function(e) {
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
window.cargarProfesores = cargarProfesores;
window.abrirModalCrear = abrirModalCrear;
window.cerrarModal = cerrarModal;
window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;
window.toggleProfesor = toggleProfesor;
window.cerrarConfirmModal = cerrarConfirmModal;
window.limpiarFiltros = limpiarFiltros;
window.showToast = showToast;