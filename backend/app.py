"""
SIGAE - APLICACIÓN COMPLETA CON RUTAS DIRECTAS
VERSIÓN SIMPLE - SIN SPA, SIN JAVASCRIPT COMPLEJO
"""

from flask import Flask, render_template, send_from_directory, request, jsonify, redirect, url_for
from flask_cors import CORS
import os
import re

# Importar configuración y base de datos
from config import config
from db_config import execute_query, get_ocupacion_edificios_admin, get_subutilizadas_admin, get_alta_demanda_admin, get_dashboard_stats_admin

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
    # Obtener usuario del token o sesión
    # Por ahora, simulamos: si es admin, ve todo; si es director, ve su carrera
    # TODO: Obtener usuario autenticado
    
    # TEMPORAL: Usar admin por defecto
    # Luego esto se reemplazará con el usuario real de la sesión
    
    # Simulación: admin ve todo
    stats = get_dashboard_stats_admin()
    alta_demanda = get_alta_demanda_admin()
    subutilizadas = get_subutilizadas_admin()
    ocupacion_edificios = get_ocupacion_edificios_admin()
    
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
    """Lista de edificios"""
    edificios = execute_query(
        "SELECT id_edificio, nombre, tipo_edificio FROM edificios WHERE activo = 1",
        fetch_all=True
    )
    return jsonify(edificios), 200

@app.route('/api/infraestructura/edificios/<int:edificio_id>/aulas', methods=['GET'])
def api_aulas_by_edificio(edificio_id):
    """Aulas de un edificio"""
    aulas = execute_query(
        """SELECT a.id_aula, a.identificador, a.piso, a.capacidad, 
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
               AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
           WHERE a.id_edificio = %s AND a.activo = 1
           GROUP BY a.id_aula""",
        (edificio_id,),
        fetch_all=True
    )
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
    nombre = data.get('nombre_carrera')
    activo = data.get('activo', 1)
    
    execute_query(
        "UPDATE carreras SET nombre_carrera = %s, activo = %s WHERE id_carrera = %s",
        (nombre, activo, id_carrera)
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
    """Obtener todas las reservas de un aula para la semana actual"""
    reservas = execute_query("""
        SELECT 
            r.id_reserva,
            r.id_aula,
            r.id_dia,
            r.id_bloque,
            r.fecha_asignacion,
            r.grupo,
            r.estado,
            m.id_materia,
            m.nombre as materia_nombre,
            m.clave as materia_clave,
            p.id_profesor,
            p.nombre_completo as profesor_nombre,
            p.clave as profesor_clave,
            d.nombre_dia,
            b.hora_inicio,
            b.hora_fin
        FROM reservas r
        LEFT JOIN materias m ON r.id_materia = m.id_materia
        LEFT JOIN profesores p ON r.id_profesor = p.id_profesor
        JOIN dias_semana d ON r.id_dia = d.id_dia
        JOIN bloques_horarios b ON r.id_bloque = b.id_bloque
        WHERE r.id_aula = %s
        AND r.estado = 'activa'
        AND YEARWEEK(r.fecha_asignacion) = YEARWEEK(CURDATE())
        ORDER BY d.orden, b.orden_dia
    """, (aula_id,), fetch_all=True)
    
    # Convertir time a string para JSON
    for reserva in reservas:
        if reserva.get('hora_inicio'):
            reserva['hora_inicio'] = str(reserva['hora_inicio'])
        if reserva.get('hora_fin'):
            reserva['hora_fin'] = str(reserva['hora_fin'])
    
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
    
    # Verificar que el bloque no esté ocupado
    existente = execute_query("""
        SELECT id_reserva FROM reservas 
        WHERE id_aula = %s AND id_dia = %s AND id_bloque = %s 
        AND fecha_asignacion = %s AND estado = 'activa'
    """, (id_aula, id_dia, id_bloque, fecha_asignacion), fetch_one=True)
    
    if existente:
        return jsonify({'error': 'Este horario ya está ocupado'}), 400
    
    # Obtener usuario de la sesión (por ahora usamos el usuario 1)
    # TODO: Obtener usuario autenticado
    id_usuario = 1
    
    # Crear reserva
    execute_query("""
        INSERT INTO reservas (id_aula, id_usuario, id_dia, id_bloque, 
                            fecha_reserva, fecha_asignacion, id_materia, id_profesor, grupo, estado)
        VALUES (%s, %s, %s, %s, CURDATE(), %s, %s, %s, %s, 'activa')
    """, (id_aula, id_usuario, id_dia, id_bloque, fecha_asignacion, id_materia, id_profesor, grupo))
    
    return jsonify({'message': 'Reserva creada exitosamente'}), 201


@app.route('/api/reservas/<int:id_reserva>', methods=['PUT'])
def api_update_reserva(id_reserva):
    """Actualizar una reserva"""
    data = request.get_json()
    
    id_materia = data.get('id_materia')
    id_profesor = data.get('id_profesor')
    grupo = data.get('grupo')
    
    if not all([id_materia, id_profesor, grupo]):
        return jsonify({'error': 'Todos los campos son requeridos'}), 400
    
    execute_query("""
        UPDATE reservas 
        SET id_materia = %s, id_profesor = %s, grupo = %s
        WHERE id_reserva = %s
    """, (id_materia, id_profesor, grupo, id_reserva))
    
    return jsonify({'message': 'Reserva actualizada'}), 200


@app.route('/api/reservas/<int:id_reserva>', methods=['DELETE'])
def api_delete_reserva(id_reserva):
    """Eliminar una reserva (cancelar)"""
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
# INICIAR APLICACIÓN
# =====================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)