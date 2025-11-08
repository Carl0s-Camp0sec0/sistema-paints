// frontend/assets/js/api.js - VERSIÓN CORREGIDA COMPLETA

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api'; // SIN doble /api
        this.timeout = 10000;
        this.token = this.getToken();
    }

    // Token management
    getToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    setToken(token, remember = false) {
        if (remember) {
            localStorage.setItem('authToken', token);
            sessionStorage.removeItem('authToken');
        } else {
            sessionStorage.setItem('authToken', token);
            localStorage.removeItem('authToken');
        }
        this.token = token;
    }

    clearToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        this.token = null;
    }

    // Default headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Main request method
    async request(endpoint, options = {}) {
        const mergedOptions = {
            method: 'GET',
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };

        // Handle FormData differently
        if (options.body instanceof FormData) {
            delete mergedOptions.headers['Content-Type'];
        } else if (options.body && typeof options.body === 'object') {
            mergedOptions.body = JSON.stringify(options.body);
        }

        // Build URL with query parameters
        let url = `${this.baseURL}${endpoint}`;
        
        if (options.params) {
            const queryString = new URLSearchParams(options.params).toString();
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

            // Handle response
            const data = await this.handleResponse(response);
            return data;

        } catch (error) {
            console.error(`❌ Error en ${mergedOptions.method} ${url}:`, error);
            throw this.handleError(error);
        }
    }

    // Handle HTTP response
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
            // If 401, clear token and redirect to login
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

    // Handle network errors
    handleError(error) {
        if (error.name === 'AbortError') {
            return new Error('Tiempo de espera agotado. Verifica tu conexión.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000');
        }

        return error;
    }

    // HTTP methods
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data = null, options = {}) {
        const requestOptions = {
            ...options,
            method: 'POST',
            body: data ? (data instanceof FormData ? data : data) : null
        };
        return this.request(endpoint, requestOptions);
    }

    async put(endpoint, data = null, options = {}) {
        const requestOptions = {
            ...options,
            method: 'PUT',
            body: data ? (data instanceof FormData ? data : data) : null
        };
        return this.request(endpoint, requestOptions);
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch('http://localhost:3000/health');
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Services object for different entities
const api = new ApiClient();

// Service objects for different modules
const authService = {
    async login(credentials) {
        return api.post('/auth/login', credentials);
    },

    async getProfile() {
        return api.get('/auth/profile');
    },

    async logout() {
        api.clearToken();
        return { success: true };
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
    },

    async getForSelect() {
        return api.get('/productos/select/dropdown');
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
    },

    async getForSelect() {
        return api.get('/clientes/select/dropdown');
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

    async anular(id) {
        return api.put(`/facturas/${id}/anular`);
    },

    async validarStock(productos) {
        return api.post('/facturas/validar-stock', { productos });
    },

    async buscarPorNumero(numero) {
        return api.get(`/facturas/numero/${numero}`);
    },

    async obtenerDetalleImpresion(id) {
        return api.get(`/facturas/${id}/imprimir`);
    }
};

const catalogosService = {
    async getTiposPago() {
        return api.get('/catalogos/tipos-pago');
    },

    async getSeriesFactura() {
        return api.get('/catalogos/series-factura');
    },

    async getProductosFacturacion() {
        return api.get('/catalogos/productos-facturacion');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        api, 
        authService, 
        sucursalesService, 
        categoriasService, 
        productosService, 
        clientesService, 
        facturasService, 
        catalogosService 
    };
}

// Global objects for browser usage
window.api = api;
window.authService = authService;
window.sucursalesService = sucursalesService;
window.categoriasService = categoriasService;
window.productosService = productosService;
window.clientesService = clientesService;
window.facturasService = facturasService;
window.catalogosService = catalogosService;