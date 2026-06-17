/**
 * SIGAE - LÓGICA DE LOGIN
 * Archivo: frontend/js/login.js
 * 
 * Funciones específicas para la página de login:
 * - Envío de credenciales al servidor
 * - Modal de "olvidó contraseña"
 * - Manejo de errores y alertas
 */

// =====================================================
// LOGIN FORM
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const btn = document.getElementById('loginBtn');
        
        // Validar campos
        if (!email || !password) {
            mostrarAlerta('Por favor llena todos los campos', 'error');
            return;
        }
        
        // Validar dominio
        if (!email.endsWith('@utvtol.edu.mx')) {
            mostrarAlerta('Solo se aceptan correos @utvtol.edu.mx', 'error');
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        btn.textContent = 'Cargando...';
        btn.disabled = true;
        
        // Enviar petición al servidor
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                // Guardar usuario y redirigir
                localStorage.setItem('user', JSON.stringify(data.user));
                mostrarAlerta('✅ Inicio de sesión exitoso', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            } else {
                mostrarAlerta(data.error || 'Credenciales inválidas', 'error');
                btn.textContent = 'Iniciar Sesión';
                btn.disabled = false;
            }
        })
        .catch(err => {
            console.error('Error:', err);
            mostrarAlerta('Error de conexión con el servidor', 'error');
            btn.textContent = 'Iniciar Sesión';
            btn.disabled = false;
        });
    });
});

// =====================================================
// MODAL "OLVIDÓ CONTRASEÑA"
// =====================================================
function openForgotModal() {
    document.getElementById('forgotModal').classList.add('active');
}

function closeForgotModal() {
    document.getElementById('forgotModal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('forgotModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeForgotModal();
            }
        });
    }
});

// =====================================================
// ALERTAS
// =====================================================
function mostrarAlerta(mensaje, tipo) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    
    const color = tipo === 'success' ? '#d4edda' : '#f8d7da';
    const textColor = tipo === 'success' ? '#155724' : '#721c24';
    const borderColor = tipo === 'success' ? '#c3e6cb' : '#f5c6cb';
    
    container.innerHTML = `
        <div style="background: ${color}; color: ${textColor}; padding: 12px; border-radius: 5px; margin-bottom: 15px; border: 1px solid ${borderColor};">
            ${mensaje}
        </div>
    `;
    
    // Limpiar después de 5 segundos
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}