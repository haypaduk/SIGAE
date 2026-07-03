/**
 * SIGAE - LÓGICA DE SOLICITUDES (EVENTOS)
 * Archivo: frontend/js/solicitudes.js
 */

let solicitudesData = [];

// =====================================================
// CARGAR SOLICITUDES
// =====================================================
async function cargarSolicitudes() {
    try {
        const res = await fetch('/api/solicitudes');
        solicitudesData = await res.json();
        mostrarSolicitudes(solicitudesData);
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        document.getElementById('solicitudes-list').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i>
                <p>Error al cargar solicitudes</p>
            </div>
        `;
    }
}

function mostrarSolicitudes(solicitudes) {
    const container = document.getElementById('solicitudes-list');
    
    if (!solicitudes || solicitudes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No hay solicitudes</p>
                <p class="sub-text">Solicita un espacio externo para eventos o actividades especiales</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = solicitudes.map(s => {
        const estadoClass = `estado-${s.estado}`;
        const cardClass = s.estado === 'pendiente' ? '' : s.estado;
        const isPendiente = s.estado === 'pendiente';
        const fechaFormateada = new Date(s.fecha_uso).toLocaleDateString('es-MX');
        
        return `
            <div class="solicitud-card ${cardClass}">
                <div class="solicitud-header">
                    <div class="solicitante-info">
                        <img src="${s.solicitante_foto || '/img/avatar.png'}" alt="Foto" class="foto-miniatura">
                        <span><strong>${s.solicitante_nombre}</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.8rem; color: #999;">REQ-${String(s.id_solicitud).padStart(3, '0')}</span>
                        <span class="solicitud-estado ${estadoClass}">${s.estado.toUpperCase()}</span>
                    </div>
                </div>
                <div class="solicitud-body">
                    <div><span class="label">Enviada:</span> <span class="value">${s.fecha_solicitud}</span></div>
                    <div><span class="label">Espacio:</span> <span class="value">${s.edificio_nombre} · ${s.aula_nombre}</span></div>
                    <div><span class="label">Fecha de uso:</span> <span class="value">${fechaFormateada}</span></div>
                    <div><span class="label">Turno:</span> <span class="value">${s.nombre_turno}</span></div>
                    <div class="motivo"><span class="label">Justificación:</span> <span class="value">${s.motivo}</span></div>
                    ${s.respuesta_comentario ? `<div class="motivo"><span class="label">Comentario:</span> <span class="value">${s.respuesta_comentario}</span></div>` : ''}
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
// RESPONDER SOLICITUD
// =====================================================
window.responderSolicitud = async function(id, estado) {
    const accion = estado === 'aprobada' ? 'aprobar' : 'rechazar';
    const btnText = estado === 'aprobada' ? 'Aprobar' : 'Rechazar';
    const confirmado = await showConfirm(
        `¿Estás seguro de ${accion} esta solicitud?`,
        null,
        null,
        btnText  // ← Pasar el texto del botón
    );
    if (!confirmado) return;
        
    try {
        const res = await fetch(`/api/solicitudes/${id}/responder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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
};

// =====================================================
// CARGAR EDIFICIOS Y ESPACIOS
// =====================================================
async function cargarEdificiosYEspacios() {
    try {
        const resEdificios = await fetch('/api/infraestructura/edificios');
        const edificios = await resEdificios.json();
        
        const selectEdificio = document.getElementById('solicitud-edificio');
        selectEdificio.innerHTML = `
            <option value="">Seleccionar edificio</option>
            ${edificios.map(e => `
                <option value="${e.id_edificio}">${e.nombre}</option>
            `).join('')}
        `;
        
        // Cargar espacios al seleccionar un edificio
        selectEdificio.addEventListener('change', async function() {
            const edificioId = this.value;
            const selectAula = document.getElementById('solicitud-aula');
            
            if (!edificioId) {
                selectAula.innerHTML = '<option value="">Seleccionar espacio...</option>';
                return;
            }
            
            try {
                const resAulas = await fetch(`/api/infraestructura/edificios/${edificioId}/aulas`);
                const aulas = await resAulas.json();
                
                selectAula.innerHTML = `
                    <option value="">Seleccionar espacio...</option>
                    ${aulas.map(a => `
                        <option value="${a.id_aula}">${a.identificador} (${a.tipo || 'Aula'})</option>
                    `).join('')}
                `;
            } catch (error) {
                console.error('Error cargando espacios:', error);
                showToast('Error al cargar espacios', 'error');
            }
        });
        
    } catch (error) {
        console.error('Error cargando edificios:', error);
        showToast('Error al cargar edificios', 'error');
    }
}

// =====================================================
// MODAL CREAR SOLICITUD
// =====================================================
window.abrirModalCrear = function() {
    console.log(' Abriendo modal de solicitud');
    const modal = document.getElementById('solicitudModal');
    if (modal) {
        modal.classList.add('active');
        // document.getElementById('solicitud-fecha').value = new Date().toISOString().split('T')[0]; --> Eliminado para permitir selección de fecha
    } else {
        console.error('❌ Modal no encontrado');
    }
};

window.cerrarModal = function() {
    const modal = document.getElementById('solicitudModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// =====================================================
// FORMULARIO CREAR SOLICITUD
// =====================================================
document.getElementById('solicitudForm').addEventListener('submit', async function(e) {
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
        id_dia: parseInt(document.getElementById('solicitud-dia').value),      // ← Nuevo
        id_bloque: parseInt(document.getElementById('solicitud-bloque').value), // ← Nuevo
        id_turno: parseInt(document.getElementById('solicitud-turno').value),
        motivo: document.getElementById('solicitud-motivo').value,
        id_solicitante: user.id
    };    

    if (!data.id_aula || !data.id_dia || !data.id_bloque || !data.id_turno || !data.motivo) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        const res = await fetch('/api/solicitudes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    }
});

// =====================================================
// CARGAR BLOQUES SEGÚN TURNO
// =====================================================
async function cargarBloquesPorTurno() {
    const turnoSelect = document.getElementById('solicitud-turno');
    const bloqueSelect = document.getElementById('solicitud-bloque');
    
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
                // Los bloques matutinos tienen hora_inicio < 15:00
                const hora = b.hora_inicio.substring(0, 2);
                if (turnoId === '1') {
                    return parseInt(hora) < 15;
                } else {
                    return parseInt(hora) >= 15;
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
// INICIALIZAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando solicitudes');
    mostrarUsuario();
    cargarSolicitudes();
    cargarEdificiosYEspacios();
    cargarBloquesPorTurno();
});