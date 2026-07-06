"""
SIGAE - APLICACIÓN COMPLETA CON RUTAS DIRECTAS
VERSIÓN SIMPLE - SIN SPA, SIN JAVASCRIPT COMPLEJO
"""

from flask import Flask, render_template, send_from_directory, request, jsonify, redirect, url_for
from flask_cors import CORS
import os
import re
from datetime import datetime, date

# Importar configuración y base de datos
from config import config
from db_config import (
    execute_query,
    # Dashboard
    get_dashboard_stats_admin,
    get_dashboard_stats_director,
    get_alta_demanda_admin,
    get_alta_demanda_director,
    get_subutilizadas_admin,
    get_subutilizadas_director,
    get_ocupacion_edificios_admin,
    get_ocupacion_edificios_director,
    # Reportes
    get_ocupacion_por_turno,
    get_tipos_espacio,
    # Ciclo
    get_ciclo_actual
)

app = Flask(__name__, 
            static_folder='../frontend', 
            template_folder='../frontend/pages')
app.config.from_object(config['development'])
CORS(app)

# =====================================================
# RUTAS DIRECTAS (TODAS LAS PÁGINAS)
# =====================================================

@app.route('/')
def index():
    """Redirige al login"""
    return redirect('/login')

@app.route('/login')
def login():
    """Página de login"""
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    """Página de dashboard"""
    return render_template('dashboard.html')

@app.route('/infraestructura')
def infraestructura():
    """Página de infraestructura"""
    return render_template('infraestructura.html')

@app.route('/solicitudes')
def solicitudes():
    """Página de solicitudes"""
    return render_template('solicitudes.html')

@app.route('/reportes')
def reportes():
    """Página de reportes"""
    return render_template('reportes.html')

# =====================================================
# ARCHIVOS ESTÁTICOS (CSS, JS, IMÁGENES)
# =====================================================

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('../frontend/css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('../frontend/js', filename)

@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory('../frontend/img', filename)

# =====================================================
# API DE AUTENTICACIÓN
# =====================================================

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """Login vía AJAX"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Validar email
    if not email or not password:
        return jsonify({'error': 'Email y contraseña requeridos'}), 400
    
    if not re.match(r'^[a-zA-Z0-9._%+-]+@utvtol\.edu\.mx$', email):
        return jsonify({'error': 'Solo correos @utvtol.edu.mx'}), 400
    
    # Buscar usuario (INCLUYE foto_perfil)
    user = execute_query(
        """SELECT id_usuario, email, nombre_completo, rol, id_carrera, foto_perfil 
           FROM usuarios 
           WHERE email = %s AND password = %s AND activo = 1""",
        (email, password),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    # Obtener carreras del director
    carreras = []
    if user['rol'] == 'director':
        carreras = execute_query(
            """SELECT c.id_carrera, c.clave_carrera, c.nombre_carrera
               FROM carreras c
               JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
               WHERE uc.id_usuario = %s""",
            (user['id_usuario'],),
            fetch_all=True
        )
    
    # Datos del usuario (INCLUYE foto_perfil)
    user_data = {
        'id': user['id_usuario'],
        'nombre': user['nombre_completo'],
        'email': user['email'],
        'rol': user['rol'],
        'carreras': carreras,
        'foto_perfil': user.get('foto_perfil', '/img/avatar.png')
    }
    
    return jsonify({'user': user_data}), 200

# =====================================================
# API DE DASHBOARD - DATOS REALES
# =====================================================

@app.route('/api/dashboard/stats', methods=['GET'])
def api_dashboard_stats():
    """Estadísticas del dashboard (según rol del usuario)"""
    # Obtener usuario desde el header (enviado desde el frontend)
    user_id = request.headers.get('X-User-Id', 1)  # Por defecto, admin (id=1)
    
    # Obtener información del usuario
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Ver TODO
        stats = get_dashboard_stats_admin()
        alta_demanda = get_alta_demanda_admin()
        subutilizadas = get_subutilizadas_admin()
        ocupacion_edificios = get_ocupacion_edificios_admin()
    else:
        # DIRECTOR: Ver SOLO su carrera
        if user['id_carrera']:
            id_carrera = user['id_carrera']
            stats = get_dashboard_stats_director(id_carrera)
            alta_demanda = get_alta_demanda_director(id_carrera)
            subutilizadas = get_subutilizadas_director(id_carrera)
            ocupacion_edificios = get_ocupacion_edificios_director(id_carrera)
        else:
            # Si el director no tiene carrera, mostrar vacío
            stats = {
                'total_espacios': 0,
                'disponibles': 0,
                'ocupados': 0,
                'porcentaje_global': 0
            }
            alta_demanda = []
            subutilizadas = []
            ocupacion_edificios = []
    
    return jsonify({
        'stats': stats,
        'alta_demanda': alta_demanda,
        'subutilizadas': subutilizadas,
        'ocupacion_edificios': ocupacion_edificios
    }), 200
    
# =====================================================
# API DE INFRAESTRUCTURA
# =====================================================

@app.route('/api/infraestructura/edificios', methods=['GET'])
def api_edificios():
    """Lista de edificios con total de aulas (filtrado por rol)"""
    
    # Obtener usuario desde el header
    user_id = request.headers.get('X-User-Id', 1)
    
    # Obtener información del usuario
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Ver TODOS los edificios
        edificios = execute_query("""
            SELECT 
                e.id_edificio, 
                e.nombre, 
                e.tipo_edificio,
                COUNT(a.id_aula) as total_aulas
            FROM edificios e
            LEFT JOIN aulas a ON e.id_edificio = a.id_edificio AND a.activo = 1
            WHERE e.activo = 1
            GROUP BY e.id_edificio
            ORDER BY e.nombre
        """, fetch_all=True)
    else:
        # DIRECTOR: Ver SOLO los edificios de su(s) carrera(s)
        # Obtener todas las carreras del director
        carreras = execute_query("""
            SELECT c.id_carrera
            FROM carreras c
            JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
            WHERE uc.id_usuario = %s
        """, (user_id,), fetch_all=True)
        
        if not carreras:
            return jsonify([]), 200
        
        # Convertir a lista de IDs
        carreras_ids = [c['id_carrera'] for c in carreras]
        carreras_str = ','.join(str(id) for id in carreras_ids)
        
        edificios = execute_query(f"""
            SELECT 
                e.id_edificio, 
                e.nombre, 
                e.tipo_edificio,
                COUNT(a.id_aula) as total_aulas
            FROM edificios e
            LEFT JOIN aulas a ON e.id_edificio = a.id_edificio AND a.activo = 1
            WHERE e.activo = 1
            AND a.id_carrera_asignada IN ({carreras_str})
            GROUP BY e.id_edificio
            ORDER BY e.nombre
        """, fetch_all=True)
    
    return jsonify(edificios), 200

@app.route('/api/infraestructura/edificios/<int:edificio_id>/aulas', methods=['GET'])
def api_aulas_by_edificio(edificio_id):
    """Aulas de un edificio (filtrado por rol)"""
    
    # Obtener usuario desde el header
    user_id = request.headers.get('X-User-Id', 1)
    
    # Obtener información del usuario
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Ver TODAS las aulas del edificio
        aulas = execute_query("""
            SELECT a.id_aula, a.identificador, a.piso, a.capacidad, 
                      t.nombre_tipo as tipo,
                      COUNT(r.id_reserva) as reservas_count,
                      ROUND(
                          (COUNT(r.id_reserva) * 100.0) / 
                          ((SELECT COUNT(*) FROM bloques_horarios) * 5)
                      ) as porcentaje_ocupacion
               FROM aulas a
               LEFT JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
               LEFT JOIN reservas r ON a.id_aula = r.id_aula 
                   AND r.estado = 'activa'
                    AND (
                        r.tipo_reserva = 'clase'
                        OR 
                        (r.tipo_reserva = 'evento' AND r.fecha_asignacion >= CURDATE())
                    )
               WHERE a.id_edificio = %s AND a.activo = 1
               GROUP BY a.id_aula
               ORDER BY a.piso DESC, a.identificador
        """, (edificio_id,), fetch_all=True)
    else:
        # DIRECTOR: Ver SOLO las aulas de su(s) carrera(s)
        # Obtener todas las carreras del director
        carreras = execute_query("""
            SELECT c.id_carrera
            FROM carreras c
            JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
            WHERE uc.id_usuario = %s
        """, (user_id,), fetch_all=True)
        
        if not carreras:
            return jsonify([]), 200
        
        carreras_ids = [c['id_carrera'] for c in carreras]
        carreras_str = ','.join(str(id) for id in carreras_ids)
        
        aulas = execute_query(f"""
            SELECT a.id_aula, a.identificador, a.piso, a.capacidad, 
                      t.nombre_tipo as tipo,
                      COUNT(r.id_reserva) as reservas_count,
                      ROUND(
                          (COUNT(r.id_reserva) * 100.0) / 
                          ((SELECT COUNT(*) FROM bloques_horarios) * 5)
                      ) as porcentaje_ocupacion
               FROM aulas a
               LEFT JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
               LEFT JOIN reservas r ON a.id_aula = r.id_aula 
                   AND r.estado = 'activa'
                   AND (
                       r.tipo_reserva = 'clase'
                       OR 
                       (r.tipo_reserva = 'evento' AND r.fecha_asignacion >= CURDATE())
                   )
               WHERE a.id_edificio = %s AND a.activo = 1
               AND a.id_carrera_asignada IN ({carreras_str})
               GROUP BY a.id_aula
               ORDER BY a.piso DESC, a.identificador
        """, (edificio_id,), fetch_all=True)
    
    return jsonify(aulas), 200

# =====================================================
# ADMIN - PÁGINAS
# =====================================================

@app.route('/admin')
def admin_dashboard():
    """Panel de administración"""
    return render_template('admin.html')

@app.route('/admin/carreras')
def admin_carreras():
    """Gestión de carreras"""
    return render_template('admin/carreras.html')

# =====================================================
# API - CARRERAS (Admin)
# =====================================================

@app.route('/api/admin/carreras', methods=['GET'])
def api_get_carreras():
    """Obtener todas las carreras"""
    carreras = execute_query(
        "SELECT id_carrera, clave_carrera, nombre_carrera, activo FROM carreras ORDER BY nombre_carrera",
        fetch_all=True
    )
    return jsonify(carreras), 200

@app.route('/api/admin/carreras', methods=['POST'])
def api_create_carrera():
    """Crear una nueva carrera"""
    data = request.get_json()
    clave = data.get('clave_carrera')
    nombre = data.get('nombre_carrera')
    
    if not clave or not nombre:
        return jsonify({'error': 'Clave y nombre son requeridos'}), 400
    
    # Verificar si ya existe
    existente = execute_query(
        "SELECT id_carrera FROM carreras WHERE clave_carrera = %s",
        (clave,),
        fetch_one=True
    )
    if existente:
        return jsonify({'error': 'Ya existe una carrera con esa clave'}), 400
    
    # Insertar
    execute_query(
        "INSERT INTO carreras (clave_carrera, nombre_carrera, activo) VALUES (%s, %s, 1)",
        (clave, nombre)
    )
    
    return jsonify({'message': 'Carrera creada exitosamente'}), 201

@app.route('/api/admin/carreras/<int:id_carrera>', methods=['PUT'])
def api_update_carrera(id_carrera):
    """Actualizar una carrera"""
    data = request.get_json()
    clave = data.get('clave_carrera')
    nombre = data.get('nombre_carrera')
    activo = data.get('activo', 1)
    
    execute_query(
        "UPDATE carreras SET clave_carrera = %s, nombre_carrera = %s, activo = %s WHERE id_carrera = %s",
        (clave, nombre, activo, id_carrera)
    )
    
    return jsonify({'message': 'Carrera actualizada'}), 200

@app.route('/api/admin/carreras/<int:id_carrera>', methods=['DELETE'])
def api_delete_carrera(id_carrera):
    """Eliminar una carrera"""
    execute_query(
        "DELETE FROM carreras WHERE id_carrera = %s",
        (id_carrera,)
    )
    return jsonify({'message': 'Carrera eliminada'}), 200

# =====================================================
# ADMIN - PÁGINA DE EDIFICIOS
# =====================================================

@app.route('/admin/edificios')
def admin_edificios():
    """Gestión de edificios"""
    return render_template('admin/edificios.html')

# =====================================================
# API - EDIFICIOS (Admin)
# =====================================================

@app.route('/api/admin/edificios', methods=['GET'])
def api_get_edificios():
    """Obtener todos los edificios"""
    edificios = execute_query(
        "SELECT id_edificio, nombre, tipo_edificio, ubicacion, activo FROM edificios ORDER BY nombre",
        fetch_all=True
    )
    return jsonify(edificios), 200

@app.route('/api/admin/edificios', methods=['POST'])
def api_create_edificio():
    """Crear un nuevo edificio"""
    data = request.get_json()
    nombre = data.get('nombre')
    tipo_edificio = data.get('tipo_edificio')
    ubicacion = data.get('ubicacion')
    
    if not nombre or not tipo_edificio:
        return jsonify({'error': 'Nombre y tipo son requeridos'}), 400
    
    # Verificar si ya existe
    existente = execute_query(
        "SELECT id_edificio FROM edificios WHERE nombre = %s",
        (nombre,),
        fetch_one=True
    )
    if existente:
        return jsonify({'error': 'Ya existe un edificio con ese nombre'}), 400
    
    # Insertar
    execute_query(
        "INSERT INTO edificios (nombre, tipo_edificio, ubicacion, activo) VALUES (%s, %s, %s, 1)",
        (nombre, tipo_edificio, ubicacion)
    )
    
    return jsonify({'message': 'Edificio creado exitosamente'}), 201

@app.route('/api/admin/edificios/<int:id_edificio>', methods=['PUT'])
def api_update_edificio(id_edificio):
    """Actualizar un edificio"""
    data = request.get_json()
    nombre = data.get('nombre')
    tipo_edificio = data.get('tipo_edificio')
    ubicacion = data.get('ubicacion')
    activo = data.get('activo', 1)
    
    execute_query(
        """UPDATE edificios 
           SET nombre = %s, tipo_edificio = %s, ubicacion = %s, activo = %s 
           WHERE id_edificio = %s""",
        (nombre, tipo_edificio, ubicacion, activo, id_edificio)
    )
    
    return jsonify({'message': 'Edificio actualizado'}), 200

@app.route('/api/admin/edificios/<int:id_edificio>', methods=['DELETE'])
def api_delete_edificio(id_edificio):
    """Eliminar un edificio"""
    execute_query(
        "DELETE FROM edificios WHERE id_edificio = %s",
        (id_edificio,)
    )
    return jsonify({'message': 'Edificio eliminado'}), 200

# =====================================================
# ADMIN - PÁGINA DE AULAS
# =====================================================

@app.route('/admin/aulas')
def admin_aulas():
    """Gestión de aulas"""
    return render_template('admin/aulas.html')

# =====================================================
# API - AULAS (Admin)
# =====================================================

@app.route('/api/admin/aulas', methods=['GET'])
def api_get_aulas():
    """Obtener todas las aulas con sus relaciones"""
    aulas = execute_query(
        """SELECT a.id_aula, a.identificador, a.piso, a.capacidad, 
                  a.activo,
                  e.id_edificio, e.nombre as edificio_nombre,
                  t.id_tipo_aula, t.nombre_tipo as tipo_nombre,
                  c.id_carrera, c.clave_carrera, c.nombre_carrera
           FROM aulas a
           LEFT JOIN edificios e ON a.id_edificio = e.id_edificio
           LEFT JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
           LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
           ORDER BY e.nombre, a.identificador""",
        fetch_all=True
    )
    return jsonify(aulas), 200

@app.route('/api/admin/aulas', methods=['POST'])
def api_create_aula():
    """Crear una nueva aula"""
    data = request.get_json()
    identificador = data.get('identificador')
    id_edificio = data.get('id_edificio')
    id_tipo_aula = data.get('id_tipo_aula')
    piso = data.get('piso')
    capacidad = data.get('capacidad')
    id_carrera_asignada = data.get('id_carrera_asignada')
    
    if not identificador or not id_edificio or not id_tipo_aula or not piso or not capacidad:
        return jsonify({'error': 'Todos los campos son requeridos'}), 400
    
    # Verificar si ya existe un aula con ese identificador en el mismo edificio
    existente = execute_query(
        "SELECT id_aula FROM aulas WHERE identificador = %s AND id_edificio = %s",
        (identificador, id_edificio),
        fetch_one=True
    )
    if existente:
        return jsonify({'error': 'Ya existe un aula con ese identificador en este edificio'}), 400
    
    # Insertar
    execute_query(
        """INSERT INTO aulas (identificador, id_edificio, id_tipo_aula, piso, capacidad, id_carrera_asignada, activo) 
           VALUES (%s, %s, %s, %s, %s, %s, 1)""",
        (identificador, id_edificio, id_tipo_aula, piso, capacidad, id_carrera_asignada)
    )
    
    return jsonify({'message': 'Aula creada exitosamente'}), 201

@app.route('/api/admin/aulas/<int:id_aula>', methods=['PUT'])
def api_update_aula(id_aula):
    """Actualizar un aula"""
    data = request.get_json()
    identificador = data.get('identificador')
    id_edificio = data.get('id_edificio')
    id_tipo_aula = data.get('id_tipo_aula')
    piso = data.get('piso')
    capacidad = data.get('capacidad')
    id_carrera_asignada = data.get('id_carrera_asignada')
    activo = data.get('activo', 1)
    
    execute_query(
        """UPDATE aulas 
           SET identificador = %s, id_edificio = %s, id_tipo_aula = %s, 
               piso = %s, capacidad = %s, id_carrera_asignada = %s, activo = %s 
           WHERE id_aula = %s""",
        (identificador, id_edificio, id_tipo_aula, piso, capacidad, id_carrera_asignada, activo, id_aula)
    )
    
    return jsonify({'message': 'Aula actualizada'}), 200

@app.route('/api/admin/aulas/<int:id_aula>', methods=['DELETE'])
def api_delete_aula(id_aula):
    """Eliminar un aula"""
    execute_query(
        "DELETE FROM aulas WHERE id_aula = %s",
        (id_aula,)
    )
    return jsonify({'message': 'Aula eliminada'}), 200

# =====================================================
# API - DATOS PARA SELECTS (Aulas)
# =====================================================

@app.route('/api/admin/selects/aulas', methods=['GET'])
def api_get_selects_aulas():
    """Obtener datos para selects (edificios, tipos, carreras)"""
    edificios = execute_query(
        "SELECT id_edificio, nombre FROM edificios WHERE activo = 1 ORDER BY nombre",
        fetch_all=True
    )
    tipos = execute_query(
        "SELECT id_tipo_aula, nombre_tipo FROM tipos_aula ORDER BY nombre_tipo",
        fetch_all=True
    )
    carreras = execute_query(
        "SELECT id_carrera, clave_carrera, nombre_carrera FROM carreras WHERE activo = 1 ORDER BY nombre_carrera",
        fetch_all=True
    )
    
    return jsonify({
        'edificios': edificios,
        'tipos': tipos,
        'carreras': carreras
    }), 200

# =====================================================
# ADMIN - PÁGINA DE MATERIAS
# =====================================================

@app.route('/admin/materias')
def admin_materias():
    """Gestión de materias"""
    return render_template('admin/materias.html')

# =====================================================
# API - MATERIAS (Admin)
# =====================================================

@app.route('/api/admin/materias', methods=['GET'])
def api_get_materias():
    """Obtener todas las materias con su carrera"""
    materias = execute_query(
        """SELECT m.id_materia, m.clave, m.nombre, m.activo,
                  c.id_carrera, c.clave_carrera, c.nombre_carrera
           FROM materias m
           LEFT JOIN carreras c ON m.id_carrera = c.id_carrera
           ORDER BY c.nombre_carrera, m.nombre""",
        fetch_all=True
    )
    return jsonify(materias), 200

@app.route('/api/admin/materias', methods=['POST'])
def api_create_materia():
    """Crear una nueva materia"""
    data = request.get_json()
    clave = data.get('clave')
    nombre = data.get('nombre')
    id_carrera = data.get('id_carrera')
    
    if not clave or not nombre or not id_carrera:
        return jsonify({'error': 'Clave, nombre y carrera son requeridos'}), 400
    
    # Verificar si ya existe una materia con esa clave
    existente = execute_query(
        "SELECT id_materia FROM materias WHERE clave = %s",
        (clave,),
        fetch_one=True
    )
    if existente:
        return jsonify({'error': 'Ya existe una materia con esa clave'}), 400
    
    # Insertar
    execute_query(
        "INSERT INTO materias (clave, nombre, id_carrera, activo) VALUES (%s, %s, %s, 1)",
        (clave, nombre, id_carrera)
    )
    
    return jsonify({'message': 'Materia creada exitosamente'}), 201

@app.route('/api/admin/materias/<int:id_materia>', methods=['PUT'])
def api_update_materia(id_materia):
    """Actualizar una materia"""
    data = request.get_json()
    clave = data.get('clave')
    nombre = data.get('nombre')
    id_carrera = data.get('id_carrera')
    activo = data.get('activo', 1)
    
    execute_query(
        """UPDATE materias 
           SET clave = %s, nombre = %s, id_carrera = %s, activo = %s 
           WHERE id_materia = %s""",
        (clave, nombre, id_carrera, activo, id_materia)
    )
    
    return jsonify({'message': 'Materia actualizada'}), 200

@app.route('/api/admin/materias/<int:id_materia>', methods=['DELETE'])
def api_delete_materia(id_materia):
    """Eliminar una materia"""
    execute_query(
        "DELETE FROM materias WHERE id_materia = %s",
        (id_materia,)
    )
    return jsonify({'message': 'Materia eliminada'}), 200

# =====================================================
# API - DATOS PARA SELECTS (Materias)
# =====================================================

@app.route('/api/admin/selects/materias', methods=['GET'])
def api_get_selects_materias():
    """Obtener datos para selects (carreras)"""
    carreras = execute_query(
        "SELECT id_carrera, clave_carrera, nombre_carrera FROM carreras WHERE activo = 1 ORDER BY nombre_carrera",
        fetch_all=True
    )
    
    return jsonify({'carreras': carreras}), 200

# =====================================================
# ADMIN - PÁGINA DE PROFESORES
# =====================================================

@app.route('/admin/profesores')
def admin_profesores():
    """Gestión de profesores"""
    return render_template('admin/profesores.html')

# =====================================================
# API - PROFESORES (Admin)
# =====================================================

@app.route('/api/admin/profesores', methods=['GET'])
def api_get_profesores():
    """Obtener todos los profesores"""
    profesores = execute_query(
        """SELECT id_profesor, clave, nombre_completo, email, activo
           FROM profesores
           ORDER BY nombre_completo""",
        fetch_all=True
    )
    return jsonify(profesores), 200

@app.route('/api/admin/profesores', methods=['POST'])
def api_create_profesor():
    """Crear un nuevo profesor"""
    data = request.get_json()
    clave = data.get('clave')
    nombre_completo = data.get('nombre_completo')
    email = data.get('email')
    
    if not clave or not nombre_completo:
        return jsonify({'error': 'Clave y nombre completo son requeridos'}), 400
    
    # Verificar si ya existe un profesor con esa clave
    existente = execute_query(
        "SELECT id_profesor FROM profesores WHERE clave = %s",
        (clave,),
        fetch_one=True
    )
    if existente:
        return jsonify({'error': 'Ya existe un profesor con esa clave'}), 400
    
    # Insertar
    execute_query(
        "INSERT INTO profesores (clave, nombre_completo, email, activo) VALUES (%s, %s, %s, 1)",
        (clave, nombre_completo, email)
    )
    
    return jsonify({'message': 'Profesor creado exitosamente'}), 201

@app.route('/api/admin/profesores/<int:id_profesor>', methods=['PUT'])
def api_update_profesor(id_profesor):
    """Actualizar un profesor"""
    data = request.get_json()
    clave = data.get('clave')
    nombre_completo = data.get('nombre_completo')
    email = data.get('email')
    activo = data.get('activo', 1)
    
    execute_query(
        """UPDATE profesores 
           SET clave = %s, nombre_completo = %s, email = %s, activo = %s 
           WHERE id_profesor = %s""",
        (clave, nombre_completo, email, activo, id_profesor)
    )
    
    return jsonify({'message': 'Profesor actualizado'}), 200

@app.route('/api/admin/profesores/<int:id_profesor>', methods=['DELETE'])
def api_delete_profesor(id_profesor):
    """Eliminar un profesor"""
    execute_query(
        "DELETE FROM profesores WHERE id_profesor = %s",
        (id_profesor,)
    )
    return jsonify({'message': 'Profesor eliminado'}), 200

# =====================================================
# API - RESERVAS
# =====================================================

@app.route('/api/reservas/aula/<int:aula_id>/semana', methods=['GET'])
def api_get_reservas_semana(aula_id):
    """Obtener reservas de un aula (todas las materias, eventos futuros)"""
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    # Verificar acceso al aula
    if user['rol'] == 'director':
        aula_check = execute_query("""
            SELECT a.id_aula 
            FROM aulas a
            LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
            LEFT JOIN usuarios_carreras uc ON uc.id_carrera = c.id_carrera
            WHERE a.id_aula = %s AND uc.id_usuario = %s
        """, (aula_id, user['id_usuario']), fetch_one=True)
        
        if not aula_check:
            return jsonify({'error': 'No tienes acceso a este aula'}), 403
    
    # ===== CONSULTA DEFINITIVA =====
    # IMPORTANTE: Cambiar la condición para que las materias (clase) siempre se muestren
    reservas = execute_query("""
        SELECT 
            r.id_reserva,
            r.id_aula,
            r.id_dia,
            r.id_bloque,
            r.fecha_asignacion,
            r.grupo,
            r.estado,
            r.tipo_reserva,
            r.evento_nombre,
            m.id_materia,
            m.nombre as materia_nombre,
            m.clave as materia_clave,
            p.id_profesor,
            p.nombre_completo as profesor_nombre,
            p.clave as profesor_clave,
            d.nombre_dia,
            b.hora_inicio,
            b.hora_fin,
            u.nombre_completo as solicitante_nombre
        FROM reservas r
        LEFT JOIN materias m ON r.id_materia = m.id_materia
        LEFT JOIN profesores p ON r.id_profesor = p.id_profesor
        JOIN dias_semana d ON r.id_dia = d.id_dia
        JOIN bloques_horarios b ON r.id_bloque = b.id_bloque
        LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
        WHERE r.id_aula = %s
        AND r.estado = 'activa'
        AND (
            -- MATERIAS: siempre se muestran (sin importar la fecha)
            r.tipo_reserva = 'clase'
            OR 
            -- EVENTOS: solo si son hoy o futuros
            (r.tipo_reserva = 'evento' AND r.fecha_asignacion >= CURDATE())
        )
        ORDER BY d.orden, b.orden_dia
    """, (aula_id,), fetch_all=True)
    
    # Convertir time a string para JSON
    for reserva in reservas:
        if reserva.get('hora_inicio'):
            reserva['hora_inicio'] = str(reserva['hora_inicio'])
        if reserva.get('hora_fin'):
            reserva['hora_fin'] = str(reserva['hora_fin'])
    
    print(f" Reservas devueltas para aula {aula_id}: {len(reservas)}")  # ← Para depurar
    
    return jsonify(reservas), 200

@app.route('/api/reservas', methods=['POST'])
def api_create_reserva():
    """Crear una nueva reserva"""
    data = request.get_json()
    
    id_aula = data.get('id_aula')
    id_dia = data.get('id_dia')
    id_bloque = data.get('id_bloque')
    id_materia = data.get('id_materia')
    id_profesor = data.get('id_profesor')
    grupo = data.get('grupo')
    fecha_asignacion = data.get('fecha_asignacion')
    
    # Validaciones
    if not all([id_aula, id_dia, id_bloque, id_materia, id_profesor, grupo, fecha_asignacion]):
        return jsonify({'error': 'Todos los campos son requeridos'}), 400
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    # Verificar que el bloque no esté ocupado
    existente = execute_query("""
        SELECT id_reserva FROM reservas 
        WHERE id_aula = %s AND id_dia = %s AND id_bloque = %s 
        AND estado = 'activa'
    """, (id_aula, id_dia, id_bloque), fetch_one=True)
    
    if existente:
        return jsonify({'error': 'Este horario ya está ocupado'}), 400
    
    # Si es director, verificar que el aula pertenece a su carrera
    if user['rol'] == 'director':
        aula_check = execute_query("""
            SELECT a.id_aula 
            FROM aulas a
            LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
            LEFT JOIN usuarios_carreras uc ON uc.id_carrera = c.id_carrera
            WHERE a.id_aula = %s AND uc.id_usuario = %s
        """, (id_aula, user['id_usuario']), fetch_one=True)
        
        if not aula_check:
            return jsonify({'error': 'No tienes permiso para reservar este aula'}), 403
    
    # ===== CAMBIO IMPORTANTE =====
    # Para materias (clases), fecha_asignacion = '9999-12-31' (siempre visible)
    # Para eventos, usar la fecha real
    # Por ahora, como no sabemos el tipo, usamos '9999-12-31' para clases
    # pero en el futuro se puede mejorar
    
    # Crear reserva con fecha fija '9999-12-31' para que siempre sea visible
    execute_query("""
        INSERT INTO reservas (id_aula, id_usuario, id_dia, id_bloque, 
                            fecha_reserva, fecha_asignacion, id_materia, id_profesor, grupo, estado)
        VALUES (%s, %s, %s, %s, CURDATE(), '9999-12-31', %s, %s, %s, 'activa')
    """, (id_aula, user['id_usuario'], id_dia, id_bloque, id_materia, id_profesor, grupo))
    
    return jsonify({'message': 'Reserva creada exitosamente'}), 201

@app.route('/api/reservas/<int:id_reserva>', methods=['PUT'])
def api_update_reserva(id_reserva):
    """Actualizar una reserva (solo si es del usuario)"""
    data = request.get_json()
    
    id_materia = data.get('id_materia')
    id_profesor = data.get('id_profesor')
    grupo = data.get('grupo')
    
    if not all([id_materia, id_profesor, grupo]):
        return jsonify({'error': 'Todos los campos son requeridos'}), 400
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    # Verificar que la reserva pertenece al usuario (o es admin)
    if user_id != 1:  # Si no es admin
        reserva_check = execute_query("""
            SELECT id_reserva FROM reservas 
            WHERE id_reserva = %s AND id_usuario = %s
        """, (id_reserva, user_id), fetch_one=True)
        
        if not reserva_check:
            return jsonify({'error': 'No tienes permiso para editar esta reserva'}), 403
    
    execute_query("""
        UPDATE reservas 
        SET id_materia = %s, id_profesor = %s, grupo = %s
        WHERE id_reserva = %s
    """, (id_materia, id_profesor, grupo, id_reserva))
    
    return jsonify({'message': 'Reserva actualizada'}), 200

@app.route('/api/reservas/<int:id_reserva>', methods=['DELETE'])
def api_delete_reserva(id_reserva):
    """Eliminar una reserva (solo si es del usuario)"""
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    # Verificar que la reserva pertenece al usuario (o es admin)
    if user_id != 1:  # Si no es admin
        reserva_check = execute_query("""
            SELECT id_reserva FROM reservas 
            WHERE id_reserva = %s AND id_usuario = %s
        """, (id_reserva, user_id), fetch_one=True)
        
        if not reserva_check:
            return jsonify({'error': 'No tienes permiso para eliminar esta reserva'}), 403
    
    execute_query("""
        UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = %s
    """, (id_reserva,))
    
    return jsonify({'message': 'Reserva cancelada'}), 200

@app.route('/api/reservas/materias', methods=['GET'])
def api_get_materias_reservas():
    """Obtener todas las materias activas"""
    materias = execute_query("""
        SELECT m.id_materia, m.clave, m.nombre, c.clave_carrera
        FROM materias m
        LEFT JOIN carreras c ON m.id_carrera = c.id_carrera
        WHERE m.activo = 1
        ORDER BY m.nombre
    """, fetch_all=True)
    return jsonify(materias), 200


@app.route('/api/reservas/profesores', methods=['GET'])
def api_get_profesores_reservas():
    """Obtener todos los profesores activos"""
    profesores = execute_query("""
        SELECT id_profesor, clave, nombre_completo, email
        FROM profesores
        WHERE activo = 1
        ORDER BY nombre_completo
    """, fetch_all=True)
    return jsonify(profesores), 200


@app.route('/api/reservas/dias', methods=['GET'])
def api_get_dias_reservas():
    """Obtener todos los días de la semana"""
    dias = execute_query("""
        SELECT id_dia, nombre_dia, orden
        FROM dias_semana
        WHERE activo_sabado = 1 OR orden <= 5
        ORDER BY orden
    """, fetch_all=True)
    
    return jsonify(dias), 200

@app.route('/api/reservas/bloques', methods=['GET'])
def api_get_bloques_reservas():
    """Obtener todos los bloques horarios"""
    bloques = execute_query("""
        SELECT id_bloque, hora_inicio, hora_fin, orden_dia
        FROM bloques_horarios
        ORDER BY id_turno, orden_dia
    """, fetch_all=True)
    
    # Convertir time a string para JSON
    for bloque in bloques:
        if bloque.get('hora_inicio'):
            bloque['hora_inicio'] = str(bloque['hora_inicio'])
        if bloque.get('hora_fin'):
            bloque['hora_fin'] = str(bloque['hora_fin'])
    
    return jsonify(bloques), 200

# =====================================================
# API - DATOS DE UN AULA ESPECÍFICA (TABLA DE HORARIOS)
# =====================================================

@app.route('/api/infraestructura/aula/<int:aula_id>', methods=['GET'])
def api_get_aula_data(aula_id):
    """Obtener datos de un aula para el horario"""
    aula = execute_query("""
        SELECT 
            a.id_aula,
            a.identificador,
            a.piso,
            a.capacidad,
            e.nombre as edificio_nombre,
            e.id_edificio,
            c.clave_carrera as carrera_clave,
            u.nombre_completo as director_nombre
        FROM aulas a
        LEFT JOIN edificios e ON a.id_edificio = e.id_edificio
        LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
        LEFT JOIN usuarios u ON u.id_carrera = a.id_carrera_asignada AND u.rol = 'director'
        WHERE a.id_aula = %s AND a.activo = 1
    """, (aula_id,), fetch_one=True)
    
    if not aula:
        return jsonify({'error': 'Aula no encontrada'}), 404
    
    # Obtener todas las carreras que tienen aulas en este edificio
    carreras_edificio = execute_query("""
        SELECT DISTINCT c.clave_carrera, c.nombre_carrera
        FROM aulas a
        LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
        WHERE a.id_edificio = %s AND a.activo = 1 AND c.clave_carrera IS NOT NULL
        ORDER BY c.clave_carrera
    """, (aula['id_edificio'],), fetch_all=True)
    
    aula['carreras_edificio'] = [c['clave_carrera'] for c in carreras_edificio]
    
    return jsonify(aula), 200

#=====================================================
# API - DETALLE DE UN EDIFICIO CON SUS AULAS Y ESTADÍSTICAS
#=====================================================

@app.route('/api/infraestructura/edificio/<int:edificio_id>/detalle', methods=['GET'])
def api_edificio_detalle(edificio_id):
    """Obtener detalle de un edificio con sus aulas"""
    
    # Obtener información del edificio
    edificio = execute_query(
        "SELECT id_edificio, nombre FROM edificios WHERE id_edificio = %s AND activo = 1",
        (edificio_id,),
        fetch_one=True
    )
    
    if not edificio:
        return jsonify({'error': 'Edificio no encontrado'}), 404
    
    # Obtener aulas del edificio con ocupación (incluyendo clases permanentes)
    aulas = execute_query("""
        SELECT 
            a.id_aula,
            a.identificador,
            a.piso,
            a.capacidad,
            t.nombre_tipo as tipo,
            COUNT(r.id_reserva) as reservas_count,
            ROUND(
                (COUNT(r.id_reserva) * 100.0) / 
                ((SELECT COUNT(*) FROM bloques_horarios) * 5)
            ) as porcentaje_ocupacion
        FROM aulas a
        LEFT JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
        LEFT JOIN reservas r ON a.id_aula = r.id_aula 
            AND r.estado = 'activa'
            AND (
                r.tipo_reserva = 'clase'
                OR 
                (r.tipo_reserva = 'evento' AND r.fecha_asignacion >= CURDATE())
            )
        WHERE a.id_edificio = %s AND a.activo = 1
        GROUP BY a.id_aula
        ORDER BY a.piso DESC, a.identificador
    """, (edificio_id,), fetch_all=True)
    
    # Calcular estadísticas
    total_aulas = len(aulas)
    libres = 0
    parciales = 0
    ocupados = 0
    
    for aula in aulas:
        porcentaje = aula.get('porcentaje_ocupacion', 0)
        if porcentaje < 20:
            libres += 1
        elif porcentaje < 80:
            parciales += 1
        else:
            ocupados += 1
    
    return jsonify({
        'edificio_nombre': edificio['nombre'],
        'edificio_id': edificio['id_edificio'],
        'total_aulas': total_aulas,
        'libres': libres,
        'parciales': parciales,
        'ocupados': ocupados,
        'aulas': aulas
    }), 200

# =====================================================
# ADMIN - PÁGINA DE USUARIOS (DIRECTORES)
# =====================================================

@app.route('/admin/directores')
def admin_directores():
    """Gestión de directores"""
    return render_template('admin/directores.html')

# =====================================================
# API - USUARIOS (Admin)
# =====================================================

@app.route('/api/admin/directores', methods=['GET'])
def api_get_directores():
    """Obtener todos los usuarios (directores y admin)"""
    usuarios = execute_query("""
        SELECT u.id_usuario, u.email, u.nombre_completo, u.rol, u.activo, u.foto_perfil,
               GROUP_CONCAT(c.clave_carrera SEPARATOR ', ') as carreras
        FROM usuarios u
        LEFT JOIN usuarios_carreras uc ON u.id_usuario = uc.id_usuario
        LEFT JOIN carreras c ON uc.id_carrera = c.id_carrera
        WHERE u.rol = 'director' OR u.rol = 'admin'
        GROUP BY u.id_usuario
        ORDER BY u.nombre_completo
    """, fetch_all=True)
    return jsonify(usuarios), 200

@app.route('/api/admin/directores', methods=['POST'])
def api_create_director():
    """Crear un nuevo usuario (director)"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    nombre_completo = data.get('nombre_completo')
    rol = data.get('rol', 'director')
    carreras_ids = data.get('carreras', [])
    
    if not email or not password or not nombre_completo:
        return jsonify({'error': 'Todos los campos son requeridos'}), 400
    
    # Verificar si el correo ya existe
    existente = execute_query(
        "SELECT id_usuario FROM usuarios WHERE email = %s",
        (email,),
        fetch_one=True
    )
    if existente:
        return jsonify({'error': 'El correo ya está registrado'}), 400
    
    # Crear usuario (contraseña sin encriptar por ahora)
    usuario_id = execute_query("""
        INSERT INTO usuarios (email, password, nombre_completo, rol, activo, foto_perfil)
        VALUES (%s, %s, %s, %s, 1, '/img/avatar.png')
    """, (email, password, nombre_completo, rol))
    
    if not usuario_id:
        return jsonify({'error': 'Error al crear usuario'}), 500
    
    # Asignar carreras
    if carreras_ids and rol == 'director':
        for id_carrera in carreras_ids:
            execute_query("""
                INSERT INTO usuarios_carreras (id_usuario, id_carrera)
                VALUES (%s, %s)
            """, (usuario_id, id_carrera))
    
    # Devolver el id del usuario creado
    return jsonify({
        'message': 'Usuario creado exitosamente',
        'id': usuario_id  # ← ESTO ES LO QUE FALTABA
    }), 201

@app.route('/api/admin/directores/<int:id_usuario>', methods=['PUT'])
def api_update_director(id_usuario):
    """Actualizar un usuario"""
    data = request.get_json()
    nombre_completo = data.get('nombre_completo')
    email = data.get('email')
    activo = data.get('activo', 1)
    carreras_ids = data.get('carreras', [])
    
    # Actualizar datos básicos
    execute_query("""
        UPDATE usuarios 
        SET nombre_completo = %s, email = %s, activo = %s
        WHERE id_usuario = %s
    """, (nombre_completo, email, activo, id_usuario))
    
    # Actualizar carreras (eliminar todas y volver a insertar)
    execute_query("DELETE FROM usuarios_carreras WHERE id_usuario = %s", (id_usuario,))
    
    for id_carrera in carreras_ids:
        execute_query("""
            INSERT INTO usuarios_carreras (id_usuario, id_carrera)
            VALUES (%s, %s)
        """, (id_usuario, id_carrera))
    
    return jsonify({'message': 'Usuario actualizado'}), 200

@app.route('/api/admin/directores/<int:id_usuario>', methods=['DELETE'])
def api_delete_director(id_usuario):
    """Eliminar un usuario"""
    execute_query("DELETE FROM usuarios_carreras WHERE id_usuario = %s", (id_usuario,))
    execute_query("DELETE FROM usuarios WHERE id_usuario = %s", (id_usuario,))
    return jsonify({'message': 'Usuario eliminado'}), 200

@app.route('/api/admin/selects/directores', methods=['GET'])
def api_get_selects_directores():
    """Obtener datos para selects (carreras)"""
    carreras = execute_query(
        "SELECT id_carrera, clave_carrera, nombre_carrera FROM carreras WHERE activo = 1 ORDER BY nombre_carrera",
        fetch_all=True
    )
    return jsonify({'carreras': carreras}), 200

# =====================================================
# API - SUBIR FOTO DE PERFIL
# =====================================================

@app.route('/api/admin/upload-foto', methods=['POST'])
def api_upload_foto():
    """Subir foto de perfil para un director"""
    
    # Verificar que haya un archivo
    if 'foto' not in request.files:
        return jsonify({'error': 'No se envió ninguna foto'}), 400
    
    file = request.files['foto']
    
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    # Verificar extensión
    extensiones_permitidas = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in extensiones_permitidas:
        return jsonify({'error': 'Formato no permitido. Use JPG, PNG, GIF o WEBP'}), 400
    
    # Generar nombre único
    from datetime import datetime
    import uuid
    
    extension = file.filename.rsplit('.', 1)[1].lower()
    nombre_archivo = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{extension}"
    
    # Ruta donde se guardará
    ruta_relativa = f"img/directores/{nombre_archivo}"
    ruta_completa = os.path.join('..', 'frontend', ruta_relativa)
    
    # Crear carpeta si no existe
    os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
    
    # Guardar archivo
    file.save(ruta_completa)
    
    return jsonify({
        'message': 'Foto subida exitosamente',
        'foto_perfil': f"/{ruta_relativa}"
    }), 200

# =====================================================
# API - ACTUALIZAR FOTO DE PERFIL DE UN DIRECTOR
# ====================================================
@app.route('/api/admin/directores/<int:id_usuario>/foto', methods=['PUT'])
def api_update_director_foto(id_usuario):
    """Actualizar la foto de perfil de un director"""
    data = request.get_json()
    foto_perfil = data.get('foto_perfil')
    
    execute_query("""
        UPDATE usuarios SET foto_perfil = %s WHERE id_usuario = %s
    """, (foto_perfil, id_usuario))
    
    return jsonify({'message': 'Foto actualizada'}), 200

# =====================================================
# API - SOLICITUDES (EVENTOS)
# =====================================================

@app.route('/api/solicitudes', methods=['GET'])
def api_get_solicitudes():
    """Obtener todas las solicitudes (filtrado por rol)"""
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Ver TODAS las solicitudes
        solicitudes = execute_query("""
            SELECT 
                s.*,
                a.identificador as aula_nombre,
                e.nombre as edificio_nombre,
                sol.nombre_completo as solicitante_nombre,
                dest.nombre_completo as destinatario_nombre,
                t.nombre_turno,
                u.foto_perfil as solicitante_foto
            FROM solicitudes s
            JOIN aulas a ON s.id_aula = a.id_aula
            JOIN edificios e ON a.id_edificio = e.id_edificio
            JOIN usuarios sol ON s.id_solicitante = sol.id_usuario
            JOIN usuarios dest ON s.id_destinatario = dest.id_usuario
            JOIN turnos t ON s.id_turno = t.id_turno
            LEFT JOIN usuarios u ON s.id_solicitante = u.id_usuario
            ORDER BY s.creado_en DESC
        """, fetch_all=True)
    else:
        # DIRECTOR: Ver SOLO las solicitudes de su(s) carrera(s)
        # Obtener carreras del director
        carreras = execute_query("""
            SELECT c.id_carrera
            FROM carreras c
            JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
            WHERE uc.id_usuario = %s
        """, (user_id,), fetch_all=True)
        
        if not carreras:
            return jsonify([]), 200
        
        carreras_ids = [c['id_carrera'] for c in carreras]
        carreras_str = ','.join(str(id) for id in carreras_ids)
        
        solicitudes = execute_query(f"""
            SELECT 
                s.*,
                a.identificador as aula_nombre,
                e.nombre as edificio_nombre,
                sol.nombre_completo as solicitante_nombre,
                dest.nombre_completo as destinatario_nombre,
                t.nombre_turno,
                u.foto_perfil as solicitante_foto
            FROM solicitudes s
            JOIN aulas a ON s.id_aula = a.id_aula
            JOIN edificios e ON a.id_edificio = e.id_edificio
            JOIN usuarios sol ON s.id_solicitante = sol.id_usuario
            JOIN usuarios dest ON s.id_destinatario = dest.id_usuario
            JOIN turnos t ON s.id_turno = t.id_turno
            LEFT JOIN usuarios u ON s.id_solicitante = u.id_usuario
            WHERE a.id_carrera_asignada IN ({carreras_str})
            ORDER BY s.creado_en DESC
        """, fetch_all=True)
    
    # Formatear fechas
    for s in solicitudes:
        if s.get('fecha_solicitud'):
            s['fecha_solicitud'] = s['fecha_solicitud'].strftime('%d/%m/%Y') if isinstance(s['fecha_solicitud'], date) else str(s['fecha_solicitud'])
        if s.get('fecha_uso'):
            s['fecha_uso'] = s['fecha_uso'].strftime('%d/%m/%Y') if isinstance(s['fecha_uso'], date) else str(s['fecha_uso'])
    
    return jsonify(solicitudes), 200

@app.route('/api/solicitudes', methods=['POST'])
def api_create_solicitud():
    """Crear una nueva solicitud de evento"""
    data = request.get_json()
    
    id_aula = data.get('id_aula')
    id_dia = data.get('id_dia')
    id_bloque = data.get('id_bloque')
    id_turno = data.get('id_turno')
    motivo = data.get('motivo')
    id_solicitante = data.get('id_solicitante')
    
    if not all([id_aula, id_dia, id_bloque, id_turno, motivo]):
        return jsonify({'error': 'Todos los campos son requeridos'}), 400
    
    if not id_solicitante:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    
    # Obtener el destinatario (dueño del aula) usando la tabla intermedia
    destinatario = execute_query("""
        SELECT u.id_usuario 
        FROM aulas a
        LEFT JOIN carreras c ON a.id_carrera_asignada = c.id_carrera
        LEFT JOIN usuarios_carreras uc ON uc.id_carrera = c.id_carrera
        LEFT JOIN usuarios u ON u.id_usuario = uc.id_usuario
        WHERE a.id_aula = %s AND u.rol = 'director'
    """, (id_aula,), fetch_one=True)
    
    if not destinatario:
        return jsonify({'error': 'No se encontró el director responsable del espacio'}), 404
    
    fecha_solicitud = date.today()
    
    solicitud_id = execute_query("""
        INSERT INTO solicitudes 
        (id_aula, id_solicitante, id_destinatario, fecha_solicitud, 
         id_turno, id_dia, id_bloque, motivo, materia_solicitada, 
         profesor_solicitado, grupo_solicitado, estado)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendiente')
    """, (id_aula, id_solicitante, destinatario['id_usuario'], fecha_solicitud,
          id_turno, id_dia, id_bloque, motivo, 'Evento', 'Evento', 'General'))
    
    if not solicitud_id:
        return jsonify({'error': 'Error al crear la solicitud'}), 500
    
    return jsonify({'message': 'Solicitud de evento creada exitosamente', 'id': solicitud_id}), 201

@app.route('/api/test', methods=['POST'])
def api_test():
    return jsonify({'message': 'Test exitoso'}), 200

@app.route('/api/solicitudes/<int:solicitud_id>/responder', methods=['PUT'])
def api_responder_solicitud(solicitud_id):
    """Aprobar o rechazar una solicitud de evento"""
    data = request.get_json()
    estado = data.get('estado')
    comentario = data.get('comentario', '')
    
    if estado not in ['aprobada', 'rechazada']:
        return jsonify({'error': 'Estado inválido'}), 400
    
    solicitud = execute_query(
        "SELECT * FROM solicitudes WHERE id_solicitud = %s",
        (solicitud_id,),
        fetch_one=True
    )
    
    if not solicitud:
        return jsonify({'error': 'Solicitud no encontrada'}), 404
    
    # Si se aprueba, verificar disponibilidad
    if estado == 'aprobada':
        # Verificar si el bloque está ocupado
        ocupado = execute_query("""
            SELECT id_reserva FROM reservas 
            WHERE id_aula = %s AND id_dia = %s AND id_bloque = %s 
            AND estado = 'activa'
        """, (solicitud['id_aula'], solicitud['id_dia'], solicitud['id_bloque']), fetch_one=True)
        
        if ocupado:
            return jsonify({'error': 'El bloque horario seleccionado ya está ocupado'}), 400
    
    # Actualizar estado
    execute_query("""
        UPDATE solicitudes 
        SET estado = %s, respuesta_comentario = %s, respuesta_fecha = NOW()
        WHERE id_solicitud = %s
    """, (estado, comentario, solicitud_id))
    
    # Si se aprueba, crear la reserva
    if estado == 'aprobada':
        execute_query("""
            INSERT INTO reservas 
            (id_aula, id_usuario, id_dia, id_bloque, fecha_reserva, 
             fecha_asignacion, tipo_reserva, evento_nombre, evento_descripcion, grupo, estado)
            VALUES (%s, %s, %s, %s, CURDATE(), CURDATE(), 'evento', %s, %s, %s, 'activa')
        """, (
            solicitud['id_aula'],
            solicitud['id_solicitante'],
            solicitud['id_dia'],
            solicitud['id_bloque'],
            solicitud['motivo'],
            solicitud['motivo'],
            solicitud['grupo_solicitado'] or 'General'
        ))
    
    return jsonify({'message': f'Solicitud {estado} exitosamente'}), 200

@app.route('/api/solicitudes/pendientes/count', methods=['GET'])
def api_count_solicitudes_pendientes():
    """Contar solicitudes pendientes para el usuario actual"""
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Contar TODAS las pendientes
        count = execute_query("""
            SELECT COUNT(*) as count 
            FROM solicitudes 
            WHERE estado = 'pendiente'
        """, fetch_one=True)
    else:
        # DIRECTOR: Contar SOLO las pendientes de su(s) carrera(s)
        carreras = execute_query("""
            SELECT c.id_carrera
            FROM carreras c
            JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
            WHERE uc.id_usuario = %s
        """, (user_id,), fetch_all=True)
        
        if not carreras:
            return jsonify({'count': 0}), 200
        
        carreras_ids = [c['id_carrera'] for c in carreras]
        carreras_str = ','.join(str(id) for id in carreras_ids)
        
        count = execute_query(f"""
            SELECT COUNT(*) as count 
            FROM solicitudes s
            JOIN aulas a ON s.id_aula = a.id_aula
            WHERE s.estado = 'pendiente'
            AND a.id_carrera_asignada IN ({carreras_str})
        """, fetch_one=True)
    
    return jsonify({'count': count['count'] if count else 0}), 200

# =====================================================
# API - REPORTES
# =====================================================

@app.route('/api/reportes/ocupacion-turno', methods=['GET'])
def api_reporte_ocupacion_turno():
    """Obtener datos de ocupación por turno (filtrado por rol)"""
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Ver TODOS los edificios
        data = get_ocupacion_por_turno()
    else:
        # DIRECTOR: Ver SOLO los edificios de su(s) carrera(s)
        carreras = execute_query("""
            SELECT c.id_carrera
            FROM carreras c
            JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
            WHERE uc.id_usuario = %s
        """, (user_id,), fetch_all=True)
        
        if not carreras:
            return jsonify([]), 200
        
        carreras_ids = [c['id_carrera'] for c in carreras]
        carreras_str = ','.join(str(id) for id in carreras_ids)
        
        data = execute_query(f"""
            SELECT 
                e.nombre as edificio,
                t.nombre_turno as turno,
                COUNT(DISTINCT a.id_aula) as total_aulas,
                COUNT(DISTINCT CASE 
                    WHEN r.id_reserva IS NOT NULL 
                    AND r.estado = 'activa'
                    AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
                    THEN a.id_aula 
                END) as aulas_ocupadas,
                ROUND(
                    (COUNT(DISTINCT CASE 
                        WHEN r.id_reserva IS NOT NULL 
                        AND r.estado = 'activa'
                        AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
                        THEN a.id_aula 
                    END) * 100.0) / COUNT(DISTINCT a.id_aula)
                ) as porcentaje
            FROM edificios e
            JOIN aulas a ON e.id_edificio = a.id_edificio
            CROSS JOIN turnos t
            LEFT JOIN reservas r ON r.id_aula = a.id_aula
                AND r.id_bloque IN (SELECT id_bloque FROM bloques_horarios WHERE id_turno = t.id_turno)
                AND r.estado = 'activa'
                AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
            WHERE e.activo = 1 AND a.activo = 1
            AND a.id_carrera_asignada IN ({carreras_str})
            GROUP BY e.id_edificio, t.id_turno
            ORDER BY e.nombre
        """, fetch_all=True)
    
    return jsonify(data), 200

@app.route('/api/reportes/tipos-espacio', methods=['GET'])
def api_reporte_tipos_espacio():
    """Obtener distribución de tipos de espacio (filtrado por rol)"""
    
    # Obtener usuario autenticado
    user_id = request.headers.get('X-User-Id', 1)
    
    user = execute_query(
        "SELECT id_usuario, rol, id_carrera FROM usuarios WHERE id_usuario = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if user['rol'] == 'admin':
        # ADMIN: Ver TODOS los tipos de espacio
        data = get_tipos_espacio()
    else:
        # DIRECTOR: Ver SOLO los tipos de espacio de su(s) carrera(s)
        carreras = execute_query("""
            SELECT c.id_carrera
            FROM carreras c
            JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
            WHERE uc.id_usuario = %s
        """, (user_id,), fetch_all=True)
        
        if not carreras:
            return jsonify([]), 200
        
        carreras_ids = [c['id_carrera'] for c in carreras]
        carreras_str = ','.join(str(id) for id in carreras_ids)
        
        data = execute_query(f"""
            SELECT 
                t.nombre_tipo as tipo,
                COUNT(a.id_aula) as cantidad
            FROM aulas a
            JOIN tipos_aula t ON a.id_tipo_aula = t.id_tipo_aula
            WHERE a.activo = 1
            AND a.id_carrera_asignada IN ({carreras_str})
            GROUP BY t.id_tipo_aula
            ORDER BY cantidad DESC
        """, fetch_all=True)
    
    return jsonify(data), 200

# =====================================================
# API - CONFIGURACIÓN
# =====================================================

def mes_en_espanol(mes_numero):
    meses = {
        1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
        5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
        9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
    }
    return meses.get(mes_numero, '')

@app.route('/api/config/ciclo', methods=['GET'])
def api_get_ciclo():
    """Obtener el ciclo actual (automático)"""
    from db_config import get_ciclo_actual
    from datetime import datetime
    
    ciclo = get_ciclo_actual()
    ahora = datetime.now()
    mes = ahora.month
    dia = ahora.day
    año = ahora.year
    fecha_actual = f"{dia} de {mes_en_espanol(mes)} de {año}"
    
    return jsonify({
        'ciclo': ciclo,
        'fecha': fecha_actual
    }), 200

@app.route('/admin/configuracion')
def admin_configuracion():
    """Configuración del sistema"""
    return render_template('admin/configuracion.html')

# =====================================================
# INICIAR APLICACIÓN
# =====================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)