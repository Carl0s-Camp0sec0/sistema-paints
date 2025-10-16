// frontend/assets/js/api.js

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

    // Método principal para hacer peticiones HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Para incluir cookies
        };

        const mergedOptions = { ...defaultOptions, ...options };

        // Agregar Authorization header si hay token
        const token = this.getToken();
        if (token) {
            mergedOptions.headers.Authorization = `Bearer ${token}`;
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
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }

        if (!response.ok) {
            const error = new Error(data.message || `HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // Manejar errores
    handleError(error) {
        if (error.name === 'AbortError') {
            return new Error('La petición tardó demasiado tiempo');
        }
        
        if (!navigator.onLine) {
            return new Error('Sin conexión a internet');
        }

        if (error.status === 401) {
            this.clearToken();
            if (window.location.pathname !== '/pages/login.html') {
                window.location.href = '/pages/login.html';
            }
            return new Error('Sesión expirada, por favor inicia sesión nuevamente');
        }

        return error;
    }

    // Métodos HTTP específicos
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Gestión de tokens
    getToken() {
        return localStorage.getItem('auth_token');
    }

    setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    clearToken() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return !!this.getToken();
    }
}

// Instancia global de la API
const api = new ApiClient();

// Servicios específicos de la API
const authService = {
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.success && response.data.token) {
            api.setToken(response.data.token);
            localStorage.setItem('user_data', JSON.stringify(response.data.user));
        }
        return response;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } finally {
            api.clearToken();
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
        return api.get('/sucursales', params);
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

    async getForSelect() {
        return api.get('/sucursales/select');
    },

    async findNearest(lat, lng) {
        return api.get('/sucursales/nearest', { lat, lng });
    }
};

const categoriasService = {
    async getAll(params = {}) {
        return api.get('/categorias', params);
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
    },

    async getForSelect() {
        return api.get('/categorias/select');
    },

    async getStats() {
        return api.get('/categorias/stats');
    }
};

const productosService = {
    async getAll(params = {}) {
        return api.get('/productos', params);
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
    },

    async getForSelect() {
        return api.get('/productos/select');
    },

    async getLowStock() {
        return api.get('/productos/low-stock');
    },

    async getPriceHistory(id) {
        return api.get(`/productos/${id}/prices`);
    },

    async updatePrice(id, priceData) {
        return api.post(`/productos/${id}/prices`, priceData);
    },

    async getStock(id) {
        return api.get(`/productos/${id}/stock`);
    }
};

// Utilidades
const utils = {
    // Mostrar mensaje de alerta
    showAlert(message, type = 'info', containerId = 'alertMessage') {
        const alertContainer = document.getElementById(containerId);
        if (!alertContainer) return;

        const alertClasses = {
            success: 'bg-green-100 border-green-400 text-green-700',
            error: 'bg-red-100 border-red-400 text-red-700',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700'
        };

        const alertIcons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        alertContainer.className = `border px-4 py-3 rounded ${alertClasses[type]}`;
        alertContainer.innerHTML = `
            <div class="flex items-center">
                <i class="${alertIcons[type]} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.classList.add('hidden')" 
                        class="ml-auto text-lg leading-none">×</button>
            </div>
        `;
        alertContainer.classList.remove('hidden');

        // Auto-hide después de 5 segundos
        setTimeout(() => {
            alertContainer.classList.add('hidden');
        }, 5000);
    },

    // Formatear fecha
    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-GT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Formatear moneda
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return 'Q 0.00';
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount);
    },

    // Formatear número
    formatNumber(number, decimals = 2) {
        if (number === null || number === undefined) return '0';
        return parseFloat(number).toFixed(decimals);
    },

    // Validar formulario
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });

        return isValid;
    },

    // Limpiar formulario
    clearForm(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
            input.classList.remove('border-red-500');
        });
    }
};

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si la página actual requiere autenticación
    const protectedPages = ['/pages/dashboard.html', '/pages/sucursales.html', '/pages/categorias.html', '/pages/productos.html'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.some(page => currentPath.includes(page))) {
        if (!api.isAuthenticated()) {
            window.location.href = '/pages/login.html';
            return;
        }
        
        // Verificar si el token es válido
        authService.verifyToken().catch(() => {
            window.location.href = '/pages/login.html';
        });
    }
});