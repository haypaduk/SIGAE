"""
SIGAE - Rutas del Dashboard
Ubicación: backend/routes/dashboard_routes.py

Maneja:
- Estadísticas generales del dashboard
- Aulas de alta demanda
- Aulas subutilizadas
"""

from flask import Blueprint, jsonify
from db_config import get_dashboard_stats, get_aulas_alta_demanda, get_aulas_subutilizadas

# Crear el Blueprint para rutas del dashboard
dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
def stats():
    """
    Obtiene todas las estadísticas del dashboard
    
    Retorna JSON con:
        - stats: Estadísticas generales
        - alta_demanda: Lista de aulas más ocupadas
        - subutilizadas: Lista de aulas menos ocupadas
    """
    stats = get_dashboard_stats()
    alta_demanda = get_aulas_alta_demanda(5)
    subutilizadas = get_aulas_subutilizadas(5)
    
    return jsonify({
        'stats': stats,
        'alta_demanda': alta_demanda,
        'subutilizadas': subutilizadas
    }), 200


@dashboard_bp.route('/alta-demanda', methods=['GET'])
def alta_demanda():
    """
    Obtiene solo las aulas de alta demanda
    """
    aulas = get_aulas_alta_demanda(5)
    return jsonify(aulas), 200


@dashboard_bp.route('/subutilizadas', methods=['GET'])
def subutilizadas():
    """
    Obtiene solo las aulas subutilizadas
    """
    aulas = get_aulas_subutilizadas(5)
    return jsonify(aulas), 200