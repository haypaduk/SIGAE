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
from db_config import execute_query

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
    
    # Buscar usuario
    user = execute_query(
        "SELECT id_usuario, email, nombre_completo, rol, id_carrera FROM usuarios WHERE email = %s AND password = %s AND activo = 1",
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
    
    user_data = {
        'id': user['id_usuario'],
        'nombre': user['nombre_completo'],
        'email': user['email'],
        'rol': user['rol'],
        'carreras': carreras
    }
    
    return jsonify({'user': user_data}), 200

# =====================================================
# API DE DASHBOARD
# =====================================================

@app.route('/api/dashboard/stats', methods=['GET'])
def api_dashboard_stats():
    """Estadísticas del dashboard"""
    stats = {
        'total_espacios': 52,
        'total_edificios': 7,
        'disponibles': 19,
        'porcentaje_disponibles': 37,
        'uso_parcial': 16,
        'porcentaje_parcial': 31,
        'ocupados': 17,
        'porcentaje_ocupados': 33,
        'porcentaje_global': 48
    }
    return jsonify({'stats': stats}), 200

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
# INICIAR APLICACIÓN
# =====================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)