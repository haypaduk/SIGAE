"""
SIGAE - Rutas de Infraestructura
Ubicación: backend/routes/infraestructura_routes.py

Maneja:
- Listado de edificios
- Aulas por edificio con porcentaje de ocupación
- Horarios de aulas
"""

from flask import Blueprint, jsonify, request
from db_config import execute_query

infraestructura_bp = Blueprint('infraestructura', __name__)


@infraestructura_bp.route('/edificios', methods=['GET'])
def get_edificios():
    """Obtiene todos los edificios activos"""
    edificios = execute_query(
        """SELECT id_edificio, nombre, tipo_edificio 
           FROM edificios WHERE activo = 1""",
        fetch_all=True
    )
    return jsonify(edificios), 200


@infraestructura_bp.route('/edificios/<int:edificio_id>/aulas', methods=['GET'])
def get_aulas_by_edificio(edificio_id):
    """
    Obtiene todas las aulas de un edificio con su porcentaje de ocupación
    """
    aulas = execute_query(
        """SELECT 
            a.id_aula,
            a.identificador,
            a.piso,
            a.capacidad,
            t.nombre_tipo as tipo,
            c.clave_carrera as carrera,
            COUNT(r.id_reserva) as reservas_count,
            ROUND(
                (COUNT(r.id_reserva) * 100.0) / 
                ((SELECT COUNT(*) FROM bloques_horarios) * 5)
            ) as porcentaje_ocupacion
        FROM aulas a
        LEFT JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
        LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
        LEFT JOIN reservas r ON a.id_aula = r.id_aula 
            AND r.estado = 'activa'
            AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
        WHERE a.id_edificio = %s AND a.activo = 1
        GROUP BY a.id_aula
        ORDER BY a.piso DESC, a.identificador""",
        (edificio_id,),
        fetch_all=True
    )
    return jsonify(aulas), 200


@infraestructura_bp.route('/aulas/<int:aula_id>/horario', methods=['GET'])
def get_horario_aula(aula_id):
    """Obtiene el horario semanal de un aula"""
    
    # Obtener datos del aula
    aula = execute_query(
        """SELECT a.id_aula, a.identificador, a.capacidad, e.nombre as edificio
           FROM aulas a
           JOIN edificios e ON a.id_edificio = e.id_edificio
           WHERE a.id_aula = %s""",
        (aula_id,),
        fetch_one=True
    )
    
    if not aula:
        return jsonify({'error': 'Aula no encontrada'}), 404
    
    # Obtener horario (Lunes a Sábado, todos los bloques)
    horario = execute_query(
        """SELECT 
            d.nombre_dia, 
            d.orden as dia_orden,
            b.orden_dia, 
            b.hora_inicio, 
            b.hora_fin,
            r.id_reserva, 
            r.materia, 
            r.profesor, 
            r.grupo,
            u.nombre_completo as profesor_nombre
        FROM dias_semana d
        CROSS JOIN bloques_horarios b
        LEFT JOIN reservas r ON r.id_dia = d.id_dia 
            AND r.id_bloque = b.id_bloque
            AND r.id_aula = %s
            AND r.estado = 'activa'
            AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
        LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
        WHERE d.activo_sabado = 1 OR d.orden <= 5
        ORDER BY d.orden, b.orden_dia""",
        (aula_id,),
        fetch_all=True
    )
    
    return jsonify({
        'aula': aula,
        'horario': horario
    }), 200