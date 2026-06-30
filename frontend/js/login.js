/**
 * SIGAE - LÓGICA DE LOGIN
 * Archivo: frontend/js/login.js
 * 
 * Funciones específicas para la página de login:
 * - Envío de credenciales al servidor
 * - Validación en tiempo real
 * - Toggle de contraseña
 * - Indicador de fuerza de contraseña
 * - Modal de "olvidó contraseña"
 * - Manejo de errores y alertas
 */

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // ELEMENTOS DEL DOM
    // =============================================
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordIcon = document.getElementById('passwordIcon');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const emailValidation = document.getElementById('emailValidation');
    const passwordValidation = document.getElementById('passwordValidation');
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const currentYear = document.getElementById('currentYear');
    
    // =============================================
    // FUNCIONES DE VALIDACIÓN
    // =============================================
    
    // Validar email
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Validar contraseña (mínimo 6 caracteres)
    function validatePassword(password) {
        return password.length >= 6;
    }

    // Obtener fuerza de la contraseña
    function getPasswordStrength(password) {
        if (password.length === 0) return { level: 'none', label: '' };
        if (password.length >= 8) return { level: 'strong', label: 'Fuerte' };
        if (password.length >= 6) return { level: 'medium', label: 'Media' };
        return { level: 'weak', label: 'Débil' };
    }

    // =============================================
    // VALIDACIÓN EN TIEMPO REAL
    // =============================================
    
    function validateEmailField() {
        const email = emailInput.value.trim();
        const isValid = validateEmail(email);
        
        // Remover clases previas
        emailInput.classList.remove('success', 'error');
        if (emailValidation) emailValidation.innerHTML = '';
        
        if (email.length === 0) {
            if (emailError) emailError.textContent = '';
            return false;
        }
        
        if (isValid) {
            emailInput.classList.add('success');
            if (emailValidation) emailValidation.innerHTML = '<i class="fas fa-check-circle"></i>';
            if (emailError) emailError.textContent = '';
            return true;
        } else {
            emailInput.classList.add('error');
            if (emailValidation) emailValidation.innerHTML = '<i class="fas fa-times-circle"></i>';
            if (emailError) emailError.textContent = 'Ingresa un correo válido';
            return false;
        }
    }

    function validatePasswordField() {
        const password = passwordInput.value;
        const isValid = validatePassword(password);
        
        // Remover clases previas
        passwordInput.classList.remove('success', 'error');
        if (passwordValidation) passwordValidation.innerHTML = '';
        
        if (password.length === 0) {
            if (passwordError) passwordError.textContent = '';
            if (passwordStrength) passwordStrength.classList.remove('visible');
            return false;
        }
        
        if (isValid) {
            passwordInput.classList.add('success');
            if (passwordValidation) passwordValidation.innerHTML = '<i class="fas fa-check-circle"></i>';
            if (passwordError) passwordError.textContent = '';
            
            // Mostrar fuerza de contraseña
            if (passwordStrength) {
                const strength = getPasswordStrength(password);
                passwordStrength.classList.add('visible');
                if (strengthFill) {
                    strengthFill.className = 'strength-fill ' + strength.level;
                }
                if (strengthText) {
                    strengthText.className = 'strength-text ' + strength.level;
                    strengthText.textContent = strength.label;
                }
            }
            return true;
        } else {
            passwordInput.classList.add('error');
            if (passwordValidation) passwordValidation.innerHTML = '<i class="fas fa-times-circle"></i>';
            if (passwordError) passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            if (passwordStrength) passwordStrength.classList.remove('visible');
            return false;
        }
    }

    // Event listeners para validación en tiempo real
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailField);
        emailInput.addEventListener('blur', validateEmailField);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordField);
        passwordInput.addEventListener('blur', validatePasswordField);
    }

    // =============================================
    // TOGGLE DE CONTRASEÑA
    // =============================================
    if (togglePassword && passwordInput && passwordIcon) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            passwordIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            this.setAttribute('aria-label', type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
        });
    }

    // =============================================
    // MANEJO DEL LOGIN (MANTENIENDO TU LÓGICA)
    // =============================================
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validar campos en tiempo real
        const isEmailValid = validateEmailField();
        const isPasswordValid = validatePasswordField();
        
        if (!isEmailValid || !isPasswordValid) {
            mostrarAlerta('Por favor llena todos los campos correctamente', 'error');
            return;
        }
        
        // Validar dominio (tu lógica original)
        if (!email.endsWith('@utvtol.edu.mx')) {
            mostrarAlerta('Solo se aceptan correos @utvtol.edu.mx', 'error');
            // Marcar campo como error
            emailInput.classList.add('error');
            if (emailValidation) emailValidation.innerHTML = '<i class="fas fa-times-circle"></i>';
            if (emailError) emailError.textContent = 'Solo correos @utvtol.edu.mx';
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        
        // Enviar petición al servidor (tu lógica original)
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
                mostrarAlerta(' Inicio de sesión exitoso', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            } else {
                mostrarAlerta(data.error || 'Credenciales inválidas', 'error');
                // Marcar campos como error
                emailInput.classList.add('error');
                passwordInput.classList.add('error');
                if (emailValidation) emailValidation.innerHTML = '<i class="fas fa-times-circle"></i>';
                if (passwordValidation) passwordValidation.innerHTML = '<i class="fas fa-times-circle"></i>';
            }
        })
        .catch(err => {
            console.error('Error:', err);
            mostrarAlerta('Error de conexión con el servidor', 'error');
        })
        .finally(() => {
            // Restaurar botón
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
        });
    });

    // =============================================
    // AÑO ACTUAL PARA COPYRIGHT
    // =============================================
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // =============================================
    // VALIDAR CAMPOS AL CARGAR (si tienen valor)
    // =============================================
    if (emailInput && emailInput.value.trim()) {
        validateEmailField();
    }
    if (passwordInput && passwordInput.value) {
        validatePasswordField();
    }

    console.log(' SIGAE - Login inicializado');
});

// =====================================================
// MODAL "OLVIDÓ CONTRASEÑA" (TU LÓGICA ORIGINAL)
// =====================================================
function openForgotModal() {
    const modal = document.getElementById('forgotModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotModal() {
    const modal = document.getElementById('forgotModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cerrar modal al hacer clic fuera (tu lógica original mejorada)
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('forgotModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeForgotModal();
            }
        });
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeForgotModal();
        }
    });
});

// =====================================================
// ALERTAS (TU LÓGICA ORIGINAL MEJORADA)
// =====================================================
function mostrarAlerta(mensaje, tipo) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const color = tipo === 'success' ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)';
    const textColor = tipo === 'success' ? '#155724' : '#721c24';
    const borderColor = tipo === 'success' ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)';
    
    container.innerHTML = `
        <div class="alert alert-${tipo} shake" style="background: ${color}; color: ${textColor}; border-color: ${borderColor};">
            <i class="fas ${icon}"></i>
            <span>${mensaje}</span>
        </div>
    `;
    
    // Remover clase shake después de la animación
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) alert.classList.remove('shake');
    }, 400);
    
    // Limpiar después de 5 segundos
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}