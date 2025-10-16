// frontend/assets/js/productos.js

class ProductosManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.currentSearch = '';
        this.currentCategoria = '';
        this.isEditing = false;
        this.editingId = null;
        
        this.initializeEventListeners();
        this.loadSelectData();
        this.loadProductos();
    }

    initializeEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.loadProductos();
            }, 500));
        }

        // Category filter
        const categoriaFilter = document.getElementById('categoriaFilter');
        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', (e) => {
                this.currentCategoria = e.target.value;
                this.currentPage = 1;
                this.loadProductos();
            });
        }

        // Form submission
        const form = document.getElementById('productoForm');
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

    async loadSelectData() {
        try {
            // Cargar categorías
            const categoriasResponse = await categoriasService.getForSelect();
            if (categoriasResponse.success) {
                this.populateSelect('categoriaFilter', categoriasResponse.data, 'id_categoria', 'nombre', 'Todas las categorías');
                this.populateSelect('id_categoria', categoriasResponse.data, 'id_categoria', 'nombre', 'Seleccionar categoría');
            }

            // Cargar colores (simular el servicio de colores)
            const colores = [
                { id_color: 1, nombre: 'Blanco' },
                { id_color: 2, nombre: 'Negro' },
                { id_color: 3, nombre: 'Rojo' },
                { id_color: 4, nombre: 'Azul' },
                { id_color: 5, nombre: 'Verde' },
                { id_color: 6, nombre: 'Amarillo' },
                { id_color: 7, nombre: 'Gris' },
                { id_color: 8, nombre: 'Café' },
                { id_color: 9, nombre: 'Naranja' },
                { id_color: 10, nombre: 'Morado' }
            ];
            this.populateSelect('id_color', colores, 'id_color', 'nombre', 'Sin color específico');

        } catch (error) {
            console.error('Error cargando datos para selects:', error);
        }
    }

    populateSelect(selectId, data, valueField, textField, defaultText = '') {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = defaultText ? `<option value="">${defaultText}</option>` : '';
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            select.appendChild(option);
        });
    }

    async loadProductos() {
        try {
            this.showLoading(true);

            const params = {
                page: this.currentPage,
                limit: this.limit,
                search: this.currentSearch,
                categoria: this.currentCategoria
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
                        <i class="fas fa-boxes text-4xl mb-4 block"></i>
                        ${this.currentSearch || this.currentCategoria ? 'No se encontraron productos' : 'No hay productos registrados'}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = productos.map(producto => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-paint-orange bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-box text-paint-orange"></i>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(producto.nombre)}</div>
                            <div class="text-sm text-gray-500">${this.escapeHtml(producto.codigo)}</div>
                            ${producto.color ? `<div class="text-xs text-gray-400">${this.escapeHtml(producto.color)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${this.escapeHtml(producto.categoria || 'Sin categoría')}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${producto.precio_venta ? utils.formatCurrency(producto.precio_final || producto.precio_venta) : 'No definido'}
                    </div>
                    ${producto.porcentaje_descuento > 0 ? `
                        <div class="text-xs text-green-600">
                            ${producto.porcentaje_descuento}% descuento
                        </div>
                    ` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${producto.stock_total || 0} ${this.escapeHtml(producto.unidad_abrev || '')}
                    </div>
                    <div class="text-xs ${this.getStockColor(producto.stock_total, producto.stock_minimo)}">
                        Mín: ${producto.stock_minimo || 0}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="productosManager.editProducto(${producto.id_producto})" 
                            data-require-profile="Gerente,Digitador"
                            class="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="productosManager.deleteProducto(${producto.id_producto})" 
                            data-require-profile="Gerente"
                            class="text-red-600 hover:text-red-900" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStockColor(stockActual, stockMinimo) {
        if (stockActual <= stockMinimo) return 'text-red-600';
        if (stockActual <= stockMinimo * 2) return 'text-yellow-600';
        return 'text-green-600';
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
        
        document.getElementById('modalTitle').textContent = 'Nuevo Producto';
        document.getElementById('submitBtnText').textContent = 'Crear';
        
        this.clearForm();
        this.showModal();
    }

    async editProducto(id) {
        try {
            this.isEditing = true;
            this.editingId = id;
            
            const response = await productosService.getById(id);
            
            if (response.success) {
                const producto = response.data;
                
                document.getElementById('modalTitle').textContent = 'Editar Producto';
                document.getElementById('submitBtnText').textContent = 'Actualizar';
                
                // Fill form with data
                document.getElementById('productoId').value = producto.id_producto;
                document.getElementById('codigo').value = producto.codigo;
                document.getElementById('nombre').value = producto.nombre;
                document.getElementById('descripcion').value = producto.descripcion || '';
                document.getElementById('id_categoria').value = producto.id_categoria || '';
                document.getElementById('id_unidad').value = producto.id_unidad || '';
                document.getElementById('id_color').value = producto.id_color || '';
                document.getElementById('porcentaje_descuento').value = producto.porcentaje_descuento || 0;
                document.getElementById('stock_minimo').value = producto.stock_minimo || 10;
                document.getElementById('tiempo_duracion_anos').value = producto.tiempo_duracion_anos || '';
                document.getElementById('extension_cobertura_m2').value = producto.extension_cobertura_m2 || '';
                document.getElementById('precio_venta').value = producto.precio_venta || '';
                document.getElementById('precio_compra').value = producto.precio_compra || '';
                
                this.showModal();
            } else {
                utils.showAlert('Error al cargar datos del producto', 'error');
            }
        } catch (error) {
            console.error('Error loading producto:', error);
            utils.showAlert('Error al cargar datos del producto', 'error');
        }
    }

    async deleteProducto(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            return;
        }

        try {
            const response = await productosService.delete(id);
            
            if (response.success) {
                utils.showAlert('Producto eliminado exitosamente', 'success');
                this.loadProductos();
            } else {
                utils.showAlert('Error al eliminar producto', 'error');
            }
        } catch (error) {
            console.error('Error deleting producto:', error);
            utils.showAlert('Error al eliminar producto', 'error');
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {
            codigo: formData.get('codigo').trim(),
            nombre: formData.get('nombre').trim(),
            descripcion: formData.get('descripcion')?.trim() || null,
            id_categoria: parseInt(formData.get('id_categoria')),
            id_unidad: parseInt(formData.get('id_unidad')),
            id_color: formData.get('id_color') ? parseInt(formData.get('id_color')) : null,
            porcentaje_descuento: parseFloat(formData.get('porcentaje_descuento')) || 0,
            stock_minimo: parseInt(formData.get('stock_minimo')) || 10,
            tiempo_duracion_anos: formData.get('tiempo_duracion_anos') ? parseInt(formData.get('tiempo_duracion_anos')) : null,
            extension_cobertura_m2: formData.get('extension_cobertura_m2') ? parseFloat(formData.get('extension_cobertura_m2')) : null,
            precio_venta: formData.get('precio_venta') ? parseFloat(formData.get('precio_venta')) : null,
            precio_compra: formData.get('precio_compra') ? parseFloat(formData.get('precio_compra')) : null,
            id_empleado_modifico: window.authManager?.getCurrentUser()?.id_empleado || null
        };

        // Basic validation
        if (!data.codigo || !data.nombre || !data.id_categoria || !data.id_unidad) {
            utils.showAlert('Por favor, completa todos los campos requeridos', 'error');
            return;
        }

        try {
            let response;
            
            if (this.isEditing) {
                response = await productosService.update(this.editingId, data);
            } else {
                response = await productosService.create(data);
            }

            if (response.success) {
                const action = this.isEditing ? 'actualizado' : 'creado';
                utils.showAlert(`Producto ${action} exitosamente`, 'success');
                
                this.closeModal();
                this.loadProductos();
            } else {
                utils.showAlert('Error al guardar producto', 'error');
            }
        } catch (error) {
            console.error('Error saving producto:', error);
            let errorMessage = 'Error al guardar producto';
            
            if (error.message.includes('Ya existe')) {
                errorMessage = 'Ya existe un producto con este código';
            } else if (error.message.includes('requerido') || error.message.includes('inválido')) {
                errorMessage = error.message;
            }
            
            utils.showAlert(errorMessage, 'error');
        }
    }

    showModal() {
        const modal = document.getElementById('productoModal');
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
        const modal = document.getElementById('productoModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.clearForm();
    }

    clearForm() {
        const form = document.getElementById('productoForm');
        if (form) {
            form.reset();
            document.getElementById('productoId').value = '';
            // Reset default values
            document.getElementById('porcentaje_descuento').value = 0;
            document.getElementById('stock_minimo').value = 10;
        }
    }

    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1) {
            this.currentPage = newPage;
            this.loadProductos();
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
let productosManager;

function showCreateModal() {
    if (productosManager) {
        productosManager.showCreateModal();
    }
}

function closeModal() {
    if (productosManager) {
        productosManager.closeModal();
    }
}

function changePage(direction) {
    if (productosManager) {
        productosManager.changePage(direction);
    }
}

function loadProductos() {
    if (productosManager) {
        productosManager.loadProductos();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.authManager && window.authManager.isLoggedIn()) {
        productosManager = new ProductosManager();
    }
});