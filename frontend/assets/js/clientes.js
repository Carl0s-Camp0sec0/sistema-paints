// frontend/assets/js/clientes.js

class ClientesManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 15;
        this.currentSearch = '';
        this.currentEstado = '';
        this.currentPromociones = '';
        this.isEditing = false;
        this.editingId = null;
        this.confirmCallback = null;
        
        this.init();
    }

    async init() {
        try {
            this.initializeEventListeners();
            await this.loadClientes();
        } catch (error) {
            console.error('Error inicializando clientes:', error);
            utils.showAlert('Error al cargar datos iniciales', 'error');
        }
    }

    initializeEventListeners() {
        // Search and filters
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.loadClientes();
            }, 500));
        }

        const estadoFilter = document.getElementById('estadoFilter');
        if (estadoFilter) {
            estadoFilter.addEventListener('change', (e) => {
                this.currentEstado = e.target.value;
                this.currentPage = 1;
                this.loadClientes();
            });
        }

        const promocionesFilter = document.getElementById('promocionesFilter');
        if (promocionesFilter) {
            promocionesFilter.addEventListener('change', (e) => {
                this.currentPromociones = e.target.value;
                this.currentPage = 1;
                this.loadClientes();
            });
        }

        // Buttons
        document.getElementById('btnNuevoCliente')?.addEventListener('click', () => this.showModal());
        document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => this.clearFilters());
        
        // Modal events
        document.getElementById('btnCerrarModal')?.addEventListener('click', () => this.hideModal());
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.hideModal());
        document.getElementById('clienteForm')?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Confirmation modal
        document.getElementById('btnCancelarConfirmacion')?.addEventListener('click', () => this.hideConfirmModal());
        document.getElementById('btnConfirmarAccion')?.addEventListener('click', () => this.executeConfirmAction());

        // Pagination
        document.getElementById('btnPrevPage')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
        document.getElementById('btnNextPage')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadClientes() {
        try {
            this.showLoading(true);

            const params = {
                page: this.currentPage,
                limit: this.limit,
                search: this.currentSearch,
                estado: this.currentEstado,
                acepta_promociones: this.currentPromociones
            };

            const response = await api.get('/api/clientes', { params });

            if (response.success) {
                this.renderClientes(response.data.clientes || response.data);
                this.updatePagination(response.data.pagination || response.pagination);
                this.updateCounts(response.data.pagination || response.pagination);
            } else {
                utils.showAlert('Error al cargar clientes', 'error');
            }
        } catch (error) {
            console.error('Error loading clientes:', error);
            utils.showAlert('Error al conectar con el servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderClientes(clientes) {
        const tbody = document.getElementById('clientesTableBody');
        if (!tbody) return;

        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-4 block"></i>
                        ${this.hasActiveFilters() ? 
                            'No se encontraron clientes con los filtros aplicados' : 
                            'No hay clientes registrados'}
                        <div class="mt-2">
                            ${this.hasActiveFilters() ? 
                                '<button onclick="clientesManager.clearFilters()" class="text-paint-blue hover:underline">Limpiar filtros</button>' :
                                '<button onclick="clientesManager.showModal()" class="text-paint-blue hover:underline">Crear el primer cliente</button>'}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = clientes.map(cliente => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div>
                        <div class="text-sm font-medium text-gray-900">
                            ${this.escapeHtml(cliente.nombres)} ${this.escapeHtml(cliente.apellidos)}
                        </div>
                        <div class="text-sm text-gray-500">
                            ID: ${cliente.id_cliente}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        ${cliente.telefono ? `<div><i class="fas fa-phone text-gray-400 mr-1"></i> ${cliente.telefono}</div>` : ''}
                        ${cliente.email ? `<div><i class="fas fa-envelope text-gray-400 mr-1"></i> ${cliente.email}</div>` : ''}
                        ${!cliente.telefono && !cliente.email ? '<span class="text-gray-400">Sin contacto</span>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        ${cliente.nit ? `<div>NIT: ${cliente.nit}</div>` : ''}
                        ${cliente.dpi ? `<div>DPI: ${cliente.dpi}</div>` : ''}
                        ${!cliente.nit && !cliente.dpi ? '<span class="text-gray-400">Sin datos fiscales</span>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col space-y-1">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${cliente.estado ? 'Activo' : 'Inactivo'}
                        </span>
                        ${cliente.acepta_promociones ? 
                            '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Promociones</span>' : 
                            ''
                        }
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${this.formatDate(cliente.fecha_registro)}
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="clientesManager.viewClient(${cliente.id_cliente})" 
                                class="text-paint-blue hover:text-blue-900" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="clientesManager.editClient(${cliente.id_cliente})" 
                                data-require-profile="Gerente,Digitador"
                                class="text-indigo-600 hover:text-indigo-900" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="clientesManager.toggleClientStatus(${cliente.id_cliente}, ${cliente.estado ? 0 : 1})" 
                                data-require-profile="Gerente"
                                class="text-yellow-600 hover:text-yellow-900" 
                                title="${cliente.estado ? 'Desactivar' : 'Activar'}">
                            <i class="fas ${cliente.estado ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                        <button onclick="clientesManager.deleteClient(${cliente.id_cliente})" 
                                data-require-profile="Gerente"
                                class="text-red-600 hover:text-red-900" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Apply role-based permissions
        this.applyRolePermissions();
    }

    applyRolePermissions() {
        const user = window.authManager?.getCurrentUser();
        if (!user) return;

        document.querySelectorAll('[data-require-profile]').forEach(element => {
            const requiredProfiles = element.dataset.requireProfile.split(',');
            if (!requiredProfiles.includes(user.perfil_usuario)) {
                element.style.display = 'none';
            }
        });
    }

    hasActiveFilters() {
        return this.currentSearch || this.currentEstado || this.currentPromociones;
    }

    clearFilters() {
        this.currentSearch = '';
        this.currentEstado = '';
        this.currentPromociones = '';
        this.currentPage = 1;

        document.getElementById('searchInput').value = '';
        document.getElementById('estadoFilter').value = '';
        document.getElementById('promocionesFilter').value = '';

        this.loadClientes();
    }

    updateCounts(pagination) {
        const total = pagination?.total || 0;
        document.getElementById('showingCount').textContent = total;
        document.getElementById('totalCount').textContent = total;
    }

    updatePagination(pagination) {
        if (!pagination) return;

        document.getElementById('currentPage').textContent = pagination.currentPage || 1;
        document.getElementById('totalPages').textContent = pagination.totalPages || 1;

        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');

        if (btnPrev) btnPrev.disabled = !pagination.hasPrev;
        if (btnNext) btnNext.disabled = !pagination.hasNext;

        this.renderPageNumbers(pagination);
    }

    renderPageNumbers(pagination) {
        const container = document.getElementById('pageNumbers');
        if (!container) return;

        const { currentPage, totalPages } = pagination;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        container.innerHTML = '';

        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.className = `px-3 py-2 text-sm border rounded-md ${
                i === currentPage 
                    ? 'bg-paint-blue text-white border-paint-blue' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`;
            button.addEventListener('click', () => this.changePage(i));
            container.appendChild(button);
        }
    }

    changePage(page) {
        if (page >= 1) {
            this.currentPage = page;
            this.loadClientes();
        }
    }

    showModal(cliente = null) {
        this.isEditing = !!cliente;
        this.editingId = cliente?.id_cliente || null;

        const modal = document.getElementById('modalCliente');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('clienteForm');

        title.textContent = this.isEditing ? 'Editar Cliente' : 'Nuevo Cliente';
        
        if (this.isEditing && cliente) {
            this.fillForm(cliente);
        } else {
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modalCliente')?.classList.add('hidden');
        document.getElementById('clienteForm')?.reset();
        this.isEditing = false;
        this.editingId = null;
    }

    fillForm(cliente) {
        const form = document.getElementById('clienteForm');
        if (!form) return;

        form.nombres.value = cliente.nombres || '';
        form.apellidos.value = cliente.apellidos || '';
        form.nit.value = cliente.nit || '';
        form.dpi.value = cliente.dpi || '';
        form.telefono.value = cliente.telefono || '';
        form.email.value = cliente.email || '';
        form.direccion.value = cliente.direccion || '';
        form.estado.value = cliente.estado ? '1' : '0';
        form.acepta_promociones.checked = !!cliente.acepta_promociones;
    }

    async handleSubmit(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const clienteData = {
                nombres: formData.get('nombres').trim(),
                apellidos: formData.get('apellidos').trim(),
                nit: formData.get('nit').trim() || null,
                dpi: formData.get('dpi').trim() || null,
                telefono: formData.get('telefono').trim() || null,
                email: formData.get('email').trim() || null,
                direccion: formData.get('direccion').trim() || null,
                estado: parseInt(formData.get('estado')),
                acepta_promociones: formData.has('acepta_promociones')
            };

            // Validations
            if (!clienteData.nombres || !clienteData.apellidos) {
                utils.showAlert('Nombres y apellidos son obligatorios', 'warning');
                return;
            }

            if (clienteData.email && !this.isValidEmail(clienteData.email)) {
                utils.showAlert('El formato del email no es válido', 'warning');
                return;
            }

            if (clienteData.nit && !this.isValidNIT(clienteData.nit)) {
                utils.showAlert('El formato del NIT no es válido', 'warning');
                return;
            }

            if (clienteData.telefono && !this.isValidPhone(clienteData.telefono)) {
                utils.showAlert('El formato del teléfono no es válido', 'warning');
                return;
            }

            let response;
            if (this.isEditing) {
                response = await api.put(`/api/clientes/${this.editingId}`, clienteData);
            } else {
                response = await api.post('/api/clientes', clienteData);
            }

            if (response.success) {
                utils.showAlert(
                    `Cliente ${this.isEditing ? 'actualizado' : 'creado'} exitosamente`, 
                    'success'
                );
                this.hideModal();
                this.loadClientes();
            }
        } catch (error) {
            console.error('Error saving cliente:', error);
            utils.showAlert(error.message || 'Error al guardar cliente', 'error');
        }
    }

    async viewClient(id) {
        try {
            const response = await api.get(`/api/clientes/${id}`);
            
            if (response.success) {
                this.showClientDetails(response.data);
            }
        } catch (error) {
            console.error('Error loading cliente:', error);
            utils.showAlert('Error al cargar información del cliente', 'error');
        }
    }

    showClientDetails(cliente) {
        const detailsHTML = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" id="modalDetalles">
                <div class="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold">Detalles del Cliente</h3>
                        <button onclick="this.closest('#modalDetalles').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div class="text-gray-900">${cliente.nombres} ${cliente.apellidos}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                cliente.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }">
                                ${cliente.estado ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                            <div class="text-gray-900">${cliente.nit || 'No especificado'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">DPI</label>
                            <div class="text-gray-900">${cliente.dpi || 'No especificado'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <div class="text-gray-900">${cliente.telefono || 'No especificado'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div class="text-gray-900">${cliente.email || 'No especificado'}</div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <div class="text-gray-900">${cliente.direccion || 'No especificada'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Promociones</label>
                            <div class="text-gray-900">
                                ${cliente.acepta_promociones ? 'Acepta recibir promociones' : 'No acepta promociones'}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro</label>
                            <div class="text-gray-900">${this.formatDate(cliente.fecha_registro)}</div>
                        </div>
                    </div>
                    
                    <div class="mt-8 flex justify-end space-x-3">
                        <button onclick="clientesManager.editClient(${cliente.id_cliente}); this.closest('#modalDetalles').remove()" 
                                class="bg-paint-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            Editar Cliente
                        </button>
                        <button onclick="this.closest('#modalDetalles').remove()" 
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailsHTML);
    }

    async editClient(id) {
        try {
            const response = await api.get(`/api/clientes/${id}`);
            
            if (response.success) {
                this.showModal(response.data);
            }
        } catch (error) {
            console.error('Error loading cliente:', error);
            utils.showAlert('Error al cargar información del cliente', 'error');
        }
    }

    toggleClientStatus(id, newStatus) {
        const action = newStatus ? 'activar' : 'desactivar';
        this.showConfirmModal(
            `¿Está seguro de que desea ${action} este cliente?`,
            async () => {
                try {
                    const response = await api.put(`/api/clientes/${id}`, { estado: newStatus });
                    
                    if (response.success) {
                        utils.showAlert(`Cliente ${action}do exitosamente`, 'success');
                        this.loadClientes();
                    }
                } catch (error) {
                    console.error('Error updating cliente:', error);
                    utils.showAlert(`Error al ${action} cliente`, 'error');
                }
            }
        );
    }

    deleteClient(id) {
        this.showConfirmModal(
            '¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.',
            async () => {
                try {
                    const response = await api.delete(`/api/clientes/${id}`);
                    
                    if (response.success) {
                        utils.showAlert('Cliente eliminado exitosamente', 'success');
                        this.loadClientes();
                    }
                } catch (error) {
                    console.error('Error deleting cliente:', error);
                    utils.showAlert('Error al eliminar cliente', 'error');
                }
            }
        );
    }

    showConfirmModal(message, callback) {
        this.confirmCallback = callback;
        document.getElementById('mensajeConfirmacion').textContent = message;
        document.getElementById('modalConfirmacion').classList.remove('hidden');
    }

    hideConfirmModal() {
        document.getElementById('modalConfirmacion').classList.add('hidden');
        this.confirmCallback = null;
    }

    executeConfirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.hideConfirmModal();
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidNIT(nit) {
        if (!nit || nit === 'CF' || nit === 'C/F') return true;
        // Formato guatemalteco: 1234567-8 o 12345678
        const nitRegex = /^\d{7,8}-?\d{1}$/;
        return nitRegex.test(nit.replace(/\s/g, ''));
    }

    isValidPhone(phone) {
        if (!phone) return true;
        // Formato guatemalteco: 2234-5678, 5555-1234
        const phoneRegex = /^[2-9]\d{3}-?\d{4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

// Service para clientes
class ClienteService {
    static async getAll(params = {}) {
        return await api.get('/api/clientes', { params });
    }

    static async getById(id) {
        return await api.get(`/api/clientes/${id}`);
    }

    static async create(clienteData) {
        return await api.post('/api/clientes', clienteData);
    }

    static async update(id, clienteData) {
        return await api.put(`/api/clientes/${id}`, clienteData);
    }

    static async delete(id) {
        return await api.delete(`/api/clientes/${id}`);
    }

    static async search(termino) {
        return await api.get(`/api/clientes/buscar/${encodeURIComponent(termino)}`);
    }

    static async getFacturas(id, params = {}) {
        return await api.get(`/api/clientes/${id}/facturas`, { params });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.clientesManager = new ClientesManager();
    window.clienteService = ClienteService;
});

// Funciones globales para usar desde HTML
window.clientesManager = window.clientesManager || {};