// frontend/assets/js/categorias.js

class CategoriasManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 12; // Para grid layout
        this.currentSearch = '';
        this.isEditing = false;
        this.editingId = null;
        
        this.initializeEventListeners();
        this.loadCategorias();
    }

    initializeEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.loadCategorias();
            }, 500));
        }

        // Form submission
        const form = document.getElementById('categoriaForm');
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

    async loadCategorias() {
        try {
            this.showLoading(true);

            const params = {
                page: this.currentPage,
                limit: this.limit,
                search: this.currentSearch
            };

            const response = await categoriasService.getAll(params);

            if (response.success) {
                this.renderCategorias(response.data);
                this.updatePagination(response.pagination);
            } else {
                utils.showAlert('Error al cargar categorías', 'error');
            }
        } catch (error) {
            console.error('Error loading categorias:', error);
            utils.showAlert('Error al conectar con el servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderCategorias(categorias) {
        const grid = document.getElementById('categoriasGrid');
        if (!grid) return;

        if (categorias.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-tags text-6xl text-gray-300 mb-4 block"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                        ${this.currentSearch ? 'No se encontraron categorías' : 'No hay categorías registradas'}
                    </h3>
                    <p class="text-gray-500">
                        ${this.currentSearch ? 'Intenta con otro término de búsqueda' : 'Crea la primera categoría para empezar'}
                    </p>
                </div>
            `;
            return;
        }

        grid.innerHTML = categorias.map(categoria => `
            <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-tag text-green-600 text-xl"></i>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="categoriasManager.editCategoria(${categoria.id_categoria})" 
                                data-require-profile="Gerente,Digitador"
                                class="text-indigo-600 hover:text-indigo-900 p-1" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="categoriasManager.deleteCategoria(${categoria.id_categoria})" 
                                data-require-profile="Gerente"
                                class="text-red-600 hover:text-red-900 p-1" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    ${this.escapeHtml(categoria.nombre)}
                </h3>
                
                <p class="text-gray-600 text-sm mb-4 min-h-[40px]">
                    ${categoria.descripcion ? this.escapeHtml(categoria.descripcion) : 'Sin descripción'}
                </p>
                
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">
                        ID: ${categoria.id_categoria}
                    </span>
                    <div class="flex items-center text-green-600">
                        <i class="fas fa-check-circle mr-1"></i>
                        Activa
                    </div>
                </div>
            </div>
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
        const grid = document.getElementById('categoriasGrid');
        
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
        if (grid) {
            grid.classList.toggle('hidden', show);
        }
    }

    showCreateModal() {
        this.isEditing = false;
        this.editingId = null;
        
        document.getElementById('modalTitle').textContent = 'Nueva Categoría';
        document.getElementById('submitBtnText').textContent = 'Crear';
        
        this.clearForm();
        this.showModal();
    }

    async editCategoria(id) {
        try {
            this.isEditing = true;
            this.editingId = id;
            
            const response = await categoriasService.getById(id);
            
            if (response.success) {
                const categoria = response.data;
                
                document.getElementById('modalTitle').textContent = 'Editar Categoría';
                document.getElementById('submitBtnText').textContent = 'Actualizar';
                
                // Fill form with data
                document.getElementById('categoriaId').value = categoria.id_categoria;
                document.getElementById('nombre').value = categoria.nombre;
                document.getElementById('descripcion').value = categoria.descripcion || '';
                
                this.showModal();
            } else {
                utils.showAlert('Error al cargar datos de la categoría', 'error');
            }
        } catch (error) {
            console.error('Error loading categoria:', error);
            utils.showAlert('Error al cargar datos de la categoría', 'error');
        }
    }

    async deleteCategoria(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?\n\nNota: Solo se puede eliminar si no tiene productos asociados.')) {
            return;
        }

        try {
            const response = await categoriasService.delete(id);
            
            if (response.success) {
                utils.showAlert('Categoría eliminada exitosamente', 'success');
                this.loadCategorias();
            } else {
                utils.showAlert('Error al eliminar categoría', 'error');
            }
        } catch (error) {
            console.error('Error deleting categoria:', error);
            if (error.message.includes('productos asociados')) {
                utils.showAlert('No se puede eliminar la categoría porque tiene productos asociados', 'warning');
            } else {
                utils.showAlert('Error al eliminar categoría', 'error');
            }
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {
            nombre: formData.get('nombre').trim(),
            descripcion: formData.get('descripcion')?.trim() || null
        };

        // Basic validation
        if (!data.nombre) {
            utils.showAlert('El nombre de la categoría es requerido', 'error');
            return;
        }

        if (data.nombre.length < 2) {
            utils.showAlert('El nombre debe tener al menos 2 caracteres', 'error');
            return;
        }

        if (data.descripcion && data.descripcion.length > 200) {
            utils.showAlert('La descripción no puede exceder 200 caracteres', 'error');
            return;
        }

        try {
            let response;
            
            if (this.isEditing) {
                response = await categoriasService.update(this.editingId, data);
            } else {
                response = await categoriasService.create(data);
            }

            if (response.success) {
                const action = this.isEditing ? 'actualizada' : 'creada';
                utils.showAlert(`Categoría ${action} exitosamente`, 'success');
                
                this.closeModal();
                this.loadCategorias();
            } else {
                utils.showAlert('Error al guardar categoría', 'error');
            }
        } catch (error) {
            console.error('Error saving categoria:', error);
            let errorMessage = 'Error al guardar categoría';
            
            if (error.message.includes('Ya existe')) {
                errorMessage = 'Ya existe una categoría con este nombre';
            } else if (error.message.includes('caracteres')) {
                errorMessage = error.message;
            }
            
            utils.showAlert(errorMessage, 'error');
        }
    }

    showModal() {
        const modal = document.getElementById('categoriaModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Focus on first input
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('categoriaModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.clearForm();
    }

    clearForm() {
        const form = document.getElementById('categoriaForm');
        if (form) {
            form.reset();
            document.getElementById('categoriaId').value = '';
        }
    }

    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1) {
            this.currentPage = newPage;
            this.loadCategorias();
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
let categoriasManager;

function showCreateModal() {
    if (categoriasManager) {
        categoriasManager.showCreateModal();
    }
}

function closeModal() {
    if (categoriasManager) {
        categoriasManager.closeModal();
    }
}

function changePage(direction) {
    if (categoriasManager) {
        categoriasManager.changePage(direction);
    }
}

function loadCategorias() {
    if (categoriasManager) {
        categoriasManager.loadCategorias();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.authManager && window.authManager.isLoggedIn()) {
        categoriasManager = new CategoriasManager();
    }
});