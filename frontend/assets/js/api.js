// frontend/assets/js/api.js - VERSIÓN CORREGIDA FINAL

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.timeout = 15000;
        this.token = this.getToken();
    }

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

    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const mergedOptions = {
            method: 'GET',
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };

        if (options.body instanceof FormData) {
            delete mergedOptions.headers['Content-Type'];
        } else if (options.body && typeof options.body === 'object') {
            mergedOptions.body = JSON.stringify(options.body);
        }

        // CORRECCIÓN: endpoint SIN /api inicial para evitar doble /api
        let url = `${this.baseURL}${endpoint}`;
        
        if (options.params) {
            const queryString = new URLSearchParams(options.params).toString();
            if (queryString) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}${queryString}`;
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

            return await this.handleResponse(response);

        } catch (error) {
            console.error(`❌ Error en ${mergedOptions.method} ${url}:`, error);
            throw this.handleError(error);
        }
    }

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

    handleError(error) {
        if (error.name === 'AbortError') {
            return new Error('Tiempo de espera agotado. Verifica tu conexión.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000');
        }

        return error;
    }

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
}

const api = new ApiClient();

const authService = {
    async login(credentials) {
        return api.post('/auth/login', credentials);
    },

    async getProfile() {
        return api.get('/auth/profile');
    },

    async logout() {
        const result = api.post('/auth/logout');
        api.clearToken();
        return result;
    }
};

const sucursalesService = {
    async getAll(params = {}) {
        return api.get('/sucursales', { params });
    },
    async getById(id) { return api.get(`/sucursales/${id}`); },
    async create(data) { return api.post('/sucursales', data); },
    async update(id, data) { return api.put(`/sucursales/${id}`, data); },
    async delete(id) { return api.delete(`/sucursales/${id}`); }
};

const categoriasService = {
    async getAll(params = {}) {
        return api.get('/categorias', { params });
    },
    async getById(id) { return api.get(`/categorias/${id}`); },
    async create(data) { return api.post('/categorias', data); },
    async update(id, data) { return api.put(`/categorias/${id}`, data); },
    async delete(id) { return api.delete(`/categorias/${id}`); }
};

const productosService = {
    async getAll(params = {}) {
        return api.get('/productos', { params });
    },
    async getById(id) { return api.get(`/productos/${id}`); },
    async create(data) { return api.post('/productos', data); },
    async update(id, data) { return api.put(`/productos/${id}`, data); },
    async delete(id) { return api.delete(`/productos/${id}`); }
};

const clientesService = {
    async getAll(params = {}) {
        return api.get('/clientes', { params });
    },
    async getById(id) { return api.get(`/clientes/${id}`); },
    async create(data) { return api.post('/clientes', data); },
    async update(id, data) { return api.put(`/clientes/${id}`, data); },
    async delete(id) { return api.delete(`/clientes/${id}`); },
    async search(termino) { return api.get(`/clientes/buscar/${encodeURIComponent(termino)}`); }
};

const facturasService = {
    async getAll(params = {}) { return api.get('/facturas', { params }); },
    async getById(id) { return api.get(`/facturas/${id}`); },
    async create(data) { return api.post('/facturas', data); },
    async validarStock(productos) { return api.post('/facturas/validar-stock', { productos }); }
};

const catalogosService = {
    async getTiposPago() { return api.get('/catalogos/tipos-pago'); },
    async getSeriesFactura() { return api.get('/catalogos/series-factura'); },
    async getProductosFacturacion() { return api.get('/catalogos/productos-facturacion'); }
};

// Global objects
if (typeof window !== 'undefined') {
    window.api = api;
    window.authService = authService;
    window.sucursalesService = sucursalesService;
    window.categoriasService = categoriasService;
    window.productosService = productosService;
    window.clientesService = clientesService;
    window.facturasService = facturasService;
    window.catalogosService = catalogosService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        api, authService, sucursalesService, categoriasService, 
        productosService, clientesService, facturasService, catalogosService 
    };
}