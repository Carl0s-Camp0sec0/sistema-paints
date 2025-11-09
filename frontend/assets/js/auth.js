// frontend/assets/js/auth.js - VERSIÓN CORREGIDA COMPLETA
// ARCHIVO COMPLETO CORREGIDO

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Clase para manejar servicios de autenticación
class AuthService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Realizar login
    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Importante para cookies
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en el login');
        }

        return await response.json();
    }

    // Cerrar sesión
    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                credentials: 'include'
            });

            // Limpiar storage independientemente de la respuesta
            this.clearSession();

            return response.ok;
        } catch (error) {
            console.error('Error en logout:', error);
            this.clearSession(); // Limpiar de todos modos
            return false;
        }
    }

    // Obtener token del localStorage
    getToken() {
        return localStorage.getItem('access_token');
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        const token = this.getToken();
        const userData = localStorage.getItem('user_data');
        return !!(token && userData);
    }

    // Obtener datos del usuario
    getUserData() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    // Limpiar sesión
    clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_expires');
    }

    // Obtener perfil actualizado
    async getProfile() {
        const response = await fetch(`${this.baseURL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al obtener perfil');
        }

        return await response.json();
    }

    // Cambiar contraseña
    async changePassword(passwordData) {
        const response = await fetch(`${this.baseURL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(passwordData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cambiar contraseña');
        }

        return await response.json();
    }
}

// Instancia global del servicio
const authService = new AuthService();

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
                errorMessage = 'Tu cuenta está desactivada. Contacta al administrador.';
            } else if (error.message.includes('Cuenta bloqueada')) {
                errorMessage = 'Tu cuenta está bloqueada por múltiples intentos fallidos.';
            }
            
            utils.showAlert(errorMessage, 'error');
        } finally {
            this.setLoginButtonState(false);
        }
    }

    // Guardar sesión del usuario - FUNCIÓN CORREGIDA
    saveUserSession(data) {
        try {
            // Guardar token
            if (data.token) {
                localStorage.setItem('access_token', data.token);
            }

            // Normalizar y guardar datos de usuario
            const normalizedUser = {
                id_usuario: data.user.id_usuario || data.user.id,
                username: data.user.username,
                perfil: data.user.perfil_usuario || data.user.perfil,
                perfil_usuario: data.user.perfil_usuario || data.user.perfil,
                nombre_completo: data.user.nombre_completo || data.user.username,
                email: data.user.email,
                sucursal: data.user.sucursal || 'Sin asignar',
                id_empleado: data.user.id_empleado,
                ultimo_acceso: data.user.ultimo_acceso
            };

            localStorage.setItem('user_data', JSON.stringify(normalizedUser));

            // Calcular expiración (24 horas por defecto)
            const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('session_expires', expirationTime.toString());

            console.log('✅ Sesión guardada:', normalizedUser);
        } catch (error) {
            console.error('❌ Error al guardar sesión:', error);
        }
    }

    // Cambiar estado del botón de login
    setLoginButtonState(loading) {
        const button = document.querySelector('#loginForm button[type="submit"]');
        const buttonText = button?.querySelector('.button-text');
        const buttonSpinner = button?.querySelector('.button-spinner');

        if (button) {
            button.disabled = loading;
            
            if (buttonText) {
                buttonText.textContent = loading ? 'Iniciando sesión...' : 'Iniciar Sesión';
            }
            
            if (buttonSpinner) {
                if (loading) {
                    buttonSpinner.classList.remove('hidden');
                } else {
                    buttonSpinner.classList.add('hidden');
                }
            }
        }
    }

    // Verificar redirección después del login
    checkRedirectAfterLogin() {
        // Si estamos en una página que requiere auth y ya estamos logueados
        if (authService.isAuthenticated()) {
            const currentPath = window.location.pathname;
            
            // Si estamos en login.html, redirigir al dashboard
            if (currentPath.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Si no estamos autenticados y no estamos en login
            const currentPath = window.location.pathname;
            
            if (!currentPath.includes('login.html') && !currentPath.includes('index.html')) {
                // Redirigir al login
                window.location.href = '../pages/login.html';
            }
        }
    }

    // Configurar auto-logout por expiración
    setupAutoLogout() {
        setInterval(() => {
            const expirationTime = localStorage.getItem('session_expires');
            
            if (expirationTime && new Date().getTime() > parseInt(expirationTime)) {
                console.log('🕐 Sesión expirada, cerrando automáticamente');
                this.logout();
            }
        }, 60000); // Verificar cada minuto
    }

    // Cerrar sesión
    async logout() {
        try {
            await authService.logout();
            
            utils.showAlert('Sesión cerrada exitosamente', 'success');
            
            // Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = '../pages/login.html';
            }, 1000);
        } catch (error) {
            console.error('Error en logout:', error);
            // Forzar limpieza local y redirección
            authService.clearSession();
            window.location.href = '../pages/login.html';
        }
    }

    // Actualizar perfil de usuario
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

    initializeUserInterface() {
        this.updateUserDisplay();
        this.setupLogoutHandlers();
        this.setupProfileHandlers();
    }

    // Actualizar visualización del usuario
    updateUserDisplay() {
        const userData = authService.getUserData();
        
        if (userData) {
            // Actualizar elementos que muestran información del usuario
            const userNameElements = document.querySelectorAll('[data-user-name]');
            const userRoleElements = document.querySelectorAll('[data-user-role]');
            const userEmailElements = document.querySelectorAll('[data-user-email]');

            userNameElements.forEach(el => {
                el.textContent = userData.nombre_completo || userData.username;
            });

            userRoleElements.forEach(el => {
                el.textContent = userData.perfil_usuario || userData.perfil;
            });

            userEmailElements.forEach(el => {
                el.textContent = userData.email || 'No especificado';
            });
        }
    }

    // Configurar handlers de logout
    setupLogoutHandlers() {
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        
        logoutButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    await this.authManager.logout();
                }
            });
        });
    }

    // Configurar handlers de perfil
    setupProfileHandlers() {
        const profileButtons = document.querySelectorAll('[data-action="profile"]');
        
        profileButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                // Aquí puedes agregar lógica para mostrar modal de perfil
                console.log('Abrir modal de perfil');
            });
        });
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia del manejador de autenticación
    window.authManager = new AuthManager();
    
    // Si estamos autenticados, inicializar UI
    if (authService.isAuthenticated()) {
        window.authUI = new AuthUI(window.authManager);
    }
});

// Exportar para uso global
window.authService = authService;
window.AuthManager = AuthManager;