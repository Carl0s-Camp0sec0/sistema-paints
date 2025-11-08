// frontend/assets/js/sucursales.js - VERSIÓN COMPLETA SIN CIUDAD

class SucursalesManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.currentSearch = '';
        this.isEditing = false;
        this.editingId = null;
        this.confirmCallback = null;
        
        this.init();
    }

    async init() {
        try {
            this.initializeEventListeners();
            await this.loadSucursales();
        } catch (error) {
            console.error('Error inicializando sucursales:', error);
            utils.showAlert('Error al cargar datos iniciales', 'error');
        }
    }

    initializeEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.loadSucursales();
            }, 500));
        }

        // Buttons
        document.getElementById('btnNuevaSucursal')?.addEventListener('click', () => this.showModal());
        document.getElementById('btnActualizar')?.addEventListener('click', () => this.loadSucursales());
        
        // Modal events
        document.getElementById('btnCerrarModal')?.addEventListener('click', () => this.hideModal());
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.hideModal());
        document.getElementById('sucursalForm')?.addEventListener('submit', (e) => this.handleSubmit(e));

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

    async loadSucursales() {
        try {
            this.showLoading(true);

            const params = {
                page: this.currentPage,
                limit: this.limit,
                search: this.currentSearch
            };

            const response = await sucursalesService.getAll(params);

            if (response.success) {
                this.renderSucursales(response.data);
                this.updatePagination(response.pagination);
            } else {
                utils.showAlert('Error al cargar sucursales', 'error');
            }
        } catch (error) {
            console.error('Error loading sucursales:', error);
            utils.showAlert('Error al conectar con el servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderSucursales(sucursales) {
        const tbody = document.getElementById('sucursalesTableBody');
        if (!tbody) return;

        if (sucursales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-store text-4xl mb-4 block"></i>
                        ${this.hasActiveFilters() ? 
                            'No se encontraron sucursales con los filtros aplicados' : 
                            'No hay sucursales registradas'}
                        <div class="mt-2">
                            ${this.hasActiveFilters() ? 
                                '<button onclick="sucursalesManager.clearFilters()" class="text-paint-blue hover:underline">Limpiar filtros</button>' :
                                '<button onclick="sucursalesManager.showModal()" class="text-paint-blue hover:underline">Crear la primera sucursal</button>'}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sucursales.map(sucursal => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div>
                        <div class="text-sm font-medium text-gray-900">
                            ${this.escapeHtml(sucursal.nombre)}
                        </div>
                        <div class="text-sm text-gray-500">
                            ID: ${sucursal.id_sucursal}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${this.escapeHtml(sucursal.direccion || 'Sin dirección')}</div>
                    <div class="text-sm text-gray-500">${this.escapeHtml(sucursal.departamento || 'Sin departamento')}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        ${sucursal.telefono ? `<div><i class="fas fa-phone text-gray-400 mr-1"></i> ${sucursal.telefono}</div>` : ''}
                        ${sucursal.latitud && sucursal.longitud ? 
                            `<div class="text-xs text-gray-500"><i class="fas fa-map-marker-alt text-gray-400 mr-1"></i> ${sucursal.latitud}, ${sucursal.longitud}</div>` : 
                            '<div class="text-xs text-gray-500">Sin coordenadas</div>'
                        }
                    </div>
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="sucursalesManager.viewSucursal(${sucursal.id_sucursal})" 
                                class="text-paint-blue hover:text-blue-900" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="sucursalesManager.editSucursal(${sucursal.id_sucursal})" 
                                data-require-profile="Gerente,Digitador"
                                class="text-indigo-600 hover:text-indigo-900" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="sucursalesManager.deleteSucursal(${sucursal.id_sucursal})" 
                                data-require-profile="Gerente"
                                class="text-red-600 hover:text-red-900" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

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
        return this.currentSearch;
    }

    clearFilters() {
        this.currentSearch = '';
        this.currentPage = 1;
        document.getElementById('searchInput').value = '';
        this.loadSucursales();
    }

    updatePagination(pagination) {
        if (!pagination) return;

        document.getElementById('currentPage').textContent = pagination.currentPage;
        document.getElementById('totalPages').textContent = pagination.totalPages;

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
            this.loadSucursales();
        }
    }

    showModal(sucursal = null) {
        this.isEditing = !!sucursal;
        this.editingId = sucursal?.id_sucursal || null;

        const modal = document.getElementById('modalSucursal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('sucursalForm');

        title.textContent = this.isEditing ? 'Editar Sucursal' : 'Nueva Sucursal';
        
        if (this.isEditing && sucursal) {
            this.fillForm(sucursal);
        } else {
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modalSucursal')?.classList.add('hidden');
        document.getElementById('sucursalForm')?.reset();
        this.isEditing = false;
        this.editingId = null;
    }

    fillForm(sucursal) {
        const form = document.getElementById('sucursalForm');
        if (!form) return;

        form.nombre.value = sucursal.nombre || '';
        form.direccion.value = sucursal.direccion || '';
        form.departamento.value = sucursal.departamento || '';
        form.telefono.value = sucursal.telefono || '';
        form.latitud.value = sucursal.latitud || '';
        form.longitud.value = sucursal.longitud || '';
    }

    async handleSubmit(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const sucursalData = {
                nombre: formData.get('nombre').trim(),
                direccion: formData.get('direccion').trim(),
                departamento: formData.get('departamento').trim(),
                telefono: formData.get('telefono').trim() || null,
                latitud: formData.get('latitud') ? parseFloat(formData.get('latitud')) : null,
                longitud: formData.get('longitud') ? parseFloat(formData.get('longitud')) : null
            };

            // Validaciones
            if (!sucursalData.nombre || !sucursalData.direccion || !sucursalData.departamento) {
                utils.showAlert('Nombre, dirección y departamento son obligatorios', 'warning');
                return;
            }

            if (sucursalData.telefono && !this.isValidPhoneGT(sucursalData.telefono)) {
                utils.showAlert('El formato del teléfono no es válido (ejemplo: 2234-5678)', 'warning');
                return;
            }

            if ((sucursalData.latitud && !sucursalData.longitud) || (!sucursalData.latitud && sucursalData.longitud)) {
                utils.showAlert('Debe proporcionar tanto latitud como longitud, o ninguna', 'warning');
                return;
            }

            let response;
            if (this.isEditing) {
                response = await sucursalesService.update(this.editingId, sucursalData);
            } else {
                response = await sucursalesService.create(sucursalData);
            }

            if (response.success) {
                utils.showAlert(
                    `Sucursal ${this.isEditing ? 'actualizada' : 'creada'} exitosamente`, 
                    'success'
                );
                this.hideModal();
                this.loadSucursales();
            }
        } catch (error) {
            console.error('Error saving sucursal:', error);
            utils.showAlert(error.message || 'Error al guardar sucursal', 'error');
        }
    }

    async viewSucursal(id) {
        try {
            const response = await sucursalesService.getById(id);
            
            if (response.success) {
                this.showSucursalDetails(response.data);
            }
        } catch (error) {
            console.error('Error loading sucursal:', error);
            utils.showAlert('Error al cargar información de la sucursal', 'error');
        }
    }

    showSucursalDetails(sucursal) {
        const detailsHTML = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" id="modalDetalles">
                <div class="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold">Detalles de Sucursal</h3>
                        <button onclick="this.closest('#modalDetalles').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <div class="text-gray-900">${sucursal.nombre}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                            <div class="text-gray-900">${sucursal.departamento || 'No especificado'}</div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <div class="text-gray-900">${sucursal.direccion || 'No especificada'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <div class="text-gray-900">${sucursal.telefono || 'No especificado'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Coordenadas GPS</label>
                            <div class="text-gray-900">
                                ${sucursal.latitud && sucursal.longitud ? 
                                    `${sucursal.latitud}, ${sucursal.longitud}` : 
                                    'No especificadas'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-8 flex justify-end space-x-3">
                        <button onclick="sucursalesManager.editSucursal(${sucursal.id_sucursal}); this.closest('#modalDetalles').remove()" 
                                class="bg-paint-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            Editar Sucursal
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

    async editSucursal(id) {
        try {
            const response = await sucursalesService.getById(id);
            
            if (response.success) {
                this.showModal(response.data);
            }
        } catch (error) {
            console.error('Error loading sucursal:', error);
            utils.showAlert('Error al cargar información de la sucursal', 'error');
        }
    }

    deleteSucursal(id) {
        this.showConfirmModal(
            '¿Está seguro de que desea eliminar esta sucursal? Esta acción no se puede deshacer.',
            async () => {
                try {
                    const response = await sucursalesService.delete(id);
                    
                    if (response.success) {
                        utils.showAlert('Sucursal eliminada exitosamente', 'success');
                        this.loadSucursales();
                    }
                } catch (error) {
                    console.error('Error deleting sucursal:', error);
                    utils.showAlert('Error al eliminar sucursal', 'error');
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

    isValidPhoneGT(phone) {
        // Formato guatemalteco: 2234-5678, 5555-1234
        const phoneRegex = /^[2-9]\d{3}-?\d{4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sucursalesManager = new SucursalesManager();
});

// Funciones globales para usar desde HTML
window.sucursalesManager = window.sucursalesManager || {};