"""
SIGAE - Rutas de Solicitudes
Ubicación: backend/routes/solicitudes_routes.py

Maneja:
- Listado de solicitudes (enviadas y recibidas)
- Crear nueva solicitud
- Aprobar/Rechazar solicitud
- Conteo de pendientes para notificaciones
"""

from flask import Blueprint, jsonify, request
from db_config import execute_query
from datetime import date

solicitudes_bp = Blueprint('solicitudes', __name__)


@solicitudes_bp.route('/', methods=['GET'])
def get_solicitudes():
    """Obtiene todas las solicitudes del usuario actual"""
    # Por ahora, simulamos un usuario (después vendrá del token)
    # TODO: Obtener id_usuario del token JWT
    usuario_id = 1  # Temporal
    
    solicitudes = execute_query(
        """SELECT s.*, 
                  a.identificador as aula_nombre,
                  e.nombre as edificio_nombre,
                  sol.nombre_completo as solicitante_nombre,
                  dest.nombre_completo as destinatario_nombre,
                  t.nombre_turno
           FROM solicitudes s
           JOIN aulas a ON s.id_aula = a.id_aula
           JOIN edificios e ON a.id_edificio = e.id_edificio
           JOIN usuarios sol ON s.id_solicitante = sol.id_usuario
           JOIN usuarios dest ON s.id_destinatario = dest.id_usuario
           JOIN turnos t ON s.id_turno = t.id_turno
           WHERE s.id_solicitante = %s OR s.id_destinatario = %s
           ORDER BY s.creado_en DESC""",
        (usuario_id, usuario_id),
        fetch_all=True
    )
    
    return jsonify(solicitudes), 200


@solicitudes_bp.route('/', methods=['POST'])
def crear_solicitud():
    """Crea una nueva solicitud para usar un aula de otra carrera"""
    data = request.get_json()
    
    # Datos requeridos
    id_aula = data.get('id_aula')
    fecha_uso = data.get('fecha_uso')
    id_turno = data.get('id_turno')
    motivo = data.get('motivo')
    materia = data.get('materia')
    profesor = data.get('profesor')
    grupo = data.get('grupo')
    
    # Por ahora, usuario simulado
    solicitante_id = 1  # Temporal
    fecha_solicitud = date.today()
    
    # Obtener el destinatario (dueño del aula según la carrera asignada)
    destinatario = execute_query(
        """SELECT u.id_usuario 
           FROM aulas a
           JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
           JOIN usuarios u ON u.id_carrera = c.id_carrera
           WHERE a.id_aula = %s AND u.rol = 'director'""",
        (id_aula,),
        fetch_one=True
    )
    
    if not destinatario:
        return jsonify({'error': 'No se encontró el director responsable del aula'}), 404
    
    # Crear solicitud
    solicitud_id = execute_query(
        """INSERT INTO solicitudes 
           (id_aula, id_solicitante, id_destinatario, fecha_solicitud, 
            fecha_uso, id_turno, motivo, materia_solicitada, 
            profesor_solicitado, grupo_solicitado, estado)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendiente')""",
        (id_aula, solicitante_id, destinatario['id_usuario'], fecha_solicitud,
         fecha_uso, id_turno, motivo, materia, profesor, grupo)
    )
    
    if not solicitud_id:
        return jsonify({'error': 'Error al crear solicitud'}), 500
    
    return jsonify({'message': 'Solicitud creada exitosamente', 'id': solicitud_id}), 201


@solicitudes_bp.route('/<int:solicitud_id>/responder', methods=['PUT'])
def responder_solicitud(solicitud_id):
    """Aprueba o rechaza una solicitud"""
    data = request.get_json()
    estado = data.get('estado')  # 'aprobada' o 'rechazada'
    comentario = data.get('comentario', '')
    
    if estado not in ['aprobada', 'rechazada']:
        return jsonify({'error': 'Estado inválido'}), 400
    
    # Actualizar solicitud
    execute_query(
        """UPDATE solicitudes 
           SET estado = %s, respuesta_comentario = %s, respuesta_fecha = NOW()
           WHERE id_solicitud = %s""",
        (estado, comentario, solicitud_id)
    )
    
    # Si se aprueba, crear la reserva automáticamente
    if estado == 'aprobada':
        solicitud = execute_query(
            "SELECT * FROM solicitudes WHERE id_solicitud = %s",
            (solicitud_id,),
            fetch_one=True
        )
        
        if solicitud:
            # Obtener día de la semana desde la fecha de uso
            # Por simplicidad, tomamos Lunes (1) como ejemplo
            # TODO: Calcular día real desde fecha_uso
            dia_semana = 1
            
            execute_query(
                """INSERT INTO reservas 
                   (id_aula, id_usuario, id_dia, id_bloque, fecha_reserva, 
                    fecha_asignacion, materia, profesor, grupo, estado)
                   VALUES (%s, %s, %s, %s, CURDATE(), %s, %s, %s, %s, 'activa')""",
                (solicitud['id_aula'], solicitud['id_solicitante'], dia_semana, 1,
                 solicitud['fecha_uso'], solicitud['materia_solicitada'],
                 solicitud['profesor_solicitado'], solicitud['grupo_solicitado'])
            )
    
    return jsonify({'message': f'Solicitud {estado} exitosamente'}), 200


@solicitudes_bp.route('/pendientes/count', methods=['GET'])
def count_pendientes():
    """Cuenta las solicitudes pendientes para el usuario actual"""
    # Por ahora, usuario simulado
    usuario_id = 1  # Temporal
    
    count = execute_query(
        "SELECT COUNT(*) as count FROM solicitudes WHERE id_destinatario = %s AND estado = 'pendiente'",
        (usuario_id,),
        fetch_one=True
    )
    
    return jsonify({'count': count['count'] if count else 0}), 200