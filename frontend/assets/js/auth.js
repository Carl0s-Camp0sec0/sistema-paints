// frontend/assets/js/auth.js

// Clase para manejar la autenticación
class AuthManager {
    constructor() {
        this.initializeLoginForm();
        this.checkRedirectAfterLogin();
    }

    // Inicializar formulario de login
    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    // Manejar envío del formulario de login
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

            if (response.success) {
                utils.showAlert('¡Inicio de sesión exitoso!', 'success');
                
                // Guardar información adicional del usuario
                this.saveUserSession(response.data);

                // Redireccionar después de un breve delay
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/pages/dashboard.html';
                    window.location.href = redirectUrl;
                }, 1000);
            }
        } catch (error) {
            console.error('Error en login:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.message.includes('Credenciales inválidas')) {
                errorMessage = 'Usuario o contraseña incorrectos';
            } else if (error.message.includes('Cuenta desactivada')) {
                errorMessage = 'Tu cuenta está desactivada. Contacta al administrador';
            } else if (error.message.includes('Cuenta bloqueada')) {
                errorMessage = 'Cuenta bloqueada por múltiples intentos fallidos';
            } else if (error.message.includes('Sin conexión')) {
                errorMessage = 'Sin conexión al servidor. Verifica tu conexión a internet';
            }

            utils.showAlert(errorMessage, 'error');
        } finally {
            this.setLoginButtonState(false);
        }
    }

    // Cambiar estado visual del botón de login
    setLoginButtonState(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginSpinner = document.getElementById('loginSpinner');

        if (loading) {
            loginBtn.disabled = true;
            loginBtnText.classList.add('hidden');
            loginSpinner.classList.remove('hidden');
        } else {
            loginBtn.disabled = false;
            loginBtnText.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    }

    // Guardar sesión del usuario
    saveUserSession(userData) {
        localStorage.setItem('user_data', JSON.stringify(userData.user));
        localStorage.setItem('login_time', new Date().toISOString());
        
        // Configurar auto-logout después de 24 horas
        this.setupAutoLogout();
    }

    // Obtener datos del usuario logueado
    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    // Verificar si el usuario está logueado
    isLoggedIn() {
        return !!api.getToken() && !!this.getCurrentUser();
    }

    // Verificar si el usuario tiene un perfil específico
    hasProfile(profileName) {
        const user = this.getCurrentUser();
        return user && user.perfil === profileName;
    }

    // Verificar si el usuario puede realizar una acción
    canPerformAction(action) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const permissions = {
            'create': ['Gerente', 'Digitador'],
            'read': ['Gerente', 'Digitador', 'Cajero'],
            'update': ['Gerente', 'Digitador'],
            'delete': ['Gerente'],
            'reports': ['Gerente'],
            'invoice': ['Gerente', 'Digitador', 'Cajero']
        };

        return permissions[action]?.includes(user.perfil) || false;
    }

    // Cerrar sesión
    async logout() {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            this.clearUserSession();
            window.location.href = '/pages/login.html';
        }
    }

    // Limpiar sesión del usuario
    clearUserSession() {
        localStorage.removeItem('user_data');
        localStorage.removeItem('login_time');
        localStorage.removeItem('auth_token');
    }

    // Configurar auto-logout
    setupAutoLogout() {
        const logoutTime = 24 * 60 * 60 * 1000; // 24 horas
        
        setTimeout(() => {
            utils.showAlert('Tu sesión ha expirado por inactividad', 'warning');
            setTimeout(() => this.logout(), 3000);
        }, logoutTime);
    }

    // Verificar redirección después del login
    checkRedirectAfterLogin() {
        // Si ya está logueado y está en la página de login, redirigir al dashboard
        if (this.isLoggedIn() && window.location.pathname.includes('login.html')) {
            window.location.href = '/pages/dashboard.html';
        }
    }

    // Actualizar perfil del usuario
    async updateProfile() {
        try {
            const response = await authService.getProfile();
            if (response.success) {
                localStorage.setItem('user_data', JSON.stringify(response.data));
                return response.data;
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
            el.textContent = user.perfil;
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
            if (!requiredProfiles.includes(user.perfil)) {
                element.classList.add('hidden');
            }
        });

        // Mostrar elementos específicos del perfil
        const profileElements = document.querySelectorAll(`[data-show-profile]`);
        profileElements.forEach(element => {
            const showProfiles = element.dataset.showProfile.split(',');
            if (showProfiles.includes(user.perfil)) {
                element.classList.remove('hidden');
            }
        });
    }

    // Mostrar modal de cambio de contraseña
    showChangePasswordModal() {
        // Crear modal dinámicamente
        const modalHTML = `
            <div id="changePasswordModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">Cambiar Contraseña</h3>
                        <form id="changePasswordForm">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                                <input type="password" name="currentPassword" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-paint-blue">
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                                <input type="password" name="confirmPassword" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-paint-blue">
                            </div>
                            <div class="flex justify-end space-x-3">
                                <button type="button" onclick="this.closest('#changePasswordModal').remove()" 
                                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                        class="px-4 py-2 bg-paint-blue text-white rounded-md hover:bg-blue-700">
                                    Cambiar
                                </button>
                            </div>
                        </form>
                    </div>
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
    window.authManager = new AuthManager();
    
    // Solo inicializar AuthUI en páginas que lo requieran
    if (window.authManager.isLoggedIn() && !window.location.pathname.includes('login.html')) {
        window.authUI = new AuthUI(window.authManager);
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