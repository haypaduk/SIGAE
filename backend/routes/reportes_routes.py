"""
SIGAE - Rutas de Reportes
Ubicación: backend/routes/reportes_routes.py

Maneja:
- Reporte de ocupación por turno (gráficas)
- Inventario de infraestructura (tabla resumen)
"""

from flask import Blueprint, jsonify
from db_config import execute_query

reportes_bp = Blueprint('reportes', __name__)


@reportes_bp.route('/ocupacion', methods=['GET'])
def get_reporte_ocupacion():
    """Obtiene datos de ocupación por turno y edificio"""
    
    # Ocupación por edificio y turno
    ocupacion = execute_query(
        """SELECT e.nombre as edificio,
                  t.nombre_turno as turno,
                  COUNT(DISTINCT CASE WHEN r.id_reserva IS NOT NULL THEN a.id_aula END) as aulas_ocupadas,
                  COUNT(DISTINCT a.id_aula) as total_aulas
           FROM edificios e
           JOIN aulas a ON e.id_edificio = a.id_edificio
           CROSS JOIN turnos t
           LEFT JOIN reservas r ON r.id_aula = a.id_aula
               AND r.estado = 'activa'
               AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
               AND r.id_bloque IN (SELECT id_bloque FROM bloques_horarios WHERE id_turno = t.id_turno)
           WHERE e.activo = 1 AND a.activo = 1
           GROUP BY e.id_edificio, t.id_turno""",
        fetch_all=True
    )
    
    # Tipos de espacio (aulas, auditorios, laboratorios)
    tipos_espacio = execute_query(
        """SELECT t.nombre_tipo as tipo,
                  COUNT(*) as cantidad
           FROM aulas a
           JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
           WHERE a.activo = 1
           GROUP BY t.id_tipo_aula""",
        fetch_all=True
    )
    
    return jsonify({
        'ocupacion_por_turno': ocupacion,
        'tipos_espacio': tipos_espacio
    }), 200


@reportes_bp.route('/inventario', methods=['GET'])
def get_inventario():
    """Obtiene el inventario completo de infraestructura"""
    
    inventario = execute_query(
        """SELECT e.nombre as edificio,
                  COUNT(a.id_aula) as total_espacios,
                  SUM(CASE WHEN a.piso = 'Planta Baja' THEN 1 ELSE 0 END) as planta_baja,
                  SUM(CASE WHEN a.piso = 'Planta Alta' THEN 1 ELSE 0 END) as planta_alta,
                  SUM(a.capacidad) as capacidad_total,
                  SUM(CASE WHEN r.id_reserva IS NULL THEN 1 ELSE 0 END) as disponibles,
                  ROUND(AVG(porcentaje), 0) as ocupacion_prom
           FROM edificios e
           JOIN aulas a ON e.id_edificio = a.id_edificio
           LEFT JOIN (
               SELECT id_aula, COUNT(*) * 100.0 / 
                   ((SELECT COUNT(*) FROM bloques_horarios) * 5) as porcentaje
               FROM reservas
               WHERE estado = 'activa' 
               AND YEARWEEK(fecha_asignacion) = YEARWEEK(CURDATE())
               GROUP BY id_aula
           ) r ON a.id_aula = r.id_aula
           WHERE e.activo = 1 AND a.activo = 1
           GROUP BY e.id_edificio""",
        fetch_all=True
    )
    
    return jsonify(inventario), 200