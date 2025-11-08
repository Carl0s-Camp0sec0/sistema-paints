// frontend/assets/js/api.js - VERSIÓN CORREGIDA

// Configuración de la API
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api',
    timeout: 30000,
    retries: 3
};

// Clase para manejar todas las llamadas a la API
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
    }

    // Obtener token del localStorage
    getToken() {
        return localStorage.getItem('auth_token');
    }

    // Guardar token en localStorage
    setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    // Limpiar token
    clearToken() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    // Método principal para hacer peticiones HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        };

        const mergedOptions = { ...defaultOptions, ...options };

        // Agregar Authorization header si hay token
        const token = this.getToken();
        if (token) {
            mergedOptions.headers.Authorization = `Bearer ${token}`;
        }

        // Si hay parámetros GET, agregarlos a la URL
        if (options.params && mergedOptions.method === 'GET') {
            const searchParams = new URLSearchParams();
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    searchParams.append(key, value);
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                const separator = url.includes('?') ? '&' : '?';
                return this.request(`${endpoint}${separator}${queryString}`, { ...options, params: undefined });
            }
        }

        try {
            console.log(`🌐 ${mergedOptions.method} ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                ...mergedOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Manejar respuesta
            const data = await this.handleResponse(response);
            return data;

        } catch (error) {
            console.error(`❌ Error en ${mergedOptions.method} ${url}:`, error);
            throw this.handleError(error);
        }
    }

    // Manejar respuesta HTTP
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        
        let data;
        try {
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const textData = await response.text();
                data = { message: textData };
            }
        } catch (parseError) {
            console.error('Error parseando respuesta:', parseError);
            data = { message: 'Error parseando respuesta del servidor' };
        }

        if (!response.ok) {
            // Si es error 401, limpiar token y redirigir a login
            if (response.status === 401) {
                this.clearToken();
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = '/pages/login.html';
                }
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }

            const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return data;
    }

    // Manejar errores de red
    handleError(error) {
        if (error.name === 'AbortError') {
            return new Error('Tiempo de espera agotado. Verifica tu conexión.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000');
        }

        return error;
    }

    // Métodos HTTP simplificados
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data = null, options = {}) {
        const requestOptions = {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : null
        };
        return this.request(endpoint, requestOptions);
    }

    async put(endpoint, data = null, options = {}) {
        const requestOptions = {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null
        };
        return this.request(endpoint, requestOptions);
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        const token = this.getToken();
        const userData = localStorage.getItem('user_data');
        return !!(token && userData);
    }

    // Obtener datos del usuario
    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    // Verificar si el servidor está disponible
    async checkServerConnection() {
        try {
            const response = await fetch('http://localhost:3000/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error('❌ Servidor no disponible:', error);
            return false;
        }
    }
}

// Instancia global de la API
const api = new ApiClient();

// Servicios específicos de la API
const authService = {
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.success && response.data.token) {
                api.setToken(response.data.token);
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            api.clearToken();
            window.location.href = '/pages/login.html';
        }
    },

    async getProfile() {
        return api.get('/auth/profile');
    },

    async verifyToken() {
        return api.post('/auth/verify-token');
    },

    async changePassword(passwordData) {
        return api.post('/auth/change-password', passwordData);
    }
};

const sucursalesService = {
    async getAll(params = {}) {
        return api.get('/sucursales', { params });
    },

    async getById(id) {
        return api.get(`/sucursales/${id}`);
    },

    async create(data) {
        return api.post('/sucursales', data);
    },

    async update(id, data) {
        return api.put(`/sucursales/${id}`, data);
    },

    async delete(id) {
        return api.delete(`/sucursales/${id}`);
    },

    async findNearest(lat, lng) {
        return api.get('/sucursales/nearest', { params: { lat, lng } });
    }
};

const categoriasService = {
    async getAll(params = {}) {
        return api.get('/categorias', { params });
    },

    async getById(id) {
        return api.get(`/categorias/${id}`);
    },

    async create(data) {
        return api.post('/categorias', data);
    },

    async update(id, data) {
        return api.put(`/categorias/${id}`, data);
    },

    async delete(id) {
        return api.delete(`/categorias/${id}`);
    }
};

const productosService = {
    async getAll(params = {}) {
        return api.get('/productos', { params });
    },

    async getById(id) {
        return api.get(`/productos/${id}`);
    },

    async create(data) {
        return api.post('/productos', data);
    },

    async update(id, data) {
        return api.put(`/productos/${id}`, data);
    },

    async delete(id) {
        return api.delete(`/productos/${id}`);
    }
};

const clientesService = {
    async getAll(params = {}) {
        return api.get('/clientes', { params });
    },

    async getById(id) {
        return api.get(`/clientes/${id}`);
    },

    async create(data) {
        return api.post('/clientes', data);
    },

    async update(id, data) {
        return api.put(`/clientes/${id}`, data);
    },

    async delete(id) {
        return api.delete(`/clientes/${id}`);
    },

    async search(termino) {
        return api.get(`/clientes/buscar/${encodeURIComponent(termino)}`);
    }
};

const facturasService = {
    async getAll(params = {}) {
        return api.get('/facturas', { params });
    },

    async getById(id) {
        return api.get(`/facturas/${id}`);
    },

    async create(data) {
        return api.post('/facturas', data);
    },

    async validarStock(productos) {
        return api.post('/facturas/validar-stock', { productos });
    },

    async anular(id) {
        return api.put(`/facturas/${id}/anular`);
    }
};

const catalogosService = {
    async getTiposPago() {
        return api.get('/catalogos/tipos-pago');
    },

    async getProductosFacturacion() {
        return api.get('/catalogos/productos-facturacion');
    }
};

// Verificación de conexión al cargar
document.addEventListener('DOMContentLoaded', async () => {
    const serverAvailable = await api.checkServerConnection();
    if (!serverAvailable) {
        console.error('❌ No se puede conectar al backend');
        if (typeof utils !== 'undefined' && utils.showAlert) {
            utils.showAlert(
                'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000', 
                'error', 
                0 // No auto-hide
            );
        }
    } else {
        console.log('✅ Conexión al backend establecida');
    }
});

// Exportar para uso global
window.api = api;
window.authService = authService;
window.sucursalesService = sucursalesService;
window.categoriasService = categoriasService;
window.productosService = productosService;
window.clientesService = clientesService;
window.facturasService = facturasService;
window.catalogosService = catalogosService;