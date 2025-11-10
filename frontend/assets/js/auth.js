// frontend/assets/js/auth.js - VERSIÓN INDEPENDIENTE Y FUNCIONAL
console.log('🚀 Iniciando auth.js independiente...');

// ====================================================================
// CONFIGURACIÓN
// ====================================================================
const API_BASE_URL = 'http://localhost:3000/api';

// ====================================================================
// UTILIDADES INDEPENDIENTES
// ====================================================================
class SimpleAlerts {
    static show(message, type = 'info', duration = 5000) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Remover alerta anterior
        const existingAlert = document.getElementById('simpleAlert');
        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.id = 'simpleAlert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            padding: 16px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;

        const colors = {
            success: 'background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724;',
            error: 'background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;',
            warning: 'background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404;',
            info: 'background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460;'
        };

        alertDiv.style.cssText += colors[type] || colors.info;
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="flex: 1;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-left: 12px; background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; color: inherit;">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Animación de entrada
        setTimeout(() => {
            alertDiv.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remove
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alertDiv.parentNode) alertDiv.remove();
                }, 300);
            }
        }, duration);
    }
}

// ====================================================================
// SERVICIO DE AUTENTICACIÓN
// ====================================================================
class AuthService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async login(credentials) {
        console.log('🔄 AuthService.login iniciando...');
        console.log('📧 Username:', credentials.username);

        try {
            const requestBody = JSON.stringify(credentials);
            console.log('📦 Request body:', requestBody);

            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: requestBody
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            const data = await response.json();
            console.log('📄 Response data:', data);

            if (response.ok && data.success) {
                console.log('✅ Login exitoso en AuthService');
                return data;
            } else {
                console.log('❌ Login fallido en AuthService');
                throw new Error(data.message || data.error || 'Login fallido');
            }
        } catch (error) {
            console.error('❌ Error en AuthService.login:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearSession();
        }
    }

    getToken() {
        return localStorage.getItem('access_token');
    }

    isAuthenticated() {
        const token = this.getToken();
        const userData = localStorage.getItem('user_data');
        return !!(token && userData);
    }

    getUserData() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_expires');
        console.log('🗑️ Sesión limpiada');
    }
}

// ====================================================================
// MANAGER DE AUTENTICACIÓN
// ====================================================================
class AuthManager {
    constructor() {
        console.log('🚀 Inicializando AuthManager...');
        this.authService = new AuthService();
        this.init();
    }

    init() {
        this.setupLoginForm();
        this.checkAuthenticationState();
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('📋 Formulario encontrado, configurando event listener...');
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        } else {
            console.log('⚠️ Formulario loginForm no encontrado');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        console.log('🎯 handleLogin ejecutándose...');

        const form = event.target;
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username')?.trim(),
            password: formData.get('password')
        };

        console.log('📝 Credenciales extraídas:');
        console.log('- Username:', credentials.username);
        console.log('- Password:', credentials.password ? '[PRESENTE]' : '[AUSENTE]');

        // Validaciones
        if (!credentials.username) {
            SimpleAlerts.show('El usuario es requerido', 'error');
            return;
        }

        if (!credentials.password) {
            SimpleAlerts.show('La contraseña es requerida', 'error');
            return;
        }

        // Mostrar estado de carga
        this.setLoadingState(true);
        SimpleAlerts.show('Iniciando sesión...', 'info', 2000);

        try {
            console.log('🚀 Enviando petición de login...');
            const response = await this.authService.login(credentials);
            console.log('✅ Respuesta recibida:', response);

            if (response.success && response.data) {
                console.log('🎉 Login exitoso confirmado');
                
                const { user, token } = response.data;
                console.log('👤 User data:', user);
                console.log('🔑 Token:', token ? 'Presente' : 'Ausente');

                if (!user || !token) {
                    throw new Error('Datos de respuesta incompletos');
                }

                // Guardar sesión
                this.saveUserSession(user, token);
                
                // Mostrar éxito
                SimpleAlerts.show('¡Login exitoso! Redirigiendo...', 'success');

                // Redirección
                console.log('🔄 Programando redirección...');
                setTimeout(() => {
                    console.log('🔄 Ejecutando redirección a dashboard...');
                    window.location.href = 'dashboard.html';
                }, 1500);

            } else {
                throw new Error(response.message || 'Respuesta inesperada del servidor');
            }

        } catch (error) {
            console.error('❌ Error en handleLogin:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.message.includes('Credenciales inválidas')) {
                errorMessage = 'Usuario o contraseña incorrectos';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'No se puede conectar al servidor';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            SimpleAlerts.show(errorMessage, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    saveUserSession(user, token) {
        try {
            console.log('💾 Guardando sesión...');
            console.log('💾 User:', user);
            console.log('💾 Token presente:', !!token);

            // Guardar token
            localStorage.setItem('access_token', token);

            // Normalizar datos de usuario
            const normalizedUser = {
                id_usuario: user.id_usuario || user.id,
                username: user.username,
                perfil_usuario: user.perfil_usuario || user.perfil || user.rol,
                nombre_completo: user.nombre_completo || user.nombre || user.username,
                email: user.email
            };

            localStorage.setItem('user_data', JSON.stringify(normalizedUser));

            // Expiración
            const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('session_expires', expirationTime.toString());

            console.log('✅ Sesión guardada:', normalizedUser);

        } catch (error) {
            console.error('❌ Error guardando sesión:', error);
        }
    }

    setLoadingState(loading) {
        const button = document.querySelector('#loginForm button[type="submit"]');
        if (button) {
            button.disabled = loading;
            button.innerHTML = loading 
                ? '⏳ Iniciando sesión...' 
                : 'Iniciar Sesión';
        }
    }

    checkAuthenticationState() {
        console.log('🔍 Verificando estado de autenticación...');
        
        const currentPath = window.location.pathname;
        console.log('📍 Ruta actual:', currentPath);

        if (this.authService.isAuthenticated()) {
            console.log('✅ Usuario autenticado');
            if (currentPath.includes('login.html')) {
                console.log('🔄 Redirigiendo de login a dashboard');
                window.location.href = 'dashboard.html';
            }
        } else {
            console.log('❌ Usuario no autenticado');
            const isLoginOrIndex = currentPath.includes('login.html') || 
                                 currentPath.includes('index.html') || 
                                 currentPath === '/';
            
            if (!isLoginOrIndex) {
                console.log('🔄 Redirigiendo a login');
                window.location.href = 'login.html';
            }
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            SimpleAlerts.show('Sesión cerrada exitosamente', 'success');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } catch (error) {
            console.error('Error en logout:', error);
            this.authService.clearSession();
            window.location.href = 'login.html';
        }
    }
}

// ====================================================================
// INICIALIZACIÓN
// ====================================================================
let authManager = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 DOM cargado - Iniciando sistema de autenticación independiente...');
    console.log('🔍 Buscando formulario loginForm...');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Formulario encontrado');
    } else {
        console.log('❌ Formulario NO encontrado');
    }
    
    authManager = new AuthManager();
    
    // Hacer disponible globalmente
    window.authManager = authManager;
    window.authService = authManager.authService;
});

// ====================================================================
// FUNCIONES GLOBALES PARA HTML
// ====================================================================
function logout() {
    if (authManager) {
        authManager.logout();
    }
}

console.log('✅ auth.js independiente cargado completamente');