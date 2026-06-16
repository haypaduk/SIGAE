/**
 * =====================================================
 * SIGAE - CLIENTE DE API
 * Archivo: frontend/js/api.js
 * =====================================================
 * 
 * Este archivo centraliza TODAS las llamadas al backend.
 * 
 * ¿Para qué sirve?
 * - No repetir fetch() en cada archivo
 * - Maneja automáticamente el token de autenticación
 * - Centraliza errores (401 = token expirado → redirige a login)
 * 
 * ¿Cómo se usa?
 * import { api } from './api.js';
 * const stats = await api.getDashboardStats();
 * 
 * =====================================================
 */

// =====================================================
// BASE URL DE LA API
// Todas las peticiones se hacen a /api/...
// =====================================================
const API_BASE = '/api';

/**
 * Cliente principal de la API
 * Gestiona el token de autenticación y las peticiones HTTP
 */
class APIClient {
    /**
     * Constructor - Carga el token guardado en localStorage
     */
    constructor() {
        this.token = localStorage.getItem('token');
    }
    
    /**
     * Guarda o elimina el token de autenticación
     * @param {string|null} token - Token JWT o null para cerrar sesión
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }
    
    /**
     * Construye los headers HTTP necesarios para cada petición
     * Incluye Content-Type: application/json y Authorization: Bearer {token}
     * @returns {Object} Headers para fetch()
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Si hay token, lo incluye en el header Authorization
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    /**
     * Método genérico para hacer peticiones a la API
     * @param {string} endpoint - Ruta de la API (ej: '/auth/login')
     * @param {Object} options - Opciones de fetch (method, body, etc.)
     * @returns {Promise} Respuesta parseada como JSON
     * @throws {Error} Si la respuesta no es OK o hay error de red
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: { ...this.getHeaders(), ...options.headers }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Si el token expiró o es inválido (401), cerrar sesión
                if (response.status === 401) {
                    this.setToken(null);
                    localStorage.removeItem('user');
                    window.location.href = '/login.html';
                }
                throw new Error(data.error || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // =====================================================
    // MÓDULO DE AUTENTICACIÓN
    // =====================================================
    
    /**
     * Inicia sesión con email y contraseña
     * @param {string} email - Correo institucional (@utvtol.edu.mx)
     * @param {string} password - Contraseña
     * @returns {Promise} Datos del usuario y token
     */
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data;
    }
    
    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario (nombre, email, password, rol, id_carrera)
     * @returns {Promise} Mensaje de éxito
     */
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    /**
     * Obtiene la lista de carreras (para el select del registro)
     * @returns {Promise} Lista de carreras activas
     */
    async getCarreras() {
        return this.request('/auth/carreras');
    }
    
    // =====================================================
    // MÓDULO DASHBOARD
    // =====================================================
    
    /**
     * Obtiene todas las estadísticas del dashboard
     * @returns {Promise} { stats, alta_demanda, subutilizadas }
     */
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
    
    // =====================================================
    // MÓDULO INFRAESTRUCTURA
    // =====================================================
    
    /**
     * Obtiene la lista de edificios
     * @returns {Promise} Lista de edificios con sus datos
     */
    async getEdificios() {
        return this.request('/infraestructura/edificios');
    }
    
    /**
     * Obtiene las aulas de un edificio específico
     * @param {number} edificioId - ID del edificio
     * @returns {Promise} Lista de aulas del edificio
     */
    async getAulasByEdificio(edificioId) {
        return this.request(`/infraestructura/edificios/${edificioId}/aulas`);
    }
    
    /**
     * Obtiene el horario semanal de un aula específica
     * @param {number} aulaId - ID del aula
     * @returns {Promise} Horario con materias, profesores, grupos
     */
    async getHorarioAula(aulaId) {
        return this.request(`/infraestructura/aulas/${aulaId}/horario`);
    }
    
    // =====================================================
    // MÓDULO SOLICITUDES
    // =====================================================
    
    /**
     * Obtiene todas las solicitudes del usuario actual
     * @returns {Promise} Lista de solicitudes (enviadas y recibidas)
     */
    async getSolicitudes() {
        return this.request('/solicitudes');
    }
    
    /**
     * Crea una nueva solicitud para usar un aula de otra carrera
     * @param {Object} data - Datos de la solicitud (aula, fecha, turno, motivo, etc.)
     * @returns {Promise} Confirmación de creación
     */
    async crearSolicitud(data) {
        return this.request('/solicitudes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Responde a una solicitud (aprobar o rechazar)
     * @param {number} solicitudId - ID de la solicitud
     * @param {string} estado - 'aprobada' o 'rechazada'
     * @param {string} comentario - Comentario opcional
     * @returns {Promise} Confirmación de respuesta
     */
    async responderSolicitud(solicitudId, estado, comentario) {
        return this.request(`/solicitudes/${solicitudId}/responder`, {
            method: 'PUT',
            body: JSON.stringify({ estado, comentario })
        });
    }
    
    // =====================================================
    // MÓDULO REPORTES
    // =====================================================
    
    /**
     * Obtiene datos para el reporte de ocupación por turno
     * @returns {Promise} Datos para gráficas de ocupación
     */
    async getReporteOcupacion() {
        return this.request('/reportes/ocupacion');
    }
    
    /**
     * Obtiene el inventario completo de infraestructura
     * @returns {Promise} Tabla con todos los edificios y sus espacios
     */
    async getInventario() {
        return this.request('/reportes/inventario');
    }
}

// =====================================================
// INSTANCIA ÚNICA (Singleton)
// Exportamos una sola instancia para usar en toda la app
// =====================================================
const api = new APIClient();