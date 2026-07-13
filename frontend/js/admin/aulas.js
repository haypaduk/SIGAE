/**
 * SIGAE - ADMIN - GESTIÓN DE AULAS
 * Archivo: frontend/js/admin/aulas.js
 * 
 * Funciones para el CRUD de aulas:
 * - Listar aulas
 * - Crear aula
 * - Editar aula
 * - Eliminar aula
 * - Filtros y búsqueda
 * - Estadísticas en tiempo real
 */

// =====================================================
// VARIABLES
// =====================================================
let aulasData = [];
let selectsData = {};
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let searchTerm = '';

// =====================================================
// CARGAR SELECTS (TU LÓGICA ORIGINAL)
// =====================================================
async function cargarSelects() {
    try {
        const res = await fetch('/api/admin/selects/aulas');
        selectsData = await res.json();
        
        // Llenar selects del modal
        const edificioSelect = document.getElementById('aula-edificio');
        const tipoSelect = document.getElementById('aula-tipo');
        const carreraSelect = document.getElementById('aula-carrera');
        
        if (edificioSelect) {
            edificioSelect.innerHTML = '<option value="">Seleccionar edificio</option>' +
                selectsData.edificios.map(e => 
                    `<option value="${e.id_edificio}">${e.nombre}</option>`
                ).join('');
        }
        
        if (tipoSelect) {
            tipoSelect.innerHTML = '<option value="">Seleccionar tipo</option>' +
                selectsData.tipos.map(t => 
                    `<option value="${t.id_tipo_aula}">${t.nombre_tipo}</option>`
                ).join('');
        }
        
        if (carreraSelect) {
            carreraSelect.innerHTML = '<option value="">Sin asignar</option>' +
                selectsData.carreras.map(c => 
                    `<option value="${c.id_carrera}">${c.clave_carrera} - ${c.nombre_carrera}</option>`
                ).join('');
        }
        
    } catch (error) {
        console.error('Error cargando selects:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// =====================================================
// CARGAR AULAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
async function cargarAulas() {
    try {
        const res = await fetch('/api/admin/aulas');
        const aulas = await res.json();
        aulasData = aulas;
        filteredData = [...aulasData];
        currentPage = 1;
        actualizarEstadisticas();
        mostrarAulas(filteredData);
        actualizarPaginacion();
    } catch (error) {
        console.error('Error cargando aulas:', error);
        document.getElementById('aulas-table').innerHTML = 
            `<tr>
                <td colspan="8" class="loading-state">
                    <i class="fas fa-exclamation-circle" style="color: #e74c3c; font-size: 2rem; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                    <span style="color: #e74c3c;">Error al cargar aulas</span>
                    <button onclick="cargarAulas()" class="btn-primary" style="margin-top: 10px; padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i> Reintentar
                    </button>
                </td>
            </tr>`;
        showToast('Error al cargar las aulas', 'error');
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================================
function actualizarEstadisticas() {
    const total = aulasData.length;
    const activos = aulasData.filter(a => a.activo === 1 || a.activo === true).length;
    const inactivos = total - activos;
    
    const totalEl = document.getElementById('totalAulas');
    const activosEl = document.getElementById('aulasActivas');
    const inactivosEl = document.getElementById('aulasInactivas');
    
    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;
    if (inactivosEl) inactivosEl.textContent = inactivos;
}

// =====================================================
// MOSTRAR AULAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarAulas(aulas) {
    const tbody = document.getElementById('aulas-table');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!aulas || aulas.length === 0) {
        if (aulasData.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-state">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 8px;" aria-hidden="true"></i>
                        <span style="color: #94a3b8;">No se encontraron aulas con los filtros aplicados</span>
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
    const end = Math.min(start + itemsPerPage, aulas.length);
    const pageData = aulas.slice(start, end);
    
    // Actualizar info de paginación
    const inicioSpan = document.getElementById('inicioRegistro');
    const finSpan = document.getElementById('finRegistro');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (inicioSpan) inicioSpan.textContent = aulas.length > 0 ? start + 1 : 0;
    if (finSpan) finSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = aulas.length;

    tbody.innerHTML = pageData.map(a => `
        <tr>
            <td><strong>${a.identificador || 'N/A'}</strong></td>
            <td>${a.edificio_nombre || 'Sin edificio'}</td>
            <td>${a.tipo_nombre || 'Sin tipo'}</td>
            <td>${a.piso || 'Sin piso'}</td>
            <td>${a.capacidad || 0}</td>
            <td>${a.clave_carrera || 'Sin asignar'}</td>
            <td>
                <span class="badge ${a.activo ? 'badge-success' : 'badge-danger'}">
                    ${a.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editarAula(${a.id_aula})" title="Editar" aria-label="Editar aula">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarAula(${a.id_aula})" title="Eliminar" aria-label="Eliminar aula">
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
    let filtered = [...aulasData];
    
    if (currentFilter === 'activos') {
        filtered = filtered.filter(a => a.activo === 1 || a.activo === true);
    } else if (currentFilter === 'inactivos') {
        filtered = filtered.filter(a => a.activo === 0 || a.activo === false);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(a => 
            (a.identificador && a.identificador.toLowerCase().includes(term)) ||
            (a.edificio_nombre && a.edificio_nombre.toLowerCase().includes(term)) ||
            (a.tipo_nombre && a.tipo_nombre.toLowerCase().includes(term)) ||
            (a.piso && a.piso.toLowerCase().includes(term))
        );
    }
    
    filteredData = filtered;
    currentPage = 1;
    mostrarAulas(filteredData);
    actualizarPaginacion();
}

// =====================================================
// LIMPIAR FILTROS
// =====================================================
function limpiarFiltros() {
    const searchInput = document.getElementById('searchAula');
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
    const idInput = document.getElementById('aula-id');
    const identificadorInput = document.getElementById('aula-identificador');
    const edificioSelect = document.getElementById('aula-edificio');
    const tipoSelect = document.getElementById('aula-tipo');
    const pisoSelect = document.getElementById('aula-piso');
    const capacidadInput = document.getElementById('aula-capacidad');
    const carreraSelect = document.getElementById('aula-carrera');
    const activoSelect = document.getElementById('aula-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Nueva Aula';
    if (idInput) idInput.value = '';
    if (identificadorInput) identificadorInput.value = '';
    if (edificioSelect) edificioSelect.value = '';
    if (tipoSelect) tipoSelect.value = '';
    if (pisoSelect) pisoSelect.value = '';
    if (capacidadInput) capacidadInput.value = '';
    if (carreraSelect) carreraSelect.value = '';
    if (activoSelect) activoSelect.value = '1';
    if (submitText) submitText.textContent = 'Guardar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
    }
    
    const modal = document.getElementById('aulaModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    setTimeout(() => {
        if (identificadorInput) identificadorInput.focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('aulaModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function editarAula(id) {
    const aula = aulasData.find(a => a.id_aula === id);
    if (!aula) {
        showToast('Aula no encontrada', 'error');
        return;
    }

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('aula-id');
    const identificadorInput = document.getElementById('aula-identificador');
    const edificioSelect = document.getElementById('aula-edificio');
    const tipoSelect = document.getElementById('aula-tipo');
    const pisoSelect = document.getElementById('aula-piso');
    const capacidadInput = document.getElementById('aula-capacidad');
    const carreraSelect = document.getElementById('aula-carrera');
    const activoSelect = document.getElementById('aula-activo');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = 'Editar Aula';
    if (idInput) idInput.value = aula.id_aula;
    if (identificadorInput) identificadorInput.value = aula.identificador || '';
    if (edificioSelect) edificioSelect.value = aula.id_edificio || '';
    if (tipoSelect) tipoSelect.value = aula.id_tipo_aula || '';
    if (pisoSelect) pisoSelect.value = aula.piso || '';
    if (capacidadInput) capacidadInput.value = aula.capacidad || '';
    if (carreraSelect) carreraSelect.value = aula.id_carrera || '';
    if (activoSelect) activoSelect.value = aula.activo;
    if (submitText) submitText.textContent = 'Actualizar';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
    }
    
    const modal = document.getElementById('aulaModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

async function eliminarAula(id) {
    const aula = aulasData.find(a => a.id_aula === id);
    if (!aula) {
        showToast('Aula no encontrada', 'error');
        return;
    }
    
    const identificador = aula.identificador || 'esta aula';
    
    // Usar modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) {
            confirmMessage.textContent = `¿Estás seguro de eliminar el aula "${identificador}"?`;
        }
        if (confirmDetail) {
            confirmDetail.textContent = 'Esta acción eliminará permanentemente el aula y no se puede deshacer.';
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
        if (confirm(`¿Estás seguro de eliminar el aula "${identificador}"?`)) {
            confirmarEliminar(id);
        }
    }
}

async function confirmarEliminar(id) {
    try {
        const res = await fetch(`/api/admin/aulas/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Aula eliminada correctamente', 'success');
            cerrarConfirmModal();
            cargarAulas();
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
// CONFIGURAR EVENTOS
// =====================================================
function configurarEventos() {
    // Búsqueda
    const searchInput = document.getElementById('searchAula');
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
                mostrarAulas(filteredData);
                actualizarPaginacion();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                mostrarAulas(filteredData);
                actualizarPaginacion();
            }
        });
    }
}

// =====================================================
// FORMULARIO (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('aulaForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const id = document.getElementById('aula-id').value;
            const identificadorInput = document.getElementById('aula-identificador');
            const edificioSelect = document.getElementById('aula-edificio');
            const tipoSelect = document.getElementById('aula-tipo');
            const pisoSelect = document.getElementById('aula-piso');
            const capacidadInput = document.getElementById('aula-capacidad');
            const carreraSelect = document.getElementById('aula-carrera');
            const activoSelect = document.getElementById('aula-activo');
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitBtnText');
            
            if (!identificadorInput || !edificioSelect || !tipoSelect || !pisoSelect || !capacidadInput) {
                showToast('Error: Faltan campos en el formulario', 'error');
                return;
            }
            
            const data = {
                identificador: identificadorInput.value.trim(),
                id_edificio: parseInt(edificioSelect.value),
                id_tipo_aula: parseInt(tipoSelect.value),
                piso: pisoSelect.value,
                capacidad: parseInt(capacidadInput.value),
                id_carrera_asignada: carreraSelect && carreraSelect.value ? parseInt(carreraSelect.value) : null,
                activo: activoSelect ? parseInt(activoSelect.value) : 1
            };

            // Validaciones
            if (!data.identificador) {
                showToast('El identificador es requerido', 'error');
                identificadorInput.focus();
                return;
            }
            
            if (data.identificador.length < 2) {
                showToast('El identificador debe tener al menos 2 caracteres', 'error');
                identificadorInput.focus();
                return;
            }
            
            if (!data.id_edificio || isNaN(data.id_edificio)) {
                showToast('Selecciona un edificio', 'error');
                edificioSelect.focus();
                return;
            }
            
            if (!data.id_tipo_aula || isNaN(data.id_tipo_aula)) {
                showToast('Selecciona un tipo de espacio', 'error');
                tipoSelect.focus();
                return;
            }
            
            if (!data.piso) {
                showToast('Selecciona un piso', 'error');
                pisoSelect.focus();
                return;
            }
            
            if (!data.capacidad || data.capacidad < 1) {
                showToast('La capacidad debe ser al menos 1 lugar', 'error');
                capacidadInput.focus();
                return;
            }
            
            if (data.capacidad > 500) {
                showToast('La capacidad no puede ser mayor a 500 lugares', 'error');
                capacidadInput.focus();
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
            }

            try {
                let url = '/api/admin/aulas';
                let method = 'POST';

                if (id) {
                    url = `/api/admin/aulas/${id}`;
                    method = 'PUT';
                }

                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    const message = id ? 'Aula actualizada correctamente' : 'Aula creada correctamente';
                    showToast(message, 'success');
                    cerrarModal();
                    cargarAulas();
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
    }
});

// =====================================================
// INICIALIZAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    if (typeof mostrarUsuario === 'function') {
        mostrarUsuario();
    }
    
    cargarSelects();
    cargarAulas();
    configurarEventos();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const aulaModal = document.getElementById('aulaModal');
            const confirmModal = document.getElementById('confirmModal');
            if (aulaModal && aulaModal.classList.contains('active')) {
                cerrarModal();
            }
            if (confirmModal && confirmModal.classList.contains('active')) {
                cerrarConfirmModal();
            }
        }
    });
    
    // Cerrar modales al hacer clic fuera
    const aulaModal = document.getElementById('aulaModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (aulaModal) {
        aulaModal.addEventListener('click', function(e) {
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
window.cargarAulas = cargarAulas;
window.abrirModalCrear = abrirModalCrear;
window.cerrarModal = cerrarModal;
window.editarAula = editarAula;
window.eliminarAula = eliminarAula;
window.cerrarConfirmModal = cerrarConfirmModal;
window.limpiarFiltros = limpiarFiltros;
window.showToast = showToast;