/**
 * SIGAE - ADMIN - UTILIDADES
 * Archivo: frontend/js/admin/utils.js
 * 
 * Funciones auxiliares para el panel de administración:
 * - Notificaciones (toasts)
 * - Confirmaciones personalizadas
 */

// =====================================================
// NOTIFICACIONES (Toasts)
// =====================================================
function showToast(message, type = 'info', title = '') {
    // Tipos: 'success', 'error', 'info'
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    const titles = {
        success: '¡Éxito!',
        error: 'Error',
        info: 'Información'
    };
    
    const container = document.getElementById('toast-container');
    if (!container) {
        // Crear el contenedor si no existe
        const newContainer = document.createElement('div');
        newContainer.id = 'toast-container';
        newContainer.className = 'toast-container';
        document.body.appendChild(newContainer);
    }
    
    const finalTitle = title || titles[type] || 'Información';
    const icon = icons[type] || icons.info;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icon}"></i>
        <div class="toast-content">
            <h4>${finalTitle}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.closest('.toast').remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Eliminar automáticamente después de 4 segundos
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

// =====================================================
// CONFIRMACIÓN PERSONALIZADA
// =====================================================
function showConfirm(message, onConfirm, onCancel = null) {
    // Verificar si ya existe un modal de confirmación
    let confirmModal = document.getElementById('confirmModal');
    
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmModal';
        confirmModal.className = 'modal';
        confirmModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>
                    Confirmar
                </h3>
                <p id="confirm-message" style="color: #555; margin-bottom: 20px; line-height: 1.5;"></p>
                <div class="modal-actions" style="justify-content: center;">
                    <button class="btn-secondary" id="confirm-cancel">Cancelar</button>
                    <button class="btn-danger" id="confirm-ok">Eliminar</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
    }
    
    document.getElementById('confirm-message').textContent = message;
    confirmModal.classList.add('active');
    
    return new Promise((resolve) => {
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');
        
        const cleanup = () => {
            confirmModal.classList.remove('active');
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
        };
        
        const handleCancel = () => {
            cleanup();
            if (onCancel) onCancel();
            resolve(false);
        };
        
        const handleOk = () => {
            cleanup();
            if (onConfirm) onConfirm();
            resolve(true);
        };
        
        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
        
        // Cerrar al hacer clic fuera
        confirmModal.addEventListener('click', function(e) {
            if (e.target === this) {
                handleCancel();
            }
        });
    });
}