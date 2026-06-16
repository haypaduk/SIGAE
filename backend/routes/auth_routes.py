"""
SIGAE - Rutas de Autenticación
Ubicación: backend/routes/auth_routes.py

Maneja:
- Login de usuarios (SIN registro público)
- Validación de correo (@utvtol.edu.mx)
- Retorna la(s) carrera(s) del director en el login
"""

from flask import Blueprint, request, jsonify
from db_config import execute_query
import re

# Crear el Blueprint para rutas de autenticación
auth_bp = Blueprint('auth', __name__)


def validar_correo_utvt(email):
    """
    Valida que el correo termine en @utvtol.edu.mx
    
    Args:
        email (str): Correo electrónico a validar
    
    Returns:
        bool: True si es válido, False si no
    """
    patron = r'^[a-zA-Z0-9._%+-]+@utvtol\.edu\.mx$'
    return re.match(patron, email) is not None


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Inicia sesión de un usuario
    
    Espera JSON:
        - email: Correo electrónico (@utvtol.edu.mx)
        - password: Contraseña
    
    Retorna:
        - user: Datos del usuario (incluye carreras si es director)
        - message: Mensaje de éxito
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Validar campos requeridos
    if not email or not password:
        return jsonify({'error': 'Email y contraseña requeridos'}), 400
    
    # Validar dominio del correo
    if not validar_correo_utvt(email):
        return jsonify({'error': 'Solo se aceptan correos @utvtol.edu.mx'}), 400
    
    # Buscar usuario en la base de datos
    user = execute_query(
        """SELECT id_usuario, email, password, nombre_completo, rol, id_carrera 
           FROM usuarios WHERE email = %s AND activo = 1""",
        (email,),
        fetch_one=True
    )
    
    # Verificar credenciales
    if not user or user['password'] != password:
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    # Obtener nombre de la carrera principal
    carrera_principal_nombre = None
    if user['id_carrera']:
        carrera = execute_query(
            "SELECT nombre_carrera FROM carreras WHERE id_carrera = %s",
            (user['id_carrera'],),
            fetch_one=True
        )
        if carrera:
            carrera_principal_nombre = carrera['nombre_carrera']
    
    # Si es director, obtener TODAS sus carreras (tabla intermedia)
    carreras_lista = []
    if user['rol'] == 'director':
        carreras_lista = execute_query(
            """SELECT c.id_carrera, c.clave_carrera, c.nombre_carrera
               FROM carreras c
               JOIN usuarios_carreras uc ON c.id_carrera = uc.id_carrera
               WHERE uc.id_usuario = %s""",
            (user['id_usuario'],),
            fetch_all=True
        )
        
        # Si no tiene carreras en la tabla intermedia, usar la principal
        if not carreras_lista and user['id_carrera']:
            carrera = execute_query(
                "SELECT id_carrera, clave_carrera, nombre_carrera FROM carreras WHERE id_carrera = %s",
                (user['id_carrera'],),
                fetch_one=True
            )
            if carrera:
                carreras_lista = [carrera]
    
    # Datos del usuario
    user_data = {
        'id': user['id_usuario'],
        'nombre': user['nombre_completo'],
        'email': user['email'],
        'rol': user['rol'],
        'id_carrera': user['id_carrera'],
        'carrera_principal': carrera_principal_nombre,
        'carreras': carreras_lista  # Lista de todas las carreras del director
    }
    
    return jsonify({
        'message': 'Inicio de sesión exitoso',
        'user': user_data
    }), 200