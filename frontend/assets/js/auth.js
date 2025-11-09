// frontend/assets/js/auth.js - VERSIÓN FINAL CORREGIDA
// ARCHIVO COMPLETO CORREGIDO PARA EL LOGIN

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Clase para manejar servicios de autenticación
class AuthService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Realizar login - FUNCIÓN CORREGIDA
    async login(credentials) {
        console.log('🔄 Intentando login con:', { username: credentials.username });
        
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Para cookies
                body: JSON.stringify(credentials)
            });

            console.log('📡 Respuesta del servidor - Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.log('❌ Error del servidor:', errorData);
                throw new Error(errorData.message || 'Error en el login');
            }

            const data = await response.json();
            console.log('✅ Respuesta exitosa del login:', data);
            
            return data;
        } catch (error) {
            console.error('❌ Error en AuthService.login:', error);
            throw error;
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            console.log('🔄 Cerrando sesión...');
            
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
            console.log('✅ Sesión cerrada');

            return true;
        } catch (error) {
            console.error('❌ Error en logout:', error);
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
}

// Instancia global del servicio
const authService = new AuthService();

// Clase para manejar la autenticación - CORREGIDA
class AuthManager {
    constructor() {
        this.initializeLoginForm();
        this.checkAuthenticationState();
    }

    // Inicializar formulario de login
    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('📋 Inicializando formulario de login...');
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    // Manejar envío del formulario de login - COMPLETAMENTE CORREGIDO
    async handleLogin(event) {
        event.preventDefault();
        console.log('🔄 Procesando envío de formulario...');

        const form = event.target;
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username')?.trim(),
            password: formData.get('password')
        };

        console.log('📝 Credenciales extraídas:', { username: credentials.username });

        // Validar campos
        if (!credentials.username || !credentials.password) {
            console.log('❌ Validación falló: campos vacíos');
            utils.showAlert('Por favor, completa todos los campos', 'error');
            return;
        }

        // Cambiar estado del botón
        this.setLoginButtonState(true);

        try {
            console.log('🔄 Enviando petición de login...');
            const response = await authService.login(credentials);

            if (response.success) {
                console.log('✅ Login exitoso!');
                utils.showAlert('¡Inicio de sesión exitoso!', 'success');
                
                // Verificar estructura de la respuesta
                const userData = response.data?.user;
                const token = response.data?.token;
                
                if (!userData || !token) {
                    console.log('❌ Respuesta incompleta:', response.data);
                    throw new Error('Respuesta incompleta del servidor');
                }
                
                // Guardar sesión
                this.saveUserSession(response.data);

                // Redirección después de breve delay
                setTimeout(() => {
                    console.log('🔄 Redirigiendo al dashboard...');
                    // Usar ruta relativa desde login.html
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                throw new Error(response.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ Error completo en login:', error);
            
            let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
            
            if (error.message.includes('Credenciales inválidas')) {
                errorMessage = 'Usuario o contraseña incorrectos';
            } else if (error.message.includes('Cuenta desactivada')) {
                errorMessage = 'Tu cuenta está desactivada. Contacta al administrador.';
            } else if (error.message.includes('Cuenta bloqueada')) {
                errorMessage = 'Tu cuenta está bloqueada por múltiples intentos fallidos.';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté funcionando.';
            }
            
            utils.showAlert(errorMessage, 'error');
        } finally {
            this.setLoginButtonState(false);
        }
    }

    // Guardar sesión del usuario
    saveUserSession(data) {
        try {
            console.log('💾 Guardando sesión:', data);
            
            // Guardar token
            if (data.token) {
                localStorage.setItem('access_token', data.token);
                console.log('✅ Token guardado');
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
            console.log('✅ Datos de usuario guardados:', normalizedUser);

            // Calcular expiración (24 horas)
            const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('session_expires', expirationTime.toString());

        } catch (error) {
            console.error('❌ Error al guardar sesión:', error);
        }
    }

    // Cambiar estado del botón de login
    setLoginButtonState(loading) {
        const button = document.querySelector('#loginForm button[type="submit"]');
        
        if (button) {
            button.disabled = loading;
            
            if (loading) {
                button.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                `;
            } else {
                button.innerHTML = 'Iniciar Sesión';
            }
        }
    }

    // Verificar estado de autenticación
    checkAuthenticationState() {
        console.log('🔍 Verificando estado de autenticación...');
        
        if (authService.isAuthenticated()) {
            const currentPath = window.location.pathname;
            console.log('✅ Usuario ya autenticado. Ruta actual:', currentPath);
            
            // Si está en login y ya autenticado, redirigir al dashboard
            if (currentPath.includes('login.html')) {
                console.log('🔄 Redirigiendo desde login al dashboard...');
                window.location.href = 'dashboard.html';
            }
        } else {
            const currentPath = window.location.pathname;
            console.log('❌ Usuario no autenticado. Ruta actual:', currentPath);
            
            // Si no está en login y no autenticado, redirigir al login
            if (!currentPath.includes('login.html') && !currentPath.includes('index.html')) {
                console.log('🔄 Redirigiendo a login...');
                window.location.href = 'login.html';
            }
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            console.log('🔄 Cerrando sesión...');
            await authService.logout();
            
            utils.showAlert('Sesión cerrada exitosamente', 'success');
            
            // Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Forzar limpieza local y redirección
            authService.clearSession();
            window.location.href = 'login.html';
        }
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado, inicializando AuthManager...');
    
    // Crear instancia del manejador de autenticación
    window.authManager = new AuthManager();
});

// Exportar para uso global
window.authService = authService;
window.AuthManager = AuthManager;