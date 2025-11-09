// frontend/assets/js/api.js
// ARCHIVO COMPLETO CORREGIDO

// Clase principal del cliente API
class ApiClient {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }

    // FUNCIÓN PRINCIPAL CORREGIDA: Request con manejo mejorado de respuestas
    async request(endpoint, options = {}) {
        try {
            const url = this.baseURL + endpoint;
            
            // Configuración por defecto
            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // Agregar token de autorización si existe
            const token = this.getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // Procesar parámetros de query string
            let finalUrl = url;
            if (options.params) {
                const queryString = new URLSearchParams(options.params).toString();
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
            }

            // Procesar body para POST/PUT
            if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
                config.body = JSON.stringify(config.body);
            }

            console.log(`🌐 API Request: ${config.method} ${finalUrl}`);

            const response = await fetch(finalUrl, config);
            
            // CORRECCIÓN: Manejo mejorado de respuestas
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            console.log(`📡 API Response:`, data);

            // CORRECCIÓN: Verificar si la respuesta fue exitosa
            if (!response.ok) {
                // El servidor retornó un error HTTP
                const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            // CORRECCIÓN: Si el servidor indica que la operación no fue exitosa
            if (data.hasOwnProperty('success') && !data.success) {
                throw new Error(data.message || 'Operación no exitosa');
            }

            // Retornar datos normalizados
            return data;

        } catch (error) {
            console.error(`❌ API Error (${endpoint}):`, error);
            
            // CORRECCIÓN: Mejorar manejo de errores de red
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Sin conexión al servidor. Verifica tu conexión a internet.');
            }
            
            if (error.name === 'SyntaxError') {
                throw new Error('Error en la respuesta del servidor. Formato inválido.');
            }
            
            // Re-lanzar el error original si ya tiene un mensaje descriptivo
            throw error;
        }
    }

    // FUNCIONES MEJORADAS: Manejo de tokens
    getToken() {
        try {
            return localStorage.getItem('auth_token');
        } catch (error) {
            console.error('Error obteniendo token:', error);
            return null;
        }
    }

    setToken(token) {
        try {
            if (token) {
                localStorage.setItem('auth_token', token);
                console.log('🔐 Token guardado exitosamente');
            } else {
                localStorage.removeItem('auth_token');
                console.log('🔐 Token removido');
            }
        } catch (error) {
            console.error('Error estableciendo token:', error);
        }
    }

    clearToken() {
        try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            console.log('🚪 Token y datos de usuario limpiados');
        } catch (error) {
            console.error('Error limpiando token:', error);
        }
    }

    // Métodos HTTP simplificados
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

// Crear instancia global del cliente API
const api = new ApiClient();

// SERVICIO DE AUTENTICACIÓN CORREGIDO
const authService = {
    async login(credentials) {
        try {
            console.log('🔐 Intentando login para:', credentials.username);
            const response = await api.post('/auth/login', credentials);
            
            // CORRECCIÓN: Guardar token automáticamente si el login es exitoso
            if (response.success && response.data && response.data.token) {
                api.setToken(response.data.token);
                console.log('✅ Token guardado automáticamente');
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error en authService.login:', error);
            throw error;
        }
    },

    async getProfile() {
        try {
            return await api.get('/auth/profile');
        } catch (error) {
            console.error('❌ Error en authService.getProfile:', error);
            
            // Si el token es inválido, limpiar la sesión
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                console.warn('Token inválido, limpiando sesión');
                api.clearToken();
                
                // Solo redirigir si no estamos ya en login
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            }
            
            throw error;
        }
    },

    async logout() {
        try {
            // Intentar logout en el servidor
            const result = await api.post('/auth/logout');
            
            // Limpiar siempre localmente, independientemente de la respuesta del servidor
            api.clearToken();
            
            return result;
        } catch (error) {
            // Limpiar localmente aunque falle el logout del servidor
            api.clearToken();
            console.warn('Error en logout del servidor, pero limpiado localmente:', error);
            return { success: true, message: 'Logout completado localmente' };
        }
    },

    // NUEVO: Método para verificar validez del token
    async verifyToken() {
        try {
            const token = api.getToken();
            if (!token) {
                return false;
            }
            
            const response = await api.get('/auth/verify');
            return response.success;
        } catch (error) {
            console.error('Token inválido:', error);
            api.clearToken();
            return false;
        }
    },

    // NUEVO: Cambiar contraseña
    async changePassword(passwordData) {
        try {
            return await api.post('/auth/change-password', passwordData);
        } catch (error) {
            console.error('Error en changePassword:', error);
            throw error;
        }
    }
};

// SERVICIOS PARA OTROS MÓDULOS
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
    async getNearby(lat, lng) {
        return api.get('/sucursales/nearby', { params: { lat, lng } });
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
    },
    async getStats() {
        return api.get('/categorias/stats');
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
    async getByCategory(categoryId) {
        return api.get(`/productos/categoria/${categoryId}`);
    },
    async updatePrice(id, priceData) {
        return api.post(`/productos/${id}/precio`, priceData);
    },
    async getStock(id, bodegaId = null) {
        const params = bodegaId ? { bodega: bodegaId } : {};
        return api.get(`/productos/${id}/stock`, { params });
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
    async anular(id, motivo) {
        return api.post(`/facturas/${id}/anular`, { motivo });
    },
    async imprimir(id) {
        return api.get(`/facturas/${id}/pdf`);
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
    },
    async getUnidadesMedida() {
        return api.get('/catalogos/unidades-medida');
    },
    async getColores() {
        return api.get('/catalogos/colores');
    }
};

// INTERCEPTOR GLOBAL PARA ERRORES 401
(function setupGlobalErrorHandling() {
    const originalRequest = api.request.bind(api);
    
    api.request = async function(endpoint, options = {}) {
        try {
            return await originalRequest(endpoint, options);
        } catch (error) {
            // Interceptar errores 401 globalmente
            if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Token inválido')) {
                console.warn('🔒 Sesión expirada, redirigiendo al login');
                api.clearToken();
                
                // Solo redirigir si no estamos ya en login
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            }
            
            throw error;
        }
    };
})();

// HACER DISPONIBLES LOS SERVICIOS GLOBALMENTE
if (typeof window !== 'undefined') {
    window.api = api;
    window.authService = authService;
    window.sucursalesService = sucursalesService;
    window.categoriasService = categoriasService;
    window.productosService = productosService;
    window.clientesService = clientesService;
    window.facturasService = facturasService;
    window.catalogosService = catalogosService;
    
    console.log('✅ Servicios de API inicializados correctamente');
}

// EXPORTAR PARA USO CON MÓDULOS
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