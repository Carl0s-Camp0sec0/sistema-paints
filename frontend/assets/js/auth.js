// frontend/assets/js/auth.js
// ARCHIVO COMPLETO CORREGIDO

// Clase para manejar la autenticación
class AuthManager {
    constructor() {
        this.initializeLoginForm();
        this.checkRedirectAfterLogin();
        this.setupAutoLogout();
    }

    // Inicializar formulario de login
    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    // Manejar envío del formulario de login - FUNCIÓN CORREGIDA
    async handleLogin(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username').trim(),
            password: formData.get('password')
        };

        // Validar campos
        if (!credentials.username || !credentials.password) {
            utils.showAlert('Por favor, completa todos los campos', 'error');
            return;
        }

        // Cambiar estado del botón
        this.setLoginButtonState(true);

        try {
            const response = await authService.login(credentials);
            console.log('🔍 Respuesta completa del login:', response);

            if (response.success) {
                utils.showAlert('¡Inicio de sesión exitoso!', 'success');
                
                // CORRECCIÓN: Acceder correctamente a los datos anidados
                const userData = response.data.user;
                const token = response.data.token;
                
                // Verificar que tenemos los datos necesarios
                if (!userData || !token) {
                    throw new Error('Respuesta incompleta del servidor');
                }
                
                // Guardar sesión con datos normalizados
                this.saveUserSession(response.data);

                // CORRECCIÓN: Redirección con ruta relativa
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('login.html')) {
                        // Si estamos en login.html, ir a dashboard.html (mismo nivel)
                        window.location.href = 'dashboard.html';
                    } else {
                        // Si estamos en otra ubicación, usar ruta absoluta
                        window.location.href = '/pages/dashboard.html';
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.message.includes('Credenciales inválidas')) {
                errorMessage = 'Usuario o contraseña incorrectos';
            } else if (error.message.includes('Cuenta desactivada')) {
                errorMessage = 'Tu cuenta está desactivada. Contacta al administrador';
            } else if (error.message.includes('Cuenta bloqueada')) {
                errorMessage = 'Cuenta bloqueada por múltiples intentos fallidos';
            } else if (error.message.includes('Sin conexión')) {
                errorMessage = 'Sin conexión al servidor. Verifica tu conexión';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'No se puede conectar con el servidor. Verifica que esté ejecutándose';
            }
            
            utils.showAlert(errorMessage, 'error');
        } finally {
            this.setLoginButtonState(false);
        }
    }

    // NUEVA FUNCIÓN: Guardar sesión de usuario con normalización de datos
    saveUserSession(responseData) {
        try {
            const userData = responseData.user;
            const token = responseData.token;
            
            if (!userData || !token) {
                throw new Error('Datos de sesión incompletos');
            }
            
            // Guardar token
            localStorage.setItem('auth_token', token);
            
            // CORRECCIÓN: Normalizar campos para compatibilidad frontend/backend
            const normalizedUser = {
                id_usuario: userData.id_usuario || userData.id,
                username: userData.username,
                perfil: userData.perfil_usuario || userData.perfil, // Backend usa perfil_usuario, frontend espera perfil
                perfil_usuario: userData.perfil_usuario || userData.perfil, // Mantener ambos para compatibilidad
                nombre_completo: userData.nombre_completo || userData.username,
                sucursal: userData.sucursal || 'Sin asignar',
                id_empleado: userData.id_empleado,
                ultimo_acceso: userData.ultimo_acceso || new Date().toISOString()
            };
            
            // Guardar datos del usuario normalizados
            localStorage.setItem('user_data', JSON.stringify(normalizedUser));
            
            console.log('✅ Sesión guardada correctamente:', normalizedUser);
            
            // Configurar auto-logout por inactividad
            this.setupAutoLogout();
            
            return true;
        } catch (error) {
            console.error('❌ Error guardando sesión:', error);
            return false;
        }
    }

    // Cambiar estado del botón de login
    setLoginButtonState(loading) {
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const spinner = document.getElementById('loginSpinner');
        const btnText = document.getElementById('loginBtnText');

        if (submitBtn) {
            submitBtn.disabled = loading;
            
            if (spinner) {
                spinner.style.display = loading ? 'inline-block' : 'none';
            }
            
            if (btnText) {
                btnText.textContent = loading ? 'Iniciando sesión...' : 'Iniciar Sesión';
            }
        }
    }

    // FUNCIÓN MEJORADA: Verificar si está logueado
    isLoggedIn() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (!token || !userData) {
            return false;
        }
        
        try {
            // Verificar que los datos del usuario sean válidos
            const user = JSON.parse(userData);
            return !!(user.username && (user.perfil || user.perfil_usuario));
        } catch (error) {
            console.error('Error verificando login:', error);
            this.logout(); // Limpiar datos corruptos
            return false;
        }
    }

    // FUNCIÓN MEJORADA: Obtener usuario actual
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('user_data');
            if (!userData) return null;
            
            const user = JSON.parse(userData);
            
            // Verificar que el usuario tenga los campos mínimos requeridos
            if (!user.username || (!user.perfil && !user.perfil_usuario)) {
                console.warn('Datos de usuario incompletos:', user);
                this.logout();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            this.logout(); // Limpiar datos corruptos
            return null;
        }
    }

    // Logout
    logout() {
        // Limpiar almacenamiento local
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Cancelar timers de auto-logout
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
        }
        
        console.log('🚪 Sesión cerrada');
        
        // Redirigir al login
        window.location.href = 'login.html';
    }

    // FUNCIÓN CORREGIDA: Verificar redirección después del login
    checkRedirectAfterLogin() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        
        if (this.isLoggedIn() && isLoginPage) {
            console.log('Usuario ya logueado, redirigiendo al dashboard');
            // Usar ruta relativa desde login.html a dashboard.html
            window.location.href = 'dashboard.html';
        }
    }

    // Configurar auto-logout por inactividad
    setupAutoLogout() {
        const sessionTimeout = 30 * 60 * 1000; // 30 minutos
        const warningTime = 5 * 60 * 1000; // 5 minutos antes del logout
        
        const logoutTime = sessionTimeout - warningTime;

        // Limpiar timers existentes
        if (this.logoutTimer) clearTimeout(this.logoutTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);

        // Timer para mostrar advertencia
        this.warningTimer = setTimeout(() => {
            utils.showAlert('Tu sesión expirará en 5 minutos por inactividad', 'warning');
        }, logoutTime);

        // Timer para logout automático
        this.logoutTimer = setTimeout(() => {
            utils.showAlert('Tu sesión ha expirado por inactividad', 'warning');
            setTimeout(() => this.logout(), 3000);
        }, sessionTimeout);
    }

    // Actualizar perfil del usuario
    async updateProfile() {
        try {
            const response = await authService.getProfile();
            if (response.success) {
                // Normalizar datos de perfil
                const normalizedUser = {
                    id_usuario: response.data.id_usuario || response.data.id,
                    username: response.data.username,
                    perfil: response.data.perfil_usuario || response.data.perfil,
                    perfil_usuario: response.data.perfil_usuario || response.data.perfil,
                    nombre_completo: response.data.nombre_completo || response.data.username,
                    sucursal: response.data.sucursal || 'Sin asignar',
                    id_empleado: response.data.id_empleado,
                    ultimo_acceso: response.data.ultimo_acceso
                };
                
                localStorage.setItem('user_data', JSON.stringify(normalizedUser));
                return normalizedUser;
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    }

    // Cambiar contraseña
    async changePassword(passwordData) {
        try {
            const response = await authService.changePassword(passwordData);
            return response;
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            throw error;
        }
    }
}

// Clase para manejar la interfaz de usuario autenticada
class AuthUI {
    constructor(authManager) {
        this.authManager = authManager;
        this.initializeUserInterface();
    }

    // Inicializar interfaz de usuario
    initializeUserInterface() {
        this.updateUserInfo();
        this.setupLogoutButtons();
        this.setupProfileDropdown();
        this.checkPagePermissions();
    }

    // Actualizar información del usuario en la interfaz
    updateUserInfo() {
        const user = this.authManager.getCurrentUser();
        if (!user) return;

        // Actualizar elementos de la interfaz con información del usuario
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userProfileElements = document.querySelectorAll('[data-user-profile]');
        const userSucursalElements = document.querySelectorAll('[data-user-sucursal]');

        userNameElements.forEach(el => {
            el.textContent = user.nombre_completo || user.username;
        });

        userProfileElements.forEach(el => {
            el.textContent = user.perfil || user.perfil_usuario;
        });

        userSucursalElements.forEach(el => {
            el.textContent = user.sucursal || 'Sin asignar';
        });
    }

    // Configurar botones de logout
    setupLogoutButtons() {
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmLogout();
            });
        });
    }

    // Confirmar logout
    confirmLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            this.authManager.logout();
        }
    }

    // Configurar dropdown de perfil
    setupProfileDropdown() {
        const profileDropdownBtn = document.getElementById('profileDropdownBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileDropdownBtn && profileDropdown) {
            profileDropdownBtn.addEventListener('click', () => {
                profileDropdown.classList.toggle('hidden');
            });

            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!profileDropdownBtn.contains(e.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }
    }

    // Verificar permisos de página
    checkPagePermissions() {
        const user = this.authManager.getCurrentUser();
        if (!user) return;

        // Ocultar elementos que el usuario no puede usar
        const restrictedElements = document.querySelectorAll('[data-require-profile]');
        restrictedElements.forEach(element => {
            const requiredProfiles = element.dataset.requireProfile.split(',');
            const userProfile = user.perfil || user.perfil_usuario;
            if (!requiredProfiles.includes(userProfile)) {
                element.classList.add('hidden');
            }
        });

        // Mostrar elementos específicos del perfil
        const profileElements = document.querySelectorAll(`[data-show-profile]`);
        profileElements.forEach(element => {
            const showProfiles = element.dataset.showProfile.split(',');
            const userProfile = user.perfil || user.perfil_usuario;
            if (showProfiles.includes(userProfile)) {
                element.classList.remove('hidden');
            }
        });
    }

    // Mostrar modal de cambio de contraseña
    showChangePasswordModal() {
        // Crear modal dinámicamente
        const modalHTML = `
            <div id="changePasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <h3 class="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
                    <form id="changePasswordForm">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                                <input type="password" name="currentPassword" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                <input type="password" name="newPassword" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                <input type="password" name="confirmPassword" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" onclick="document.getElementById('changePasswordModal').remove()" 
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                            <button type="submit" 
                                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Cambiar Contraseña
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar formulario de cambio de contraseña
        const form = document.getElementById('changePasswordForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const passwordData = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
                confirmPassword: formData.get('confirmPassword')
            };

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                utils.showAlert('Las nuevas contraseñas no coinciden', 'error');
                return;
            }

            try {
                await this.authManager.changePassword(passwordData);
                utils.showAlert('Contraseña cambiada exitosamente', 'success');
                document.getElementById('changePasswordModal').remove();
            } catch (error) {
                utils.showAlert(error.message, 'error');
            }
        });
    }
}

// Inicializar autenticación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando sistema de autenticación...');
    
    window.authManager = new AuthManager();
    
    // Solo inicializar AuthUI en páginas que lo requieran (no en login)
    if (window.authManager.isLoggedIn() && !window.location.pathname.includes('login.html')) {
        window.authUI = new AuthUI(window.authManager);
        console.log('✅ AuthUI inicializado');
    }
});

// Funciones globales para usar en HTML
window.logout = function() {
    if (window.authManager) {
        window.authManager.logout();
    }
};

window.showChangePasswordModal = function() {
    if (window.authUI) {
        window.authUI.showChangePasswordModal();
    }
};