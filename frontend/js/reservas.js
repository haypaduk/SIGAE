/**
 * SIGAE - LÓGICA DE RESERVAS
 * Archivo: frontend/js/reservas.js
 * 
 * Funciones para gestionar reservas:
 * - Ver horario de un aula
 * - Crear reserva
 * - Editar reserva
 * - Eliminar reserva
 */

// =====================================================
// VARIABLES GLOBALES
// =====================================================
let currentAulaId = null;
let currentAulaData = null;
let reservasData = [];
let materiasData = [];
let profesoresData = [];
let diasData = [];
let bloquesData = [];
let turnoActivo = 'matutino'; 


// =====================================================
// CARGAR DATOS PARA RESERVAS
// =====================================================
async function cargarDatosReservas() {
    try {
        const [materiasRes, profesoresRes, diasRes, bloquesRes] = await Promise.all([
            fetch('/api/reservas/materias'),
            fetch('/api/reservas/profesores'),
            fetch('/api/reservas/dias'),
            fetch('/api/reservas/bloques')
        ]);
        
        materiasData = await materiasRes.json();
        profesoresData = await profesoresRes.json();
        diasData = await diasRes.json();
        bloquesData = await bloquesRes.json();
        
        // Llenar selects del modal
        llenarSelects();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar datos para reservas', 'error');
    }
}

function llenarSelects() {
    const materiaSelect = document.getElementById('reserva-materia');
    const profesorSelect = document.getElementById('reserva-profesor');
    const diaSelect = document.getElementById('reserva-dia');
    const bloqueSelect = document.getElementById('reserva-bloque');
    
    materiaSelect.innerHTML = '<option value="">Seleccionar materia</option>' +
        materiasData.map(m => 
            `<option value="${m.id_materia}">${m.clave} - ${m.nombre}</option>`
        ).join('');
    
    profesorSelect.innerHTML = '<option value="">Seleccionar profesor</option>' +
        profesoresData.map(p => 
            `<option value="${p.id_profesor}">${p.clave} - ${p.nombre_completo}</option>`
        ).join('');
    
    diaSelect.innerHTML = '<option value="">Seleccionar día</option>' +
        diasData.map(d => 
            `<option value="${d.id_dia}">${d.nombre_dia}</option>`
        ).join('');
    
    bloqueSelect.innerHTML = '<option value="">Seleccionar bloque</option>' +
        bloquesData.map(b => 
            `<option value="${b.id_bloque}">${b.hora_inicio} - ${b.hora_fin}</option>`
        ).join('');
}

// =====================================================
// CARGAR HORARIO DE UN AULA
// =====================================================
async function cargarHorario(aulaId) {
    currentAulaId = aulaId;
    
    try {
        // Obtener usuario autenticado
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        // Obtener datos del aula
        const aulaRes = await fetch(`/api/infraestructura/aula/${aulaId}`, {
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        const aulaData = await aulaRes.json();
        currentAulaData = aulaData;
        
        // Obtener reservas
        const res = await fetch(`/api/reservas/aula/${aulaId}/semana`, {
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        reservasData = await res.json();
        
        mostrarHorario(reservasData);
    } catch (error) {
        console.error('Error cargando horario:', error);
        showToast('Error al cargar el horario', 'error');
    }
}

// =====================================================
// MOSTRAR HORARIO
// =====================================================
function mostrarHorario(reservas) {
    const container = document.getElementById('horario-container');
    if (!container) return;
    
    if (!currentAulaData) {
        container.innerHTML = '<p>Error: No se pudo cargar los datos del aula</p>';
        return;
    }
    
    const aula = currentAulaData;
    
    // Filtrar bloques según el turno activo
    let bloquesFiltrados = [];
    if (turnoActivo === 'matutino') {
        bloquesFiltrados = bloquesData.filter(b => {
            const hora = b.hora_inicio.substring(0, 2);
            return parseInt(hora) < 15 || (parseInt(hora) === 15 && parseInt(b.hora_inicio.substring(3, 5)) === 0);
        });
    } else {
        bloquesFiltrados = bloquesData.filter(b => {
            const hora = b.hora_inicio.substring(0, 2);
            return parseInt(hora) >= 15 && !(parseInt(hora) === 15 && parseInt(b.hora_inicio.substring(3, 5)) === 0);
        });
    }
    
    // Calcular bloques ocupados
    const totalBloques = diasData.length * bloquesFiltrados.length;
    const ocupados = reservas.filter(r => {
        const bloque = bloquesData.find(b => b.id_bloque === r.id_bloque);
        if (!bloque) return false;
        const hora = bloque.hora_inicio.substring(0, 2);
        if (turnoActivo === 'matutino') {
            return parseInt(hora) < 15 || (parseInt(hora) === 15 && parseInt(bloque.hora_inicio.substring(3, 5)) === 0);
        } else {
            return parseInt(hora) >= 15 && !(parseInt(hora) === 15 && parseInt(bloque.hora_inicio.substring(3, 5)) === 0);
        }
    }).length;
    
    // Obtener lista de carreras del edificio (desde la BD)
    const carreras = aula.carreras_edificio || [];
    
    let html = `
        <!-- ===== ENCABEZADO FIJO ===== -->
        <div class="horario-fixed-header">
            <!-- Encabezado del horario -->
            <div class="horario-header">
                <div class="horario-titulo-aula">
                    <h2><i class="fas fa-chalkboard"></i> ${aula.identificador}</h2>
                    <p><i class="fas fa-layer-group"></i> ${aula.piso} · <i class="fas fa-users"></i> ${aula.capacidad} lugares</p>
                </div>
                <div class="horario-subtitulo">
                    <h4><i class="fas fa-calendar-alt"></i> Gestión de Horario — ${aula.edificio_nombre || 'Edificio'}</h4>
                </div>
            </div>
            
            <!-- Turnos y resumen -->
            <div class="horario-info">
                <div class="horario-turnos">
                    <span class="turno turno-matutino ${turnoActivo === 'matutino' ? 'turno-activo' : ''}" onclick="cambiarTurno('matutino')">
                        <i class="fas fa-sun"></i> Matutino 07:00–15:20
                    </span>
                    <span class="turno turno-vespertino ${turnoActivo === 'vespertino' ? 'turno-activo' : ''}" onclick="cambiarTurno('vespertino')">
                        <i class="fas fa-moon"></i> Vespertino 15:20–21:10
                    </span>
                </div>
                <div class="horario-resumen">
                    <span class="resumen-bloques"><strong>${ocupados}</strong> de <strong>${totalBloques}</strong> bloques asignados</span>
                    <span class="resumen-turno"><i class="fas fa-clock"></i> Turno ${turnoActivo === 'matutino' ? 'matutino' : 'vespertino'}</span>
                    <span class="resumen-director"><i class="fas fa-user-tie"></i> Director ${aula.carrera_clave || '—'} — edición restringida a tus registros</span>
                </div>
            </div>
        </div>
        
        <!-- ===== TABLA CON SCROLL ===== -->
        <div class="horario-scroll-wrapper">
            <table class="horario-table">
                <thead>
                    <tr>
                        <th>Hora</th>
                        ${diasData.map(d => `<th>${d.nombre_dia}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Para cada bloque del turno seleccionado
    bloquesFiltrados.forEach(bloque => {
        const horaInicio = bloque.hora_inicio.substring(0, 5);
        const horaFin = bloque.hora_fin.substring(0, 5);
        html += `<tr><td class="hora">${horaInicio}–${horaFin}</td>`;
        
        diasData.forEach(dia => {
            const reserva = reservas.find(r => r.id_dia === dia.id_dia && r.id_bloque === bloque.id_bloque);
            
            if (reserva) {
                // =============================================
                // DETERMINAR SI ES EVENTO O CLASE
                // =============================================
                const esEvento = reserva.tipo_reserva === 'evento';
                let nombreMostrar = '';
                let profesorMostrar = '';
                let grupoMostrar = '';
                let tooltipText = '';
                
                if (esEvento) {
                    // Si es evento, mostrar el nombre del evento y solicitante
                    nombreMostrar = reserva.evento_nombre || 'Evento';
                    profesorMostrar = `📋 Solicitado por: ${reserva.solicitante_nombre || 'Director'}`;
                    grupoMostrar = reserva.grupo || '';
                    tooltipText = `${reserva.evento_nombre || 'Evento'}\nSolicitado por: ${reserva.solicitante_nombre || 'Director'}\n${reserva.grupo || ''}`;
                } else {
                    // Si es clase normal
                    nombreMostrar = reserva.materia_nombre || reserva.materia_clave || '';
                    profesorMostrar = reserva.profesor_nombre || reserva.profesor_clave || '';
                    grupoMostrar = reserva.grupo || '';
                    tooltipText = `${reserva.materia_nombre || reserva.materia_clave || ''}\n${reserva.profesor_nombre || reserva.profesor_clave || ''}\n${reserva.grupo || ''}`;
                }
                
                html += `
                    <td class="ocupado" data-reserva-id="${reserva.id_reserva}" title="${tooltipText}">
                        <div class="materia"><strong>${nombreMostrar}</strong></div>
                        <div class="profesor">${profesorMostrar}</div>
                        <div class="grupo">${grupoMostrar}</div>
                        <div class="acciones">
                            <button class="btn-sm btn-warning" onclick="editarReserva(${reserva.id_reserva})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-sm btn-danger" onclick="eliminarReserva(${reserva.id_reserva})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
            } else {
                html += `
                    <td class="disponible" onclick="abrirModalCrear(${dia.id_dia}, ${bloque.id_bloque})">
                        <button class="btn-agregar" title="Agregar reserva">+</button>
                    </td>
                `;
            }
        });
        
        html += `</tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <!-- ===== PIE FIJO ===== -->
        <div class="horario-fixed-footer">
            <!-- Leyenda de carreras -->
            <div class="horario-leyenda">
                <span class="leyenda-label"><i class="fas fa-tags"></i> Carreras:</span>
                ${carreras.length > 0 ? carreras.map(c => `<span class="leyenda-item">${c}</span>`).join('') : '<span class="leyenda-item">Sin carreras asignadas</span>'}
            </div>
            
            <!-- Mensaje final -->
            <div class="horario-mensaje">
                <i class="fas fa-plus-circle" style="color: #27ae60; margin-right: 8px;"></i>
                Clic en celda vacía para asignar
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// =====================================================
// CAMBIAR TURNO
// =====================================================
function cambiarTurno(turno) {
    if (turno === turnoActivo) return;
    turnoActivo = turno;
    cargarHorario(currentAulaId);
}

// =====================================================
// CREAR RESERVA
// =====================================================
function abrirModalCrear(diaId, bloqueId) {
    document.getElementById('modal-title').textContent = 'Nueva Reserva';
    document.getElementById('reserva-id').value = '';
    document.getElementById('reserva-dia').value = diaId;
    document.getElementById('reserva-bloque').value = bloqueId;
    document.getElementById('reserva-materia').value = '';
    document.getElementById('reserva-profesor').value = '';
    document.getElementById('reserva-grupo').value = '';
    document.getElementById('reserva-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('reservaModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('reservaModal').classList.remove('active');
}

// =====================================================
// EDITAR RESERVA
// =====================================================
function editarReserva(id) {
    const reserva = reservasData.find(r => r.id_reserva === id);
    if (!reserva) return;
    
    document.getElementById('modal-title').textContent = 'Editar Reserva';
    document.getElementById('reserva-id').value = reserva.id_reserva;
    document.getElementById('reserva-dia').value = reserva.id_dia;
    document.getElementById('reserva-bloque').value = reserva.id_bloque;
    document.getElementById('reserva-materia').value = reserva.id_materia;
    document.getElementById('reserva-profesor').value = reserva.id_profesor;
    document.getElementById('reserva-grupo').value = reserva.grupo;
    document.getElementById('reserva-fecha').value = reserva.fecha_asignacion;
    document.getElementById('reservaModal').classList.add('active');
}

// =====================================================
// ELIMINAR RESERVA
// =====================================================
async function eliminarReserva(id) {
    const confirmado = await showConfirm('¿Estás seguro de cancelar esta reserva?', null, null);
    if (!confirmado) return;
    
    // Obtener usuario autenticado para la petición
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    try {
        const res = await fetch(`/api/reservas/${id}`, { 
            method: 'DELETE',
            headers: {
                'X-User-Id': user ? user.id : '1'
            }
        });
        if (res.ok) {
            showToast('Reserva cancelada correctamente', 'success');
            cargarHorario(currentAulaId);
        } else {
            const data = await res.json();
            showToast(data.error || 'Error al cancelar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

// =====================================================
// FORMULARIO DE RESERVA
// =====================================================
document.getElementById('reservaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obtener usuario autenticado
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const id = document.getElementById('reserva-id').value;
    const data = {
        id_aula: currentAulaId,
        id_dia: parseInt(document.getElementById('reserva-dia').value),
        id_bloque: parseInt(document.getElementById('reserva-bloque').value),
        id_materia: parseInt(document.getElementById('reserva-materia').value),
        id_profesor: parseInt(document.getElementById('reserva-profesor').value),
        grupo: document.getElementById('reserva-grupo').value,
        fecha_asignacion: document.getElementById('reserva-fecha').value
    };
    
    // Validaciones
    if (!data.id_dia || !data.id_bloque || !data.id_materia || !data.id_profesor || !data.grupo || !data.fecha_asignacion) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        let url = '/api/reservas';
        let method = 'POST';
        
        // Headers con autenticación
        const headers = {
            'Content-Type': 'application/json',
            'X-User-Id': user ? user.id : '1'
        };
        
        if (id) {
            url = `/api/reservas/${id}`;
            method = 'PUT';
            // Para editar, solo enviamos materia, profesor y grupo
            const editData = {
                id_materia: data.id_materia,
                id_profesor: data.id_profesor,
                grupo: data.grupo
            };
            const res = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(editData)
            });
            
            if (res.ok) {
                showToast('Reserva actualizada correctamente', 'success');
                cerrarModal();
                cargarHorario(currentAulaId);
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al actualizar', 'error');
            }
        } else {
            const res = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                showToast('Reserva creada correctamente', 'success');
                cerrarModal();
                cargarHorario(currentAulaId);
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al crear', 'error');
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
});