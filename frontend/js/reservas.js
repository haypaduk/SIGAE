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
let reservasData = [];
let materiasData = [];
let profesoresData = [];
let diasData = [];
let bloquesData = [];

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
        const res = await fetch(`/api/reservas/aula/${aulaId}/semana`);
        reservasData = await res.json();
        mostrarHorario(reservasData);
    } catch (error) {
        console.error('Error cargando horario:', error);
        showToast('Error al cargar el horario', 'error');
    }
}

function mostrarHorario(reservas) {
    const container = document.getElementById('horario-container');
    if (!container) return;
    
    // Crear tabla de horario
    let html = `
        <div style="overflow-x: auto;">
            <table class="horario-table">
                <thead>
                    <tr>
                        <th>Hora</th>
                        ${diasData.map(d => `<th>${d.nombre_dia}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Para cada bloque horario
    bloquesData.forEach(bloque => {
        const horaInicio = bloque.hora_inicio.substring(0, 5);
        const horaFin = bloque.hora_fin.substring(0, 5);
        html += `<tr><td class="hora">${horaInicio} - ${horaFin}</td>`;
        
        diasData.forEach(dia => {
            const reserva = reservas.find(r => r.id_dia === dia.id_dia && r.id_bloque === bloque.id_bloque);
            
            if (reserva) {
                html += `
                    <td class="ocupado" data-reserva-id="${reserva.id_reserva}">
                        <div class="materia">${reserva.materia_clave || ''}</div>
                        <div class="profesor">${reserva.profesor_clave || ''}</div>
                        <div class="grupo">${reserva.grupo || ''}</div>
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
    `;
    
    container.innerHTML = html;
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
    
    try {
        const res = await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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