// frontend/assets/js/productos.js - VERSIÓN COMPLETA

class ProductosManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.currentSearch = '';
        this.currentCategory = '';
        this.isEditing = false;
        this.editingId = null;
        this.confirmCallback = null;
        this.categorias = [];
        
        this.init();
    }

    async init() {
        try {
            this.initializeEventListeners();
            await this.loadCategorias();
            await this.loadProductos();
        } catch (error) {
            console.error('Error inicializando productos:', error);
            utils.showAlert('Error al cargar datos iniciales', 'error');
        }
    }

    async loadCategorias() {
        try {
            const response = await categoriasService.getAll({ limit: 1000 });
            if (response.success) {
                this.categorias = response.data;
                this.populateCategoriaSelects();
            }
        } catch (error) {
            console.error('Error loading categorias:', error);
        }
    }

    populateCategoriaSelects() {
        const selects = document.querySelectorAll('select[name="categoria"], #categoriaFilter');
        selects.forEach(select => {
            if (select.id === 'categoriaFilter') {
                select.innerHTML = '<option value="">Todas las categorías</option>';
            } else {
                select.innerHTML = '<option value="">Seleccionar categoría</option>';
            }
            
            this.categorias.forEach(categoria => {
                select.innerHTML += `<option value="${categoria.id_categoria}">${categoria.nombre}</option>`;
            });
        });
    }

    initializeEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.loadProductos();
            }, 500));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoriaFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.currentPage = 1;
                this.loadProductos();
            });
        }

        // Buttons
        document.getElementById('btnNuevoProducto')?.addEventListener('click', () => this.showModal());
        document.getElementById('btnActualizar')?.addEventListener('click', () => this.loadProductos());
        
        // Modal events
        document.getElementById('btnCerrarModal')?.addEventListener('click', () => this.hideModal());
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.hideModal());
        document.getElementById('productoForm')?.addEventListener('submit', (e) => this.handleSubmit(e));

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

    async loadProductos() {
        try {
            this.showLoading(true);

            const params = {
                page: this.currentPage,
                limit: this.limit,
                search: this.currentSearch,
                categoria: this.currentCategory
            };

            const response = await productosService.getAll(params);

            if (response.success) {
                this.renderProductos(response.data);
                this.updatePagination(response.pagination);
            } else {
                utils.showAlert('Error al cargar productos', 'error');
            }
        } catch (error) {
            console.error('Error loading productos:', error);
            utils.showAlert('Error al conectar con el servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderProductos(productos) {
        const tbody = document.getElementById('productosTableBody');
        if (!tbody) return;

        if (productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-box text-4xl mb-4 block"></i>
                        ${this.hasActiveFilters() ? 
                            'No se encontraron productos con los filtros aplicados' : 
                            'No hay productos registrados'}
                        <div class="mt-2">
                            ${this.hasActiveFilters() ? 
                                '<button onclick="productosManager.clearFilters()" class="text-paint-blue hover:underline">Limpiar filtros</button>' :
                                '<button onclick="productosManager.showModal()" class="text-paint-blue hover:underline">Crear el primer producto</button>'}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = productos.map(producto => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div>
                        <div class="text-sm font-medium text-gray-900">
                            ${this.escapeHtml(producto.codigo)}
                        </div>
                        <div class="text-sm text-gray-500">
                            ID: ${producto.id_producto}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${this.escapeHtml(producto.nombre)}</div>
                    <div class="text-sm text-gray-500">${this.escapeHtml(producto.categoria_nombre || 'Sin categoría')}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">Q ${parseFloat(producto.precio_venta || 0).toFixed(2)}</div>
                    ${producto.porcentaje_descuento > 0 ? 
                        `<div class="text-sm text-green-600">${producto.porcentaje_descuento}% desc.</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${producto.stock_total || 0}</div>
                    <div class="text-sm text-gray-500">${producto.unidad || 'Unidad'}</div>
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="productosManager.viewProducto(${producto.id_producto})" 
                                class="text-paint-blue hover:text-blue-900" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="productosManager.editProducto(${producto.id_producto})" 
                                data-require-profile="Gerente,Digitador"
                                class="text-indigo-600 hover:text-indigo-900" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="productosManager.deleteProducto(${producto.id_producto})" 
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
        return this.currentSearch || this.currentCategory;
    }

    clearFilters() {
        this.currentSearch = '';
        this.currentCategory = '';
        this.currentPage = 1;
        
        document.getElementById('searchInput').value = '';
        document.getElementById('categoriaFilter').value = '';
        
        this.loadProductos();
    }

    updatePagination(pagination) {
        if (!pagination) return;

        document.getElementById('currentPage').textContent = pagination.currentPage;
        document.getElementById('totalPages').textContent = pagination.totalPages;

        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');

        if (btnPrev) btnPrev.disabled = !pagination.hasPrev;
        if (btnNext) btnNext.disabled = !pagination.hasNext;
    }

    changePage(page) {
        if (page >= 1) {
            this.currentPage = page;
            this.loadProductos();
        }
    }

    showModal(producto = null) {
        this.isEditing = !!producto;
        this.editingId = producto?.id_producto || null;

        const modal = document.getElementById('modalProducto');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productoForm');

        title.textContent = this.isEditing ? 'Editar Producto' : 'Nuevo Producto';
        
        if (this.isEditing && producto) {
            this.fillForm(producto);
        } else {
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modalProducto')?.classList.add('hidden');
        document.getElementById('productoForm')?.reset();
        this.isEditing = false;
        this.editingId = null;
    }

    fillForm(producto) {
        const form = document.getElementById('productoForm');
        if (!form) return;

        form.codigo.value = producto.codigo || '';
        form.nombre.value = producto.nombre || '';
        form.descripcion.value = producto.descripcion || '';
        form.categoria.value = producto.id_categoria || '';
        form.precio_venta.value = producto.precio_venta || '';
        form.precio_compra.value = producto.precio_compra || '';
        form.porcentaje_descuento.value = producto.porcentaje_descuento || '';
    }

    async handleSubmit(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const productoData = {
                codigo: formData.get('codigo').trim(),
                nombre: formData.get('nombre').trim(),
                descripcion: formData.get('descripcion').trim(),
                id_categoria: parseInt(formData.get('categoria')),
                precio_venta: parseFloat(formData.get('precio_venta')) || null,
                precio_compra: parseFloat(formData.get('precio_compra')) || null,
                porcentaje_descuento: parseFloat(formData.get('porcentaje_descuento')) || 0
            };

            // Validaciones
            if (!productoData.codigo || !productoData.nombre || !productoData.id_categoria) {
                utils.showAlert('Código, nombre y categoría son obligatorios', 'warning');
                return;
            }

            if (productoData.precio_venta && productoData.precio_venta <= 0) {
                utils.showAlert('El precio de venta debe ser mayor a 0', 'warning');
                return;
            }

            if (productoData.porcentaje_descuento < 0 || productoData.porcentaje_descuento > 100) {
                utils.showAlert('El descuento debe estar entre 0 y 100', 'warning');
                return;
            }

            let response;
            if (this.isEditing) {
                response = await productosService.update(this.editingId, productoData);
            } else {
                response = await productosService.create(productoData);
            }

            if (response.success) {
                utils.showAlert(
                    `Producto ${this.isEditing ? 'actualizado' : 'creado'} exitosamente`, 
                    'success'
                );
                this.hideModal();
                this.loadProductos();
            }
        } catch (error) {
            console.error('Error saving producto:', error);
            utils.showAlert(error.message || 'Error al guardar producto', 'error');
        }
    }

    async viewProducto(id) {
        try {
            const response = await productosService.getById(id);
            
            if (response.success) {
                this.showProductoDetails(response.data);
            }
        } catch (error) {
            console.error('Error loading producto:', error);
            utils.showAlert('Error al cargar información del producto', 'error');
        }
    }

    showProductoDetails(producto) {
        const detailsHTML = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" id="modalDetalles">
                <div class="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold">Detalles del Producto</h3>
                        <button onclick="this.closest('#modalDetalles').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Código</label>
                            <div class="text-gray-900">${producto.codigo}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <div class="text-gray-900">${producto.categoria_nombre || 'Sin categoría'}</div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <div class="text-gray-900">${producto.nombre}</div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <div class="text-gray-900">${producto.descripcion || 'Sin descripción'}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                            <div class="text-gray-900">Q ${parseFloat(producto.precio_venta || 0).toFixed(2)}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
                            <div class="text-gray-900">${producto.porcentaje_descuento || 0}%</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Total</label>
                            <div class="text-gray-900">${producto.stock_total || 0} ${producto.unidad || 'unidades'}</div>
                        </div>
                    </div>
                    
                    <div class="mt-8 flex justify-end space-x-3">
                        <button onclick="productosManager.editProducto(${producto.id_producto}); this.closest('#modalDetalles').remove()" 
                                class="bg-paint-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            Editar Producto
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

    async editProducto(id) {
        try {
            const response = await productosService.getById(id);
            
            if (response.success) {
                this.showModal(response.data);
            }
        } catch (error) {
            console.error('Error loading producto:', error);
            utils.showAlert('Error al cargar información del producto', 'error');
        }
    }

    deleteProducto(id) {
        this.showConfirmModal(
            '¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.',
            async () => {
                try {
                    const response = await productosService.delete(id);
                    
                    if (response.success) {
                        utils.showAlert('Producto eliminado exitosamente', 'success');
                        this.loadProductos();
                    }
                } catch (error) {
                    console.error('Error deleting producto:', error);
                    utils.showAlert('Error al eliminar producto', 'error');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.productosManager = new ProductosManager();
});

// Global functions
window.productosManager = window.productosManager || {};