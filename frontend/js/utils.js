/**
 * SIGAE - Utilidades y funciones auxiliares
 * Ubicación: frontend/js/utils.js
 * 
 * Funciones de uso común en todo el sistema
 */

// =====================================================
// FORMATEO DE FECHAS
// =====================================================

/**
 * Formatea una fecha a formato legible
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 de junio de 2026")
 */
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-MX', opciones);
}

/**
 * Obtiene el nombre del día de la semana
 * @param {number} diaNum - Número del día (1=Lunes, 6=Sábado)
 * @returns {string} Nombre del día
 */
function getNombreDia(diaNum) {
    const dias = {
        1: 'Lunes',
        2: 'Martes', 
        3: 'Miércoles',
        4: 'Jueves',
        5: 'Viernes',
        6: 'Sábado'
    };
    return dias[diaNum] || 'Desconocido';
}

// =====================================================
// MANEJO DEL USUARIO
// =====================================================

/**
 * Obtiene el usuario actual del localStorage
 * @returns {Object|null} Datos del usuario o null
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} True si hay token
 */
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// =====================================================
// CÁLCULO DE PORCENTAJES
// =====================================================

/**
 * Calcula el porcentaje de ocupación de un aula
 * @param {number} reservas - Número de reservas
 * @param {number} totalBloques - Total de bloques disponibles (por defecto 70)
 * @returns {number} Porcentaje redondeado
 */
function calcularPorcentajeOcupacion(reservas, totalBloques = 70) {
    if (totalBloques === 0) return 0;
    return Math.round((reservas / totalBloques) * 100);
}

/**
 * Obtiene la clase CSS según el porcentaje de ocupación
 * @param {number} porcentaje - Porcentaje de 0 a 100
 * @returns {string} Clase CSS ('high-demand', 'underutilized', 'normal')
 */
function getClasePorcentaje(porcentaje) {
    if (porcentaje >= 80) return 'high-demand';
    if (porcentaje <= 30) return 'underutilized';
    return 'normal';
}

// =====================================================
// MANEJO DE MODALES
// =====================================================

/**
 * Abre un modal con contenido
 * @param {string} titulo - Título del modal
 * @param {string} contenido - Contenido HTML del modal
 */
function abrirModal(titulo, contenido) {
    // Verificar si ya existe un modal
    let modal = document.getElementById('globalModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'globalModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${titulo}</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                ${contenido}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Cerrar modal al hacer clic en la X
    modal.querySelector('.modal-close').onclick = () => {
        modal.style.display = 'none';
    };
    
    // Cerrar modal al hacer clic fuera
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Cierra el modal actual
 */
function cerrarModal() {
    const modal = document.getElementById('globalModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// =====================================================
// VALIDACIONES
// =====================================================

/**
 * Valida que el correo sea del dominio @utvtol.edu.mx
 * @param {string} email - Correo a validar
 * @returns {boolean} True si es válido
 */
function validarCorreoUTVT(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@utvtol\.edu\.mx$/;
    return regex.test(email);
}

/**
 * Valida que la contraseña tenga al menos 6 caracteres
 * @param {string} password - Contraseña a validar
 * @returns {boolean} True si es válida
 */
function validarPassword(password) {
    return password && password.length >= 6;
}

// =====================================================
// ESTILOS PARA MODALES (agregar a main.css después)
// =====================================================

// Estilos para modales (se pueden agregar dinámicamente)
const modalStyles = `
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 10px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: #333;
}

.modal-close {
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.modal-close:hover {
    color: #333;
}

.modal-body {
    padding: 20px;
}
`;

// Agregar estilos de modal al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);