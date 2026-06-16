"""
SIGAE - Configuración de Base de Datos
Ubicación: backend/db_config.py

Este archivo maneja:
- Conexión a MySQL
- Funciones helper para ejecutar queries
- Consultas específicas para el dashboard
"""

import mysql.connector
from mysql.connector import Error
from config import config
import os

# Cargar configuración según entorno
env = os.getenv('FLASK_ENV', 'development')
cfg = config[env]


def get_db_connection():
    """
    Obtiene una conexión a la base de datos MySQL
    
    Returns:
        connection: Objeto de conexión de mysql.connector
        None: Si hay error de conexión
    """
    try:
        connection = mysql.connector.connect(
            host=cfg.MYSQL_HOST,
            user=cfg.MYSQL_USER,
            password=cfg.MYSQL_PASSWORD,
            database=cfg.MYSQL_DATABASE
        )
        return connection
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None


def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """
    Ejecuta una consulta SQL de forma segura
    
    Args:
        query (str): Consulta SQL a ejecutar
        params (tuple): Parámetros para la consulta (evita inyección SQL)
        fetch_one (bool): Si es True, retorna un solo registro
        fetch_all (bool): Si es True, retorna todos los registros
    
    Returns:
        Si fetch_one: Un diccionario con el registro
        Si fetch_all: Lista de diccionarios
        Si no fetch: El ID del último registro insertado
        None: Si hay error
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = cursor.lastrowid
            
        return result
    except Error as e:
        print(f"Error en query: {e}")
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()


# =====================================================
# FUNCIONES ESPECÍFICAS PARA EL DASHBOARD
# =====================================================

def get_dashboard_stats():
    """
    Calcula estadísticas generales del dashboard:
    - Total de espacios (aulas activas)
    - Total de edificios
    - Disponibles, uso parcial, ocupados
    - Porcentajes y ocupación global
    
    Returns:
        dict: Diccionario con todas las estadísticas
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    cursor = conn.cursor(dictionary=True)
    
    # Total de aulas activas
    cursor.execute("SELECT COUNT(*) as total FROM aulas WHERE activo = 1")
    total_aulas = cursor.fetchone()['total']
    
    # Total de edificios activos
    cursor.execute("SELECT COUNT(*) as total FROM edificios WHERE activo = 1")
    total_edificios = cursor.fetchone()['total']
    
    # Aulas con reservas activas en la semana actual
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT id_aula) as aulas_con_reservas,
            COUNT(*) as total_reservas
        FROM reservas 
        WHERE estado = 'activa' 
        AND YEARWEEK(fecha_asignacion) = YEARWEEK(CURDATE())
    """)
    stats = cursor.fetchone()
    aulas_ocupadas = stats['aulas_con_reservas'] or 0
    
    # Aulas con uso parcial
    cursor.execute("""
        SELECT COUNT(DISTINCT id_aula) as parcial 
        FROM reservas 
        WHERE estado = 'activa' 
        AND YEARWEEK(fecha_asignacion) = YEARWEEK(CURDATE())
    """)
    parcial = cursor.fetchone()['parcial'] or 0
    
    # Calcular porcentajes
    ocupados = aulas_ocupadas
    disponibles = total_aulas - ocupados
    
    # Porcentaje de ocupación global
    cursor.execute("""
        SELECT 
            ROUND(
                (COUNT(*) * 100.0) / 
                ((SELECT COUNT(*) FROM bloques_horarios WHERE id_turno IN (1,2)) * 
                 (SELECT COUNT(*) FROM dias_semana WHERE activo_sabado = 1 OR orden <= 5))
            ) as porcentaje_global
        FROM reservas r
        WHERE r.estado = 'activa'
        AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
    """)
    porcentaje = cursor.fetchone()
    porcentaje_global = porcentaje['porcentaje_global'] if porcentaje and porcentaje['porcentaje_global'] else 0
    
    cursor.close()
    conn.close()
    
    return {
        'total_espacios': total_aulas,
        'total_edificios': total_edificios,
        'disponibles': disponibles,
        'porcentaje_disponibles': round((disponibles / total_aulas) * 100, 1) if total_aulas > 0 else 0,
        'uso_parcial': parcial,
        'porcentaje_parcial': round((parcial / total_aulas) * 100, 1) if total_aulas > 0 else 0,
        'ocupados': ocupados,
        'porcentaje_ocupados': round((ocupados / total_aulas) * 100, 1) if total_aulas > 0 else 0,
        'porcentaje_global': porcentaje_global
    }


def get_aulas_alta_demanda(limit=5):
    """
    Obtiene las aulas con mayor porcentaje de ocupación
    
    Args:
        limit (int): Número máximo de aulas a retornar
    
    Returns:
        list: Lista de diccionarios con aulas y su porcentaje
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            a.id_aula,
            a.identificador,
            e.nombre as edificio,
            a.capacidad,
            COUNT(r.id_reserva) as total_reservas,
            ROUND(
                (COUNT(r.id_reserva) * 100.0) / 
                ((SELECT COUNT(*) FROM bloques_horarios) * 5)
            ) as porcentaje_ocupacion
        FROM aulas a
        JOIN edificios e ON a.id_edificio = e.id_edificio
        LEFT JOIN reservas r ON a.id_aula = r.id_aula 
            AND r.estado = 'activa'
            AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
        WHERE a.activo = 1
        GROUP BY a.id_aula
        HAVING porcentaje_ocupacion > 0
        ORDER BY porcentaje_ocupacion DESC
        LIMIT %s
    """, (limit,))
    
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados


def get_aulas_subutilizadas(limit=5):
    """
    Obtiene las aulas con menor porcentaje de ocupación
    
    Args:
        limit (int): Número máximo de aulas a retornar
    
    Returns:
        list: Lista de diccionarios con aulas y su porcentaje
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            a.id_aula,
            a.identificador,
            e.nombre as edificio,
            a.capacidad,
            COUNT(r.id_reserva) as total_reservas,
            ROUND(
                (COUNT(r.id_reserva) * 100.0) / 
                ((SELECT COUNT(*) FROM bloques_horarios) * 5)
            ) as porcentaje_ocupacion
        FROM aulas a
        JOIN edificios e ON a.id_edificio = e.id_edificio
        LEFT JOIN reservas r ON a.id_aula = r.id_aula 
            AND r.estado = 'activa'
            AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
        WHERE a.activo = 1
        GROUP BY a.id_aula
        ORDER BY porcentaje_ocupacion ASC
        LIMIT %s
    """, (limit,))

def get_aulas_por_carrera(carreras_ids):
    """
    Obtiene las aulas filtradas por las carreras del director
    
    Args:
        carreras_ids (list): Lista de IDs de carreras
    
    Returns:
        list: Lista de aulas con sus datos
    """
    if not carreras_ids:
        return []
    
    # Convertir lista a string para SQL
    ids_str = ','.join(str(id) for id in carreras_ids)
    
    conn = get_db_connection()
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"""
        SELECT 
            a.id_aula,
            a.identificador,
            a.piso,
            a.capacidad,
            e.nombre as edificio,
            e.id_edificio,
            t.nombre_tipo as tipo,
            c.clave_carrera as carrera,
            COUNT(r.id_reserva) as reservas_count,
            ROUND(
                (COUNT(r.id_reserva) * 100.0) / 
                ((SELECT COUNT(*) FROM bloques_horarios) * 5)
            ) as porcentaje_ocupacion
        FROM aulas a
        JOIN edificios e ON a.id_edificio = e.id_edificio
        JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
        LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
        LEFT JOIN reservas r ON a.id_aula = r.id_aula 
            AND r.estado = 'activa'
            AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
        WHERE a.activo = 1 
            AND a.id_carrera_asignada IN ({ids_str})
        GROUP BY a.id_aula
        ORDER BY e.nombre, a.identificador
    """)
    
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados