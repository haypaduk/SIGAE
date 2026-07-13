/**
 * SIGAE - ADMIN - GESTIÓN DE MATERIAS
 * Archivo: frontend/js/admin/materias.js
 * 
 * Funciones para el CRUD de materias:
 * - Listar materias
 * - Crear materia
 * - Editar materia
 * - Eliminar materia
 * - Filtros y búsqueda
 * - Estadísticas en tiempo real
 */

// =====================================================
// VARIABLES
// =====================================================
let materiasData = [];
let filteredData = [];
let carrerasData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let searchTerm = '';

// =====================================================
// CARGAR SELECTS (Carreras) - TU LÓGICA ORIGINAL
// =====================================================
async function cargarSelects() {
    try {
        const res = await fetch('/api/admin/selects/materias');
        const data = await res.json();
        carrerasData = data.carreras || [];
        
        const carreraSelect = document.getElementById('materia-carrera');
        if (carreraSelect) {
            carreraSelect.innerHTML = '<option value="">Seleccionar carrera</option>' +
                carrerasData.map(c => 
                    `<option value="${c.id_carrera}">${c.clave_carrera} - ${c.nombre_carrera}</option>`
                ).join('');
        }
        
    } catch (error) {
        console.error('Error cargando selects:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// =====================================================
// CARGAR MATERIAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
async function cargarMaterias() {
    try {
        const res = await fetch('/api/admin/materias');
        const materias = await res.json();
        materiasData = materias;
        filteredData = [...materiasData];
        currentPage = 1;
        actualizarEstadisticas();
        mostrarMaterias(filteredData);
        actualizarPaginacion();
    } catch (error) {
        console.error('Error cargando materias:', error);
        document.getElementById('materias-table').innerHTML = 
            `<tr>
                <td colspan="5" class="loading-state">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c; font-size: 2rem; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                    <span style="color: #e74c3c;">Error al cargar materias</span>
                    <button onclick="cargarMaterias()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i> Reintentar
                    </button>
                </td>
            </tr>`;
        showToast('Error al cargar las materias', 'error');
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================================
function actualizarEstadisticas() {
    const total = materiasData.length;
    const activas = materiasData.filter(m => m.activo === 1 || m.activo === true).length;
    const inactivas = total - activas;
    
    const totalEl = document.getElementById('totalMaterias');
    const activasEl = document.getElementById('materiasActivas');
    const inactivasEl = document.getElementById('materiasInactivas');
    
    if (totalEl) totalEl.textContent = total;
    if (activasEl) activasEl.textContent = activas;
    if (inactivasEl) inactivasEl.textContent = inactivas;
}

// =====================================================
// MOSTRAR MATERIAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarMaterias(materias) {
    const tbody = document.getElementById('materias-table');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!materias || materias.length === 0) {
        if (materiasData.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-state">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                        <span style="color: #94a3b8;">No se encontraron materias con los filtros aplicados</span>
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
    const end = Math.min(start + itemsPerPage, materias.length);
    const pageData = materias.slice(start, end);
    
    // Actualizar info de paginación
    const inicioSpan = document.getElementById('inicioRegistro');
    const finSpan = document.getElementById('finRegistro');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (inicioSpan) inicioSpan.textContent = materias.length > 0 ? start + 1 : 0;
    if (finSpan) finSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = materias.length;

    tbody.innerHTML = pageData.map(m => `
        <tr>
            <td><strong>${m.clave || 'N/A'}</strong></td>
            <td>${m.nombre || 'Sin nombre'}</td>
            <td>${m.clave_carrera || 'Sin asignar'}</td>
            <td>
                <span class="badge ${m.activo ? 'badge-success' : 'badge-danger'}">
                    ${m.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editarMateria(${m.id_materia})" title="Editar" aria-label="Editar materia">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarMateria(${m.id_materia})" title="Eliminar" aria-label="Eliminar materia">
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
    let filtered = [...materiasData];
    
    if (currentFilter === 'activos') {
        filtered = filtered.filter(m => m.activo === 1 || m.activo === true);
    } else if (currentFilter === 'inactivos') {
        filtered = filtered.filter(m => m.activo === 0 || m.activo === false);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(m => 
            (m.clave && m.clave.toLowerCase().includes(term)) ||
            (m.nombre && m.nombre.toLowerCase().includes(term)) ||
            (m.clave_carrera && m.clave_carrera.toLowerCase().includes(term))
        );
    }
    
    filteredData = filtered;
    currentPage = 1;
    mostrarMaterias(filteredData);
    actualizarPaginacion();
}

// =====================================================
// LIMPIAR FILTROS
// =====================================================
function limpiarFiltros() {
    const searchInput = document.getElementById('searchMateria');
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
    const idInput = document.getElementById('materia-id');
    const claveInput = document.getElementById('materia-clave');
    const nombreInput = document.getElementById('materia-nombre');
    const carreraSelect = document.getElementById('materia-carrera');
    const activoSelect = document.getElementById('materia-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Nueva Materia';
    if (idInput) idInput.value = '';
    if (claveInput) {
        claveInput.value = '';
        claveInput.removeAttribute('readonly');
        claveInput.readOnly = false;
    }
    if (nombreInput) nombreInput.value = '';
    if (carreraSelect) carreraSelect.value = '';
    if (activoSelect) activoSelect.value = '1';
    if (submitText) submitText.textContent = 'Guardar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
    }
    
    const modal = document.getElementById('materiaModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    setTimeout(() => {
        if (claveInput) claveInput.focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('materiaModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function editarMateria(id) {
    const materia = materiasData.find(m => m.id_materia === id);
    if (!materia) {
        showToast('Materia no encontrada', 'error');
        return;
    }

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('materia-id');
    const claveInput = document.getElementById('materia-clave');
    const nombreInput = document.getElementById('materia-nombre');
    const carreraSelect = document.getElementById('materia-carrera');
    const activoSelect = document.getElementById('materia-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Editar Materia';
    if (idInput) idInput.value = materia.id_materia;
    if (claveInput) {
        claveInput.value = materia.clave;
        claveInput.removeAttribute('readonly');
        claveInput.readOnly = false;
    }
    if (nombreInput) nombreInput.value = materia.nombre;
    if (carreraSelect) carreraSelect.value = materia.id_carrera || '';
    if (activoSelect) activoSelect.value = materia.activo;
    if (submitText) submitText.textContent = 'Actualizar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
    }
    
    const modal = document.getElementById('materiaModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

async function eliminarMateria(id) {
    const materia = materiasData.find(m => m.id_materia === id);
    if (!materia) {
        showToast('Materia no encontrada', 'error');
        return;
    }
    
    const nombre = materia.nombre || 'esta materia';
    
    // Usar modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) {
            confirmMessage.textContent = `¿Estás seguro de eliminar la materia "${nombre}"?`;
        }
        if (confirmDetail) {
            confirmDetail.textContent = 'Esta acción eliminará permanentemente la materia y no se puede deshacer.';
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
        if (confirm(`¿Estás seguro de eliminar la materia "${nombre}"?`)) {
            confirmarEliminar(id);
        }
    }
}

async function confirmarEliminar(id) {
    try {
        const res = await fetch(`/api/admin/materias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Materia eliminada correctamente', 'success');
            cerrarConfirmModal();
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
document.getElementById('materiaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('materia-id').value;
    const claveInput = document.getElementById('materia-clave');
    const nombreInput = document.getElementById('materia-nombre');
    const carreraSelect = document.getElementById('materia-carrera');
    const activoSelect = document.getElementById('materia-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    const data = {
        clave: claveInput.value.trim().toUpperCase(),
        nombre: nombreInput.value.trim(),
        id_carrera: parseInt(carreraSelect.value),
        activo: parseInt(activoSelect.value)
    };

    // Validaciones
    if (!data.clave) {
        showToast('La clave de la materia es requerida', 'error');
        claveInput.focus();
        return;
    }
    
    if (data.clave.length < 2) {
        showToast('La clave debe tener al menos 2 caracteres', 'error');
        claveInput.focus();
        return;
    }
    
    if (!data.nombre) {
        showToast('El nombre de la materia es requerido', 'error');
        nombreInput.focus();
        return;
    }
    
    if (data.nombre.length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        nombreInput.focus();
        return;
    }
    
    if (!data.id_carrera || isNaN(data.id_carrera)) {
        showToast('Selecciona una carrera', 'error');
        carreraSelect.focus();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
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
            const message = id ? 'Materia actualizada correctamente' : 'Materia creada correctamente';
            showToast(message, 'success');
            cerrarModal();
            cargarMaterias();
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
    const searchInput = document.getElementById('searchMateria');
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
                mostrarMaterias(filteredData);
                actualizarPaginacion();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                mostrarMaterias(filteredData);
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
    cargarMaterias();
    configurarEventos();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const materiaModal = document.getElementById('materiaModal');
            const confirmModal = document.getElementById('confirmModal');
            if (materiaModal && materiaModal.classList.contains('active')) {
                cerrarModal();
            }
            if (confirmModal && confirmModal.classList.contains('active')) {
                cerrarConfirmModal();
            }
        }
    });
    
    // Cerrar modales al hacer clic fuera
    const materiaModal = document.getElementById('materiaModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (materiaModal) {
        materiaModal.addEventListener('click', function(e) {
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
window.cargarMaterias = cargarMaterias;
window.abrirModalCrear = abrirModalCrear;
window.cerrarModal = cerrarModal;
window.editarMateria = editarMateria;
window.eliminarMateria = eliminarMateria;
window.toggleMateria = toggleMateria;
window.cerrarConfirmModal = cerrarConfirmModal;
window.limpiarFiltros = limpiarFiltros;
window.showToast = showToast;