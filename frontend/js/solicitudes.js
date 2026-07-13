/**
 * SIGAE - LÓGICA DE SOLICITUDES (EVENTOS)
 * Archivo: frontend/js/solicitudes.js
 * 
 * Mejoras UI/UX:
 * - Filtros por estado
 * - Estadísticas en tiempo real
 * - Toast notifications
 * - Mejoras visuales
 */

let solicitudesData = [];
let filtroActual = 'todas';

// =====================================================
// CARGAR SOLICITUDES (TU LÓGICA ORIGINAL)
// =====================================================
async function cargarSolicitudes() {
    try {
        // Obtener usuario autenticado
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const res = await fetch('/api/solicitudes', {
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        solicitudesData = await res.json();
        mostrarSolicitudes(solicitudesData);
        actualizarEstadisticas(solicitudesData);
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        document.getElementById('solicitudes-list').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i>
                <h3>Error al cargar solicitudes</h3>
                <p>${error.message || 'Error de conexión con el servidor'}</p>
                <button class="btn-primary" onclick="cargarSolicitudes()" style="margin-top: 15px;">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// =====================================================
// ACTUALIZAR ESTADÍSTICAS (NUEVO - UI/UX)
// =====================================================
function actualizarEstadisticas(solicitudes) {
    if (!solicitudes) solicitudes = solicitudesData || [];
    
    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    const aprobadas = solicitudes.filter(s => s.estado === 'aprobada').length;
    const rechazadas = solicitudes.filter(s => s.estado === 'rechazada').length;
    
    const totalEl = document.getElementById('totalSolicitudes');
    const pendientesEl = document.getElementById('solicitudesPendientes');
    const aprobadasEl = document.getElementById('solicitudesAprobadas');
    const rechazadasEl = document.getElementById('solicitudesRechazadas');
    
    if (totalEl) totalEl.textContent = total;
    if (pendientesEl) pendientesEl.textContent = pendientes;
    if (aprobadasEl) aprobadasEl.textContent = aprobadas;
    if (rechazadasEl) rechazadasEl.textContent = rechazadas;
}

// =====================================================
// FILTRAR SOLICITUDES (NUEVO - UI/UX)
// =====================================================
function filtrarSolicitudes(filtro) {
    filtroActual = filtro;
    
    // Actualizar botones de filtro
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        const isActive = btn.dataset.filtro === filtro;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    
    let filtradas = [...solicitudesData];
    
    if (filtro !== 'todas') {
        filtradas = filtradas.filter(s => s.estado === filtro);
    }
    
    mostrarSolicitudes(filtradas);
}

// =====================================================
// MOSTRAR SOLICITUDES (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarSolicitudes(solicitudes) {
    const container = document.getElementById('solicitudes-list');
    
    if (!solicitudes || solicitudes.length === 0) {
        const mensaje = filtroActual !== 'todas' 
            ? `No hay solicitudes ${filtroActual === 'pendiente' ? 'pendientes' : filtroActual === 'aprobada' ? 'aprobadas' : 'rechazadas'}`
            : 'No hay solicitudes';
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>${mensaje}</h3>
                <p class="sub-text">Solicita un espacio externo para eventos o actividades especiales</p>
                ${filtroActual !== 'todas' ? `
                    <button class="btn-primary" onclick="filtrarSolicitudes('todas')" style="margin-top: 15px;">
                        <i class="fas fa-list"></i> Ver todas
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = solicitudes.map((s, index) => {
        const estadoClass = `estado-${s.estado}`;
        const cardClass = s.estado === 'pendiente' ? '' : s.estado;
        const isPendiente = s.estado === 'pendiente';
        const fechaFormateada = s.fecha_uso ? new Date(s.fecha_uso).toLocaleDateString('es-MX') : 'No definida';
        
        // Iconos según estado
        const estadoIcon = s.estado === 'pendiente' ? 'fa-clock' : 
                          s.estado === 'aprobada' ? 'fa-check-circle' : 'fa-times-circle';
        
        return `
            <div class="solicitud-card ${cardClass}" style="animation-delay: ${index * 0.05}s;">
                <div class="solicitud-header">
                    <div class="solicitante-info">
                        <img src="${s.solicitante_foto || '/img/avatar.png'}" alt="Foto" class="foto-miniatura" loading="lazy">
                        <div>
                            <span class="solicitante-nombre">${s.solicitante_nombre || 'Usuario'}</span>
                            <span class="solicitante-fecha">${s.fecha_solicitud || 'Fecha no disponible'}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span style="font-size: 0.75rem; color: #adb5bd; font-weight: 500;">REQ-${String(s.id_solicitud).padStart(3, '0')}</span>
                        <span class="solicitud-estado ${estadoClass}">
                            <i class="fas ${estadoIcon}"></i>
                            ${s.estado ? s.estado.toUpperCase() : 'PENDIENTE'}
                        </span>
                    </div>
                </div>
                <div class="solicitud-body">
                    <div class="campo">
                        <span class="label">Espacio</span>
                        <span class="value">${s.edificio_nombre || 'Sin edificio'} · ${s.aula_nombre || 'Sin aula'}</span>
                    </div>
                    <div class="campo">
                        <span class="label">Fecha de uso</span>
                        <span class="value">${fechaFormateada}</span>
                    </div>
                    <div class="campo">
                        <span class="label">Turno</span>
                        <span class="value">${s.nombre_turno || 'No especificado'}</span>
                    </div>
                    <div class="campo">
                        <span class="label">Bloque</span>
                        <span class="value">${s.bloque_hora || 'No especificado'}</span>
                    </div>
                    <div class="motivo">
                        <span class="label">Justificación</span>
                        <span class="value">${s.motivo || 'Sin justificación'}</span>
                    </div>
                    ${s.respuesta_comentario ? `
                        <div class="motivo">
                            <span class="label">Comentario</span>
                            <span class="value" style="background: #f8f9fa; padding: 8px 12px; border-radius: 6px; font-weight: 400; color: #495057;">${s.respuesta_comentario}</span>
                        </div>
                    ` : ''}
                </div>
                ${isPendiente ? `
                    <div class="solicitud-acciones">
                        <button class="btn-approve" onclick="responderSolicitud(${s.id_solicitud}, 'aprobada')">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn-reject" onclick="responderSolicitud(${s.id_solicitud}, 'rechazada')">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// =====================================================
// RESPONDER SOLICITUD (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
window.responderSolicitud = async function(id, estado) {
    const accion = estado === 'aprobada' ? 'aprobar' : 'rechazar';
    const btnText = estado === 'aprobada' ? 'Aprobar' : 'Rechazar';
    const confirmado = await showConfirm(
        `¿Estás seguro de ${accion} esta solicitud?`,
        null,
        null,
        btnText
    );
    if (!confirmado) return;
    
    // Obtener usuario autenticado
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
        
    try {
        const res = await fetch(`/api/solicitudes/${id}/responder`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-Id': user ? user.id : '1'
            },
            body: JSON.stringify({ estado, comentario: '' })
        });
        
        if (res.ok) {
            showToast(`Solicitud ${estado} correctamente`, 'success');
            cargarSolicitudes();
        } else {
            const data = await res.json();
            showToast(data.error || 'Error al responder', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
    // Después de responder una solicitud, actualizar notificaciones
// Busca esta parte en tu código:

if (res.ok) {
    showToast(`Solicitud ${estado} correctamente`, 'success');
    cargarSolicitudes();
    
    // ACTUALIZAR NOTIFICACIONES DESPUÉS DE RESPONDER
    if (typeof verificarNotificaciones === 'function') {
        verificarNotificaciones();
    }
}
};

// =====================================================
// CARGAR EDIFICIOS Y ESPACIOS (TU LÓGICA ORIGINAL)
// =====================================================
async function cargarEdificiosYEspacios() {
    try {
        // Obtener usuario autenticado
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const resEdificios = await fetch('/api/infraestructura/edificios', {
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        const edificios = await resEdificios.json();
        
        const selectEdificio = document.getElementById('solicitud-edificio');
        if (selectEdificio) {
            selectEdificio.innerHTML = `
                <option value="">Seleccionar edificio</option>
                ${edificios.map(e => `
                    <option value="${e.id_edificio}">${e.nombre}</option>
                `).join('')}
            `;
        }
        
        // Cargar espacios al seleccionar un edificio
        if (selectEdificio) {
            selectEdificio.addEventListener('change', async function() {
                const edificioId = this.value;
                const selectAula = document.getElementById('solicitud-aula');
                
                if (!edificioId) {
                    if (selectAula) selectAula.innerHTML = '<option value="">Seleccionar espacio...</option>';
                    return;
                }
                
                try {
                    // Obtener usuario autenticado
                    const userStr = localStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    
                    const resAulas = await fetch(`/api/infraestructura/edificios/${edificioId}/aulas`, {
                        headers: {
                            'X-User-Id': user ? user.id : '1'
                        }
                    });
                    const aulas = await resAulas.json();
                    
                    if (selectAula) {
                        selectAula.innerHTML = `
                            <option value="">Seleccionar espacio...</option>
                            ${aulas.map(a => `
                                <option value="${a.id_aula}">${a.identificador} (${a.tipo || 'Aula'})</option>
                            `).join('')}
                        `;
                    }
                } catch (error) {
                    console.error('Error cargando espacios:', error);
                    showToast('Error al cargar espacios', 'error');
                }
            });
        }
        
    } catch (error) {
        console.error('Error cargando edificios:', error);
        showToast('Error al cargar edificios', 'error');
    }
}

// =====================================================
// CARGAR BLOQUES SEGÚN TURNO (TU LÓGICA ORIGINAL)
// =====================================================
async function cargarBloquesPorTurno() {
    const turnoSelect = document.getElementById('solicitud-turno');
    const bloqueSelect = document.getElementById('solicitud-bloque');
    
    if (!turnoSelect || !bloqueSelect) return;
    
    turnoSelect.addEventListener('change', async function() {
        const turnoId = this.value;
        
        if (!turnoId) {
            bloqueSelect.innerHTML = '<option value="">Seleccionar bloque</option>';
            return;
        }
        
        try {
            const res = await fetch('/api/reservas/bloques');
            const bloques = await res.json();
            
            // Filtrar bloques por turno
            const bloquesFiltrados = bloques.filter(b => {
                const hora = parseInt(b.hora_inicio.substring(0, 2));
                if (turnoId === '1') {
                    return hora < 15;
                } else {
                    return hora >= 15;
                }
            });
            
            bloqueSelect.innerHTML = `
                <option value="">Seleccionar bloque</option>
                ${bloquesFiltrados.map(b => `
                    <option value="${b.id_bloque}">${b.hora_inicio} - ${b.hora_fin}</option>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error cargando bloques:', error);
            showToast('Error al cargar bloques', 'error');
        }
    });
}

// =====================================================
// MODAL CREAR SOLICITUD (TU LÓGICA ORIGINAL)
// =====================================================
window.abrirModalCrear = function() {
    console.log(' Abriendo modal de solicitud');
    const modal = document.getElementById('solicitudModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Limpiar formulario
        const form = document.getElementById('solicitudForm');
        if (form) form.reset();
        
        // Resetear selects
        const edificioSelect = document.getElementById('solicitud-edificio');
        const aulaSelect = document.getElementById('solicitud-aula');
        const bloqueSelect = document.getElementById('solicitud-bloque');
        
        if (edificioSelect) edificioSelect.value = '';
        if (aulaSelect) aulaSelect.innerHTML = '<option value="">Seleccionar espacio...</option>';
        if (bloqueSelect) bloqueSelect.innerHTML = '<option value="">Seleccionar bloque</option>';
    } else {
        console.error('❌ Modal no encontrado');
    }
    if (res.ok) {
    showToast('Solicitud enviada exitosamente', 'success');
    window.cerrarModal();
    document.getElementById('solicitudForm').reset();
    cargarSolicitudes();
    
    // ACTUALIZAR NOTIFICACIONES DESPUÉS DE CREAR
    if (typeof verificarNotificaciones === 'function') {
        verificarNotificaciones();
    }
}
};

window.cerrarModal = function() {
    const modal = document.getElementById('solicitudModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.cerrarConfirmModal = function() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// =====================================================
// FORMULARIO CREAR SOLICITUD (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('solicitudForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener usuario del localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            if (!user) {
                showToast('Debes iniciar sesión para crear una solicitud', 'error');
                return;
            }
            
            const data = {
                id_aula: parseInt(document.getElementById('solicitud-aula').value),
                id_dia: parseInt(document.getElementById('solicitud-dia').value),
                id_bloque: parseInt(document.getElementById('solicitud-bloque').value),
                id_turno: parseInt(document.getElementById('solicitud-turno').value),
                motivo: document.getElementById('solicitud-motivo').value,
                id_solicitante: user.id
            };    

            if (!data.id_aula || !data.id_dia || !data.id_bloque || !data.id_turno || !data.motivo) {
                showToast('Por favor completa todos los campos', 'error');
                return;
            }
            
            // Validar motivo mínimo de caracteres
            if (data.motivo.length < 10) {
                showToast('La justificación debe tener al menos 10 caracteres', 'error');
                document.getElementById('solicitud-motivo').focus();
                return;
            }
            
            // Deshabilitar botón
            const submitBtn = document.getElementById('solicitudSubmitBtn');
            const submitText = document.getElementById('solicitudSubmitText');
            if (submitBtn) {
                submitBtn.disabled = true;
                if (submitText) submitText.textContent = 'Enviando...';
            }
            
            try {
                const res = await fetch('/api/solicitudes', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-User-Id': user.id
                    },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showToast('Solicitud enviada exitosamente', 'success');
                    window.cerrarModal();
                    document.getElementById('solicitudForm').reset();
                    cargarSolicitudes();
                } else {
                    const error = await res.json();
                    showToast(error.error || 'Error al crear solicitud', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error de conexión', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitText) submitText.textContent = 'Enviar Solicitud';
                }
            }
        });
    }
});

// =====================================================
// SHOW TOAST (FALLBACK SI NO ESTÁ EN UTILS)
// =====================================================
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
// SHOW CONFIRM (FALLBACK SI NO ESTÁ EN UTILS)
// =====================================================
function showConfirm(message, detail, confirmText) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) {
            resolve(confirm(message));
            return;
        }
        
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDetail = document.getElementById('confirmDetail');
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        if (confirmMessage) confirmMessage.textContent = message;
        if (confirmDetail) confirmDetail.textContent = detail || 'Esta acción no se puede deshacer.';
        if (confirmBtn) confirmBtn.textContent = confirmText || 'Confirmar';
        
        confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            newBtn.addEventListener('click', function() {
                confirmModal.classList.remove('active');
                document.body.style.overflow = '';
                resolve(true);
            });
        }
        
        // Cerrar con cancelar
        const cancelBtn = confirmModal.querySelector('.btn-secondary');
        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            
            newCancelBtn.addEventListener('click', function() {
                confirmModal.classList.remove('active');
                document.body.style.overflow = '';
                resolve(false);
            });
        }
    });
}

// =====================================================
// INICIALIZAR (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando solicitudes');
    
    if (typeof mostrarUsuario === 'function') {
        mostrarUsuario();
    }
    
    cargarSolicitudes();
    cargarEdificiosYEspacios();
    cargarBloquesPorTurno();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const solicitudModal = document.getElementById('solicitudModal');
            const confirmModal = document.getElementById('confirmModal');
            
            if (solicitudModal && solicitudModal.classList.contains('active')) {
                window.cerrarModal();
            }
            if (confirmModal && confirmModal.classList.contains('active')) {
                window.cerrarConfirmModal();
            }
        }
    });
    
    // Cerrar modales al hacer clic fuera
    const solicitudModal = document.getElementById('solicitudModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (solicitudModal) {
        solicitudModal.addEventListener('click', function(e) {
            if (e.target === this) window.cerrarModal();
        });
    }
    
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === this) window.cerrarConfirmModal();
        });
    }
});
