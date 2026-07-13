/**
 * SIGAE - ADMIN - GESTIÓN DE EDIFICIOS
 * Archivo: frontend/js/admin/edificios.js
 * 
 * Funciones para el CRUD de edificios:
 * - Listar edificios
 * - Crear edificio
 * - Editar edificio
 * - Eliminar edificio
 * - Filtros y búsqueda
 * - Estadísticas en tiempo real
 */

// =====================================================
// VARIABLES
// =====================================================
let edificiosData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let searchTerm = '';

// =====================================================
// CARGAR EDIFICIOS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
async function cargarEdificios() {
    try {
        const res = await fetch('/api/admin/edificios');
        const edificios = await res.json();
        edificiosData = edificios;
        filteredData = [...edificiosData];
        currentPage = 1;
        actualizarEstadisticas();
        mostrarEdificios(filteredData);
        actualizarPaginacion();
    } catch (error) {
        console.error('Error cargando edificios:', error);
        document.getElementById('edificios-table').innerHTML = 
            `<tr>
                <td colspan="5" class="loading-state">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c; font-size: 2rem; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                    <span style="color: #e74c3c;">Error al cargar edificios</span>
                    <button onclick="cargarEdificios()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i> Reintentar
                    </button>
                </td>
            </tr>`;
        showToast('Error al cargar los edificios', 'error');
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================================
function actualizarEstadisticas() {
    const total = edificiosData.length;
    const activos = edificiosData.filter(e => e.activo === 1 || e.activo === true).length;
    const inactivos = total - activos;
    
    const totalEl = document.getElementById('totalEdificios');
    const activosEl = document.getElementById('edificiosActivos');
    const inactivosEl = document.getElementById('edificiosInactivos');
    
    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;
    if (inactivosEl) inactivosEl.textContent = inactivos;
}

// =====================================================
// MOSTRAR EDIFICIOS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarEdificios(edificios) {
    const tbody = document.getElementById('edificios-table');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!edificios || edificios.length === 0) {
        if (edificiosData.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-state">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                        <span style="color: #94a3b8;">No se encontraron edificios con los filtros aplicados</span>
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
    const end = Math.min(start + itemsPerPage, edificios.length);
    const pageData = edificios.slice(start, end);
    
    // Actualizar info de paginación
    const inicioSpan = document.getElementById('inicioRegistro');
    const finSpan = document.getElementById('finRegistro');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (inicioSpan) inicioSpan.textContent = edificios.length > 0 ? start + 1 : 0;
    if (finSpan) finSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = edificios.length;

    tbody.innerHTML = pageData.map(e => `
        <tr>
            <td><strong>${e.nombre}</strong></td>
            <td>${e.tipo_edificio || 'No especificado'}</td>
            <td>${e.ubicacion || 'Sin ubicación'}</td>
            <td>
                <span class="badge ${e.activo ? 'badge-success' : 'badge-danger'}">
                    ${e.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editarEdificio(${e.id_edificio})" title="Editar" aria-label="Editar edificio">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarEdificio(${e.id_edificio})" title="Eliminar" aria-label="Eliminar edificio">
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
    let filtered = [...edificiosData];
    
    if (currentFilter === 'activos') {
        filtered = filtered.filter(e => e.activo === 1 || e.activo === true);
    } else if (currentFilter === 'inactivos') {
        filtered = filtered.filter(e => e.activo === 0 || e.activo === false);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(e => 
            (e.nombre && e.nombre.toLowerCase().includes(term)) ||
            (e.tipo_edificio && e.tipo_edificio.toLowerCase().includes(term)) ||
            (e.ubicacion && e.ubicacion.toLowerCase().includes(term))
        );
    }
    
    filteredData = filtered;
    currentPage = 1;
    mostrarEdificios(filteredData);
    actualizarPaginacion();
}

// =====================================================
// LIMPIAR FILTROS
// =====================================================
function limpiarFiltros() {
    const searchInput = document.getElementById('searchEdificio');
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
    const idInput = document.getElementById('edificio-id');
    const nombreInput = document.getElementById('edificio-nombre');
    const tipoSelect = document.getElementById('edificio-tipo');
    const ubicacionInput = document.getElementById('edificio-ubicacion');
    const activoSelect = document.getElementById('edificio-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Nuevo Edificio';
    if (idInput) idInput.value = '';
    if (nombreInput) nombreInput.value = '';
    if (tipoSelect) tipoSelect.value = '';
    if (ubicacionInput) ubicacionInput.value = '';
    if (activoSelect) activoSelect.value = '1';
    if (submitText) submitText.textContent = 'Guardar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
    }
    
    const modal = document.getElementById('edificioModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    setTimeout(() => {
        if (nombreInput) nombreInput.focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('edificioModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function editarEdificio(id) {
    const edificio = edificiosData.find(e => e.id_edificio === id);
    if (!edificio) {
        showToast('Edificio no encontrado', 'error');
        return;
    }

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('edificio-id');
    const nombreInput = document.getElementById('edificio-nombre');
    const tipoSelect = document.getElementById('edificio-tipo');
    const ubicacionInput = document.getElementById('edificio-ubicacion');
    const activoSelect = document.getElementById('edificio-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Editar Edificio';
    if (idInput) idInput.value = edificio.id_edificio;
    if (nombreInput) nombreInput.value = edificio.nombre;
    if (tipoSelect) tipoSelect.value = edificio.tipo_edificio || '';
    if (ubicacionInput) ubicacionInput.value = edificio.ubicacion || '';
    if (activoSelect) activoSelect.value = edificio.activo;
    if (submitText) submitText.textContent = 'Actualizar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
    }
    
    const modal = document.getElementById('edificioModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

async function eliminarEdificio(id) {
    const edificio = edificiosData.find(e => e.id_edificio === id);
    if (!edificio) {
        showToast('Edificio no encontrado', 'error');
        return;
    }
    
    const nombre = edificio.nombre;
    
    // Usar modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) {
            confirmMessage.textContent = `¿Estás seguro de eliminar el edificio "${nombre}"?`;
        }
        if (confirmDetail) {
            confirmDetail.textContent = 'Esta acción eliminará permanentemente el edificio y no se puede deshacer.';
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
        if (confirm(`¿Estás seguro de eliminar el edificio "${nombre}"?`)) {
            confirmarEliminar(id);
        }
    }
}

async function confirmarEliminar(id) {
    try {
        const res = await fetch(`/api/admin/edificios/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Edificio eliminado correctamente', 'success');
            cerrarConfirmModal();
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
// TOGGLE ACTIVO/INACTIVO
// =====================================================
function toggleEdificio(id, activo) {
    const edificio = edificiosData.find(e => e.id_edificio === id);
    if (!edificio) return;
    
    const action = activo === 1 ? 'activar' : 'desactivar';
    const nombre = edificio.nombre;
    
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) {
            confirmMessage.textContent = `¿Estás seguro de ${action} el edificio "${nombre}"?`;
        }
        if (confirmDetail) {
            confirmDetail.textContent = `El edificio quedará ${activo === 1 ? 'disponible para uso' : 'no disponible para uso'}.`;
        }
        confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            newBtn.addEventListener('click', async function() {
                await confirmarToggle(id, activo);
            });
        }
    }
}

async function confirmarToggle(id, activo) {
    try {
        const res = await fetch(`/api/admin/edificios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo })
        });
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
document.getElementById('edificioForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('edificio-id').value;
    const nombreInput = document.getElementById('edificio-nombre');
    const tipoSelect = document.getElementById('edificio-tipo');
    const ubicacionInput = document.getElementById('edificio-ubicacion');
    const activoSelect = document.getElementById('edificio-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    const data = {
        nombre: nombreInput.value.trim(),
        tipo_edificio: tipoSelect.value,
        ubicacion: ubicacionInput.value.trim(),
        activo: parseInt(activoSelect.value)
    };

    // Validaciones
    if (!data.nombre) {
        showToast('El nombre del edificio es requerido', 'error');
        nombreInput.focus();
        return;
    }
    
    if (data.nombre.length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        nombreInput.focus();
        return;
    }
    
    if (!data.tipo_edificio) {
        showToast('Selecciona un tipo de edificio', 'error');
        tipoSelect.focus();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
    }

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
            const message = id ? 'Edificio actualizado correctamente' : 'Edificio creado correctamente';
            showToast(message, 'success');
            cerrarModal();
            cargarEdificios();
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
    const searchInput = document.getElementById('searchEdificio');
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
                mostrarEdificios(filteredData);
                actualizarPaginacion();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                mostrarEdificios(filteredData);
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
    
    cargarEdificios();
    configurarEventos();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const edificioModal = document.getElementById('edificioModal');
            const confirmModal = document.getElementById('confirmModal');
            if (edificioModal && edificioModal.classList.contains('active')) {
                cerrarModal();
            }
            if (confirmModal && confirmModal.classList.contains('active')) {
                cerrarConfirmModal();
            }
        }
    });
    
    // Cerrar modales al hacer clic fuera
    const edificioModal = document.getElementById('edificioModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (edificioModal) {
        edificioModal.addEventListener('click', function(e) {
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
window.cargarEdificios = cargarEdificios;
window.abrirModalCrear = abrirModalCrear;
window.cerrarModal = cerrarModal;
window.editarEdificio = editarEdificio;
window.eliminarEdificio = eliminarEdificio;
window.toggleEdificio = toggleEdificio;
window.cerrarConfirmModal = cerrarConfirmModal;
window.limpiarFiltros = limpiarFiltros;
window.showToast = showToast;