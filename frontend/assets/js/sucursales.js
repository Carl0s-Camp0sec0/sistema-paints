// frontend/assets/js/sucursales.js

class SucursalesManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.currentSearch = '';
        this.isEditing = false;
        this.editingId = null;
        
        this.initializeEventListeners();
        this.loadSucursales();
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

        // Form submission
        const form = document.getElementById('sucursalForm');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
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
                        ${this.currentSearch ? 'No se encontraron sucursales' : 'No hay sucursales registradas'}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sucursales.map(sucursal => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-paint-blue bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-store text-paint-blue"></i>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(sucursal.nombre)}</div>
                            <div class="text-sm text-gray-500">ID: ${sucursal.id_sucursal}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${this.escapeHtml(sucursal.direccion)}</div>
                    <div class="text-sm text-gray-500">
                        ${this.escapeHtml(sucursal.ciudad)}, ${this.escapeHtml(sucursal.departamento)}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        ${sucursal.telefono ? `<i class="fas fa-phone mr-1"></i>${this.escapeHtml(sucursal.telefono)}` : '-'}
                    </div>
                    ${sucursal.latitud && sucursal.longitud ? `
                        <div class="text-sm text-gray-500">
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            ${sucursal.latitud}, ${sucursal.longitud}
                        </div>
                    ` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="sucursalesManager.editSucursal(${sucursal.id_sucursal})" 
                            data-require-profile="Gerente,Digitador"
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="sucursalesManager.deleteSucursal(${sucursal.id_sucursal})" 
                            data-require-profile="Gerente"
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updatePagination(pagination) {
        if (!pagination) return;

        const paginationDiv = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const paginationInfo = document.getElementById('paginationInfo');

        if (paginationDiv) {
            paginationDiv.classList.toggle('hidden', pagination.totalItems === 0);
        }

        if (prevBtn) {
            prevBtn.disabled = !pagination.hasPrevPage;
        }

        if (nextBtn) {
            nextBtn.disabled = !pagination.hasNextPage;
        }

        if (pageInfo) {
            pageInfo.textContent = `Página ${pagination.currentPage} de ${pagination.totalPages}`;
        }

        if (paginationInfo) {
            const start = ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1;
            const end = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
            paginationInfo.textContent = `${start}-${end} de ${pagination.totalItems}`;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const table = document.querySelector('.bg-white.rounded-lg.shadow-sm.overflow-hidden');
        
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
        if (table) {
            table.classList.toggle('hidden', show);
        }
    }

    showCreateModal() {
        this.isEditing = false;
        this.editingId = null;
        
        document.getElementById('modalTitle').textContent = 'Nueva Sucursal';
        document.getElementById('submitBtnText').textContent = 'Crear';
        
        this.clearForm();
        this.showModal();
    }

    async editSucursal(id) {
        try {
            this.isEditing = true;
            this.editingId = id;
            
            const response = await sucursalesService.getById(id);
            
            if (response.success) {
                const sucursal = response.data;
                
                document.getElementById('modalTitle').textContent = 'Editar Sucursal';
                document.getElementById('submitBtnText').textContent = 'Actualizar';
                
                // Fill form with data
                document.getElementById('sucursalId').value = sucursal.id_sucursal;
                document.getElementById('nombre').value = sucursal.nombre;
                document.getElementById('direccion').value = sucursal.direccion;
                document.getElementById('ciudad').value = sucursal.ciudad;
                document.getElementById('departamento').value = sucursal.departamento;
                document.getElementById('telefono').value = sucursal.telefono || '';
                document.getElementById('latitud').value = sucursal.latitud || '';
                document.getElementById('longitud').value = sucursal.longitud || '';
                
                this.showModal();
            } else {
                utils.showAlert('Error al cargar datos de la sucursal', 'error');
            }
        } catch (error) {
            console.error('Error loading sucursal:', error);
            utils.showAlert('Error al cargar datos de la sucursal', 'error');
        }
    }

    async deleteSucursal(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) {
            return;
        }

        try {
            const response = await sucursalesService.delete(id);
            
            if (response.success) {
                utils.showAlert('Sucursal eliminada exitosamente', 'success');
                this.loadSucursales();
            } else {
                utils.showAlert('Error al eliminar sucursal', 'error');
            }
        } catch (error) {
            console.error('Error deleting sucursal:', error);
            utils.showAlert('Error al eliminar sucursal', 'error');
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {
            nombre: formData.get('nombre').trim(),
            direccion: formData.get('direccion').trim(),
            ciudad: formData.get('ciudad').trim(),
            departamento: formData.get('departamento').trim(),
            telefono: formData.get('telefono')?.trim() || null,
            latitud: formData.get('latitud') ? parseFloat(formData.get('latitud')) : null,
            longitud: formData.get('longitud') ? parseFloat(formData.get('longitud')) : null
        };

        // Basic validation
        if (!data.nombre || !data.direccion || !data.ciudad || !data.departamento) {
            utils.showAlert('Por favor, completa todos los campos requeridos', 'error');
            return;
        }

        try {
            let response;
            
            if (this.isEditing) {
                response = await sucursalesService.update(this.editingId, data);
            } else {
                response = await sucursalesService.create(data);
            }

            if (response.success) {
                const action = this.isEditing ? 'actualizada' : 'creada';
                utils.showAlert(`Sucursal ${action} exitosamente`, 'success');
                
                this.closeModal();
                this.loadSucursales();
            } else {
                utils.showAlert('Error al guardar sucursal', 'error');
            }
        } catch (error) {
            console.error('Error saving sucursal:', error);
            utils.showAlert(error.message || 'Error al guardar sucursal', 'error');
        }
    }

    showModal() {
        const modal = document.getElementById('sucursalModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('sucursalModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.clearForm();
    }

    clearForm() {
        const form = document.getElementById('sucursalForm');
        if (form) {
            form.reset();
            document.getElementById('sucursalId').value = '';
        }
    }

    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1) {
            this.currentPage = newPage;
            this.loadSucursales();
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for HTML onclick events
let sucursalesManager;

function showCreateModal() {
    if (sucursalesManager) {
        sucursalesManager.showCreateModal();
    }
}

function closeModal() {
    if (sucursalesManager) {
        sucursalesManager.closeModal();
    }
}

function changePage(direction) {
    if (sucursalesManager) {
        sucursalesManager.changePage(direction);
    }
}

function loadSucursales() {
    if (sucursalesManager) {
        sucursalesManager.loadSucursales();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.authManager && window.authManager.isLoggedIn()) {
        sucursalesManager = new SucursalesManager();
    }
});