"""
Controlador de Edificio - Capa de controladores
Maneja las peticiones HTTP y respuestas
"""
from flask import request, jsonify

class EdificioController:
    """Controlador para la gestión de edificios"""
    
    @staticmethod
    def get_all():
        """Obtener todos los edificios"""
        try:
            edificios = EdificioService.get_all_edificios()
            return jsonify({
                'success': True,
                'data': edificios,
                'total': len(edificios)
            }), 200
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al obtener edificios: {str(e)}'
            }), 500
    
    @staticmethod
    def get_by_id(edificio_id):
        """Obtener un edificio por ID"""
        try:
            edificio = EdificioService.get_edificio_by_id(edificio_id)
            if not edificio:
                return jsonify({
                    'success': False,
                    'error': 'Edificio no encontrado'
                }), 404
            
            return jsonify({
                'success': True,
                'data': edificio
            }), 200
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al obtener edificio: {str(e)}'
            }), 500
    
    @staticmethod
    def create():
        """Crear un nuevo edificio"""
        try:
            data = request.get_json()
            
            # Validar datos requeridos
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'No se recibieron datos'
                }), 400
            
            if not data.get('nombre'):
                return jsonify({
                    'success': False,
                    'error': 'El nombre del edificio es requerido'
                }), 400
            
            if not data.get('tipo_edificio'):
                return jsonify({
                    'success': False,
                    'error': 'El tipo de edificio es requerido'
                }), 400
            
            # Crear edificio
            result = EdificioService.create_edificio(
                nombre=data['nombre'],
                tipo_edificio=data['tipo_edificio'],
                activo=data.get('activo', 1)
            )
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al crear edificio: {str(e)}'
            }), 500
    
    @staticmethod
    def update(edificio_id):
        """Actualizar un edificio existente"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'No se recibieron datos'
                }), 400
            
            if not data.get('nombre'):
                return jsonify({
                    'success': False,
                    'error': 'El nombre del edificio es requerido'
                }), 400
            
            if not data.get('tipo_edificio'):
                return jsonify({
                    'success': False,
                    'error': 'El tipo de edificio es requerido'
                }), 400
            
            result = EdificioService.update_edificio(
                edificio_id=edificio_id,
                nombre=data['nombre'],
                tipo_edificio=data['tipo_edificio'],
                activo=data.get('activo', 1)
            )
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al actualizar edificio: {str(e)}'
            }), 500
    
    @staticmethod
    def delete(edificio_id):
        """Eliminar (desactivar) un edificio"""
        try:
            result = EdificioService.delete_edificio(edificio_id)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al eliminar edificio: {str(e)}'
            }), 500