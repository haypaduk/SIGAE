"""
SIGAE - Archivo de configuración
Ubicación: backend/config.py

Este archivo maneja las configuraciones del sistema:
- Conexión a base de datos
- Secret keys
- Configuración de JWT
- Límites de carga
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuración base del sistema"""
    
    # =====================================================
    # MYSQL - Configuración de base de datos
    # =====================================================
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'sigae_db')
    
    # =====================================================
    # FLASK - Configuración de la aplicación
    # =====================================================
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # =====================================================
    # JWT - Tokens de autenticación (sin encriptación aún)
    # =====================================================
    JWT_SECRET = os.getenv('JWT_SECRET', 'jwt-secret-key-change')
    JWT_EXPIRATION_HOURS = 24
    
    # =====================================================
    # SESSION - Configuración de sesiones
    # =====================================================
    SESSION_TYPE = 'filesystem'
    
    # =====================================================
    # SOCKETIO - WebSockets para tiempo real
    # =====================================================
    SOCKETIO_CORS_ALLOWED_ORIGINS = "*"
    
    # =====================================================
    # FRONTEND - URL del frontend
    # =====================================================
    FRONTEND_URL = "http://localhost:5000"
    
    # =====================================================
    # UPLOAD - Configuración de archivos (fotos de perfil)
    # =====================================================
    UPLOAD_FOLDER = "frontend/img"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


class DevelopmentConfig(Config):
    """Configuración para entorno de desarrollo"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Configuración para entorno de producción"""
    DEBUG = False
    TESTING = False


# =====================================================
# Diccionario de configuraciones por entorno
# =====================================================
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}