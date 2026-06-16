"""
SIGAE - Aplicación Principal
Ubicación: backend/app.py

Este es el punto de entrada del sistema.
Conecta:
- Frontend (archivos estáticos)
- Blueprints (rutas de la API)
- WebSockets (SocketIO)
"""

from flask import Flask, request, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from config import config
import os

# =====================================================
# INICIALIZAR FLASK
# =====================================================
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Cargar configuración según entorno
env = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Configurar CORS (permite peticiones desde el frontend)
CORS(app, origins=app.config.get('SOCKETIO_CORS_ALLOWED_ORIGINS'))

# Inicializar SocketIO (WebSockets para tiempo real)
socketio = SocketIO(app, cors_allowed_origins=app.config.get('SOCKETIO_CORS_ALLOWED_ORIGINS'))

# =====================================================
# RUTAS ESTÁTICAS (Frontend)
# =====================================================

@app.route('/')
def serve_index():
    """Sirve la página principal"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Sirve cualquier archivo estático (CSS, JS, HTML, imágenes)"""
    return send_from_directory('../frontend', path)

# =====================================================
# REGISTRAR BLUEPRINTS (Módulos de la API)
# =====================================================

from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.infraestructura_routes import infraestructura_bp
from routes.solicitudes_routes import solicitudes_bp
from routes.reportes_routes import reportes_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(infraestructura_bp, url_prefix='/api/infraestructura')
app.register_blueprint(solicitudes_bp, url_prefix='/api/solicitudes')
app.register_blueprint(reportes_bp, url_prefix='/api/reportes')

# =====================================================
# EVENTOS WEBSOCKET
# =====================================================

@socketio.on('connect')
def handle_connect():
    """Cliente conectado al WebSocket"""
    print(f'Cliente conectado: {request.sid}')
    socketio.emit('connected', {'message': 'Conectado al servidor SIGAE'})

@socketio.on('disconnect')
def handle_disconnect():
    """Cliente desconectado del WebSocket"""
    print(f'Cliente desconectado: {request.sid}')

# =====================================================
# PUNTO DE ENTRADA
# =====================================================

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)