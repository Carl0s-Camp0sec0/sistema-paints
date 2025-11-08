// frontend/assets/js/facturacion.js

class FacturacionManager {
    constructor() {
        this.clienteSeleccionado = null;
        this.productosFactura = [];
        this.mediosPagoFactura = [];
        this.tiposPago = [];
        this.productosDisponibles = [];
        this.clientesDisponibles = [];
        
        this.subtotal = 0;
        this.descuentoTotal = 0;
        this.iva = 0;
        this.total = 0;
        this.totalPagos = 0;
        
        this.init();
    }

    async init() {
        try {
            await this.cargarDatosIniciales();
            this.inicializarEventos();
            this.actualizarResumen();
        } catch (error) {
            console.error('Error inicializando facturación:', error);
            utils.showAlert('Error al cargar datos iniciales', 'error');
        }
    }

    async cargarDatosIniciales() {
        try {
            // Cargar tipos de pago
            const tiposPagoResponse = await api.get('/api/catalogos/tipos-pago');
            if (tiposPagoResponse.success) {
                this.tiposPago = tiposPagoResponse.data;
                this.poblarSelectTiposPago();
            }

            // Cargar productos para autocomplete
            const productosResponse = await api.get('/api/catalogos/productos-facturacion');
            if (productosResponse.success) {
                this.productosDisponibles = productosResponse.data;
            }

        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            throw error;
        }
    }

    poblarSelectTiposPago() {
        const select = document.getElementById('tipoPago');
        select.innerHTML = '<option value="">Seleccionar...</option>';
        
        this.tiposPago.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_pago;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });
    }

    inicializarEventos() {
        // Cliente search
        const clienteSearch = document.getElementById('clienteSearch');
        if (clienteSearch) {
            clienteSearch.addEventListener('input', this.debounce(this.buscarClientes.bind(this), 300));
            clienteSearch.addEventListener('focus', () => this.mostrarDropdownClientes());
            document.addEventListener('click', (e) => {
                if (!clienteSearch.contains(e.target)) {
                    this.ocultarDropdownClientes();
                }
            });
        }

        // Producto search
        const productoSearch = document.getElementById('productoSearch');
        if (productoSearch) {
            productoSearch.addEventListener('input', this.debounce(this.buscarProductos.bind(this), 300));
            productoSearch.addEventListener('focus', () => this.mostrarDropdownProductos());
            document.addEventListener('click', (e) => {
                if (!productoSearch.contains(e.target)) {
                    this.ocultarDropdownProductos();
                }
            });
        }

        // Cantidad input - agregar producto con Enter
        const cantidadInput = document.getElementById('cantidad');
        if (cantidadInput) {
            cantidadInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.agregarProducto();
                }
            });
        }

        // Botones principales
        document.getElementById('btnAgregarProducto')?.addEventListener('click', () => this.agregarProducto());
        document.getElementById('btnAgregarPago')?.addEventListener('click', () => this.agregarMedioPago());
        document.getElementById('btnCrearFactura')?.addEventListener('click', () => this.crearFactura());
        document.getElementById('btnValidarStock')?.addEventListener('click', () => this.validarStock());
        document.getElementById('btnLimpiarFactura')?.addEventListener('click', () => this.limpiarFactura());

        // Modal nuevo cliente
        document.getElementById('btnNuevoCliente')?.addEventListener('click', () => this.mostrarModalNuevoCliente());
        document.getElementById('btnCerrarModalCliente')?.addEventListener('click', () => this.ocultarModalNuevoCliente());
        document.getElementById('btnCancelarCliente')?.addEventListener('click', () => this.ocultarModalNuevoCliente());
        document.getElementById('formNuevoCliente')?.addEventListener('submit', (e) => this.guardarNuevoCliente(e));

        // Auto-completar monto de pago
        document.getElementById('tipoPago')?.addEventListener('change', () => this.autoCompletarMontoPago());
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

    async buscarClientes() {
        const searchTerm = document.getElementById('clienteSearch').value.trim();
        
        if (searchTerm.length < 2) {
            this.clientesDisponibles = [];
            this.renderDropdownClientes();
            return;
        }

        try {
            const response = await api.get(`/api/clientes/buscar/${encodeURIComponent(searchTerm)}`);
            if (response.success) {
                this.clientesDisponibles = response.data;
                this.renderDropdownClientes();
            }
        } catch (error) {
            console.error('Error buscando clientes:', error);
        }
    }

    renderDropdownClientes() {
        const dropdown = document.getElementById('clienteDropdown');
        if (!dropdown) return;

        if (this.clientesDisponibles.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-gray-500 text-sm">No se encontraron clientes</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = this.clientesDisponibles.map(cliente => `
            <div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 cliente-option" 
                 data-cliente='${JSON.stringify(cliente)}'>
                <div class="font-medium">${cliente.nombres} ${cliente.apellidos}</div>
                <div class="text-sm text-gray-600">
                    ${cliente.nit ? `NIT: ${cliente.nit}` : ''} 
                    ${cliente.telefono ? `| Tel: ${cliente.telefono}` : ''}
                </div>
            </div>
        `).join('');

        // Agregar event listeners
        dropdown.querySelectorAll('.cliente-option').forEach(option => {
            option.addEventListener('click', () => {
                const cliente = JSON.parse(option.dataset.cliente);
                this.seleccionarCliente(cliente);
            });
        });

        dropdown.classList.remove('hidden');
    }

    mostrarDropdownClientes() {
        if (this.clientesDisponibles.length > 0) {
            document.getElementById('clienteDropdown')?.classList.remove('hidden');
        }
    }

    ocultarDropdownClientes() {
        document.getElementById('clienteDropdown')?.classList.add('hidden');
    }

    seleccionarCliente(cliente) {
        this.clienteSeleccionado = cliente;
        
        // Llenar campo de búsqueda
        document.getElementById('clienteSearch').value = `${cliente.nombres} ${cliente.apellidos}`;
        
        // Mostrar información del cliente
        document.getElementById('clienteNombre').textContent = `${cliente.nombres} ${cliente.apellidos}`;
        document.getElementById('clienteNit').textContent = cliente.nit || 'N/A';
        document.getElementById('clienteTelefono').textContent = cliente.telefono || 'N/A';
        
        document.getElementById('clienteInfo').classList.remove('hidden');
        this.ocultarDropdownClientes();
        
        this.validarCreacionFactura();
    }

    async buscarProductos() {
        const searchTerm = document.getElementById('productoSearch').value.trim();
        
        if (searchTerm.length < 2) {
            this.renderDropdownProductos([]);
            return;
        }

        const productosFiltrados = this.productosDisponibles.filter(producto => 
            producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderDropdownProductos(productosFiltrados.slice(0, 10)); // Limitar a 10 resultados
    }

    renderDropdownProductos(productos) {
        const dropdown = document.querySelector('#productoDropdown > div');
        if (!dropdown) return;

        if (productos.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-gray-500 text-sm">No se encontraron productos</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = productos.map(producto => `
            <div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 producto-option" 
                 data-producto='${JSON.stringify(producto)}'>
                <div class="flex justify-between">
                    <div>
                        <div class="font-medium">${producto.codigo} - ${producto.nombre}</div>
                        <div class="text-sm text-gray-600">
                            Precio: Q ${parseFloat(producto.precio_venta).toFixed(2)} 
                            | Stock: ${producto.stock_total || 0}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">${producto.unidad}</div>
                        ${producto.porcentaje_descuento > 0 ? `<div class="text-xs text-green-600">-${producto.porcentaje_descuento}%</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Agregar event listeners
        dropdown.querySelectorAll('.producto-option').forEach(option => {
            option.addEventListener('click', () => {
                const producto = JSON.parse(option.dataset.producto);
                this.seleccionarProducto(producto);
            });
        });

        dropdown.classList.remove('hidden');
    }

    mostrarDropdownProductos() {
        const searchTerm = document.getElementById('productoSearch').value.trim();
        if (searchTerm.length >= 2) {
            this.buscarProductos();
        }
    }

    ocultarDropdownProductos() {
        const dropdown = document.querySelector('#productoDropdown > div');
        dropdown?.classList.add('hidden');
    }

    seleccionarProducto(producto) {
        document.getElementById('productoSearch').value = `${producto.codigo} - ${producto.nombre}`;
        this.productoSeleccionado = producto;
        this.ocultarDropdownProductos();
        
        // Focus en cantidad
        document.getElementById('cantidad').focus();
    }

    agregarProducto() {
        const producto = this.productoSeleccionado;
        const cantidadInput = document.getElementById('cantidad');
        const cantidad = parseFloat(cantidadInput.value);

        if (!producto) {
            utils.showAlert('Debe seleccionar un producto', 'warning');
            return;
        }

        if (!cantidad || cantidad <= 0) {
            utils.showAlert('Debe ingresar una cantidad válida', 'warning');
            cantidadInput.focus();
            return;
        }

        // Verificar si ya está en la lista
        const existente = this.productosFactura.find(p => p.id_producto === producto.id_producto);
        if (existente) {
            existente.cantidad += cantidad;
            existente.subtotal = this.calcularSubtotalProducto(existente);
        } else {
            const productoFactura = {
                id_producto: producto.id_producto,
                codigo: producto.codigo,
                nombre: producto.nombre,
                cantidad: cantidad,
                precio_unitario: parseFloat(producto.precio_venta),
                descuento_porcentaje: parseFloat(producto.porcentaje_descuento || 0),
                descuento_monto: 0,
                subtotal: 0
            };
            
            productoFactura.subtotal = this.calcularSubtotalProducto(productoFactura);
            this.productosFactura.push(productoFactura);
        }

        this.renderProductosFactura();
        this.actualizarResumen();
        this.limpiarSeleccionProducto();
        this.validarCreacionFactura();
    }

    calcularSubtotalProducto(producto) {
        const subtotalBruto = producto.cantidad * producto.precio_unitario;
        const descuento = (subtotalBruto * producto.descuento_porcentaje) / 100;
        producto.descuento_monto = descuento;
        return subtotalBruto - descuento;
    }

    renderProductosFactura() {
        const tbody = document.getElementById('productosFactura');
        const noProductos = document.getElementById('noProductos');

        if (this.productosFactura.length === 0) {
            noProductos?.classList.remove('hidden');
            return;
        }

        noProductos?.classList.add('hidden');

        tbody.innerHTML = this.productosFactura.map((producto, index) => `
            <tr>
                <td class="px-6 py-4">
                    <div>
                        <div class="font-medium text-gray-900">${producto.codigo}</div>
                        <div class="text-sm text-gray-500">${producto.nombre}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <input type="number" min="0.001" step="0.001" value="${producto.cantidad}"
                           class="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                           onchange="facturacionManager.actualizarCantidadProducto(${index}, this.value)">
                </td>
                <td class="px-6 py-4 text-sm">Q ${producto.precio_unitario.toFixed(2)}</td>
                <td class="px-6 py-4 text-sm">
                    ${producto.descuento_porcentaje > 0 ? 
                        `${producto.descuento_porcentaje}% (Q ${producto.descuento_monto.toFixed(2)})` : 
                        'Sin descuento'
                    }
                </td>
                <td class="px-6 py-4 text-sm font-medium">Q ${producto.subtotal.toFixed(2)}</td>
                <td class="px-6 py-4">
                    <button onclick="facturacionManager.eliminarProducto(${index})" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    actualizarCantidadProducto(index, nuevaCantidad) {
        const cantidad = parseFloat(nuevaCantidad);
        if (cantidad && cantidad > 0) {
            this.productosFactura[index].cantidad = cantidad;
            this.productosFactura[index].subtotal = this.calcularSubtotalProducto(this.productosFactura[index]);
            this.renderProductosFactura();
            this.actualizarResumen();
        }
    }

    eliminarProducto(index) {
        this.productosFactura.splice(index, 1);
        this.renderProductosFactura();
        this.actualizarResumen();
        this.validarCreacionFactura();
    }

    limpiarSeleccionProducto() {
        document.getElementById('productoSearch').value = '';
        document.getElementById('cantidad').value = '';
        this.productoSeleccionado = null;
    }

    agregarMedioPago() {
        const tipoPago = document.getElementById('tipoPago');
        const montoInput = document.getElementById('montoPago');
        const referenciaInput = document.getElementById('referenciaPago');

        const idTipoPago = parseInt(tipoPago.value);
        const monto = parseFloat(montoInput.value);
        const referencia = referenciaInput.value.trim();

        if (!idTipoPago) {
            utils.showAlert('Debe seleccionar un tipo de pago', 'warning');
            return;
        }

        if (!monto || monto <= 0) {
            utils.showAlert('Debe ingresar un monto válido', 'warning');
            montoInput.focus();
            return;
        }

        const tipoNombre = this.tiposPago.find(t => t.id_tipo_pago === idTipoPago)?.nombre || 'Desconocido';

        const medioPago = {
            id_tipo_pago: idTipoPago,
            tipo_nombre: tipoNombre,
            monto: monto,
            numero_referencia: referencia || null
        };

        this.mediosPagoFactura.push(medioPago);
        this.renderMediosPago();
        this.actualizarResumen();
        this.validarCreacionFactura();

        // Limpiar campos
        tipoPago.value = '';
        montoInput.value = '';
        referenciaInput.value = '';
    }

    renderMediosPago() {
        const lista = document.getElementById('listaMediosPago');
        if (!lista) return;

        if (this.mediosPagoFactura.length === 0) {
            lista.innerHTML = '<div class="text-gray-500 text-sm">No hay medios de pago agregados</div>';
            return;
        }

        lista.innerHTML = this.mediosPagoFactura.map((pago, index) => `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                    <div class="font-medium">${pago.tipo_nombre}</div>
                    <div class="text-sm text-gray-600">
                        ${pago.numero_referencia ? `Ref: ${pago.numero_referencia}` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="font-semibold">Q ${pago.monto.toFixed(2)}</span>
                    <button onclick="facturacionManager.eliminarMedioPago(${index})" 
                            class="text-red-600 hover:text-red-900 ml-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    eliminarMedioPago(index) {
        this.mediosPagoFactura.splice(index, 1);
        this.renderMediosPago();
        this.actualizarResumen();
        this.validarCreacionFactura();
    }

    autoCompletarMontoPago() {
        const pendiente = this.total - this.totalPagos;
        if (pendiente > 0) {
            document.getElementById('montoPago').value = pendiente.toFixed(2);
        }
    }

    actualizarResumen() {
        // Calcular totales
        this.subtotal = this.productosFactura.reduce((sum, producto) => sum + (producto.cantidad * producto.precio_unitario), 0);
        this.descuentoTotal = this.productosFactura.reduce((sum, producto) => sum + producto.descuento_monto, 0);
        this.iva = (this.subtotal - this.descuentoTotal) * 0.12; // IVA 12%
        this.total = this.subtotal - this.descuentoTotal + this.iva;
        this.totalPagos = this.mediosPagoFactura.reduce((sum, pago) => sum + pago.monto, 0);

        // Actualizar UI
        document.getElementById('subtotalFactura').textContent = `Q ${this.subtotal.toFixed(2)}`;
        document.getElementById('descuentoTotal').textContent = `Q ${this.descuentoTotal.toFixed(2)}`;
        document.getElementById('ivaFactura').textContent = `Q ${this.iva.toFixed(2)}`;
        document.getElementById('totalFactura').textContent = `Q ${this.total.toFixed(2)}`;
        document.getElementById('totalPagos').textContent = `Q ${this.totalPagos.toFixed(2)}`;
        document.getElementById('pendientePago').textContent = `Q ${(this.total - this.totalPagos).toFixed(2)}`;
    }

    validarCreacionFactura() {
        const btnCrear = document.getElementById('btnCrearFactura');
        if (!btnCrear) return;

        const esValida = this.clienteSeleccionado && 
                        this.productosFactura.length > 0 && 
                        Math.abs(this.total - this.totalPagos) < 0.01; // Tolerancia de 1 centavo

        btnCrear.disabled = !esValida;
        
        if (esValida) {
            btnCrear.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
        } else {
            btnCrear.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
        }
    }

    async validarStock() {
        try {
            const productos = this.productosFactura.map(p => ({
                id_producto: p.id_producto,
                cantidad: p.cantidad
            }));

            const response = await api.post('/api/facturas/validar-stock', { productos });
            
            if (response.success) {
                utils.showAlert('Stock validado correctamente', 'success');
            }
        } catch (error) {
            console.error('Error validando stock:', error);
            utils.showAlert(error.message || 'Error al validar stock', 'error');
        }
    }

    async crearFactura() {
        try {
            this.mostrarLoading(true);

            const datosFactura = {
                id_cliente: this.clienteSeleccionado.id_cliente,
                id_serie_factura: 1, // Por defecto serie A de sucursal 1
                productos: this.productosFactura,
                mediosPago: this.mediosPagoFactura,
                observaciones: document.getElementById('observaciones').value.trim() || null
            };

            const response = await api.post('/api/facturas', datosFactura);

            if (response.success) {
                utils.showAlert('Factura creada exitosamente', 'success');
                
                // Generar PDF
                this.generarPDFFactura(response.data);
                
                // Limpiar formulario después de 2 segundos
                setTimeout(() => {
                    this.limpiarFactura();
                }, 2000);
            }
        } catch (error) {
            console.error('Error creando factura:', error);
            utils.showAlert(error.message || 'Error al crear la factura', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }

    generarPDFFactura(datosFactura) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(37, 99, 235); // paint-blue
            doc.text('SISTEMA PAINTS', 20, 20);
            
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text('FACTURA', 20, 35);

            // Información de la factura
            doc.setFontSize(10);
            doc.text(`Número: ${datosFactura.numero_completo || 'TEMP-001'}`, 150, 25);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 32);
            doc.text(`Serie: ${datosFactura.serie || 'A'}`, 150, 39);

            // Información del cliente
            doc.setFontSize(12);
            doc.text('CLIENTE:', 20, 50);
            doc.setFontSize(10);
            doc.text(`${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`, 20, 57);
            doc.text(`NIT: ${this.clienteSeleccionado.nit || 'C/F'}`, 20, 64);
            if (this.clienteSeleccionado.telefono) {
                doc.text(`Teléfono: ${this.clienteSeleccionado.telefono}`, 20, 71);
            }

            // Tabla de productos
            const columns = ['Código', 'Producto', 'Cant.', 'Precio', 'Desc.', 'Subtotal'];
            const rows = this.productosFactura.map(p => [
                p.codigo,
                p.nombre,
                p.cantidad.toString(),
                `Q ${p.precio_unitario.toFixed(2)}`,
                p.descuento_porcentaje > 0 ? `${p.descuento_porcentaje}%` : '-',
                `Q ${p.subtotal.toFixed(2)}`
            ]);

            doc.autoTable({
                head: [columns],
                body: rows,
                startY: 85,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [37, 99, 235] }
            });

            // Totales
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text(`Subtotal: Q ${this.subtotal.toFixed(2)}`, 130, finalY);
            doc.text(`Descuento: Q ${this.descuentoTotal.toFixed(2)}`, 130, finalY + 7);
            doc.text(`IVA (12%): Q ${this.iva.toFixed(2)}`, 130, finalY + 14);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL: Q ${this.total.toFixed(2)}`, 130, finalY + 25);

            // Medios de pago
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('MEDIOS DE PAGO:', 20, finalY + 10);
            
            let yPos = finalY + 17;
            this.mediosPagoFactura.forEach(pago => {
                doc.text(`${pago.tipo_nombre}: Q ${pago.monto.toFixed(2)}`, 20, yPos);
                yPos += 7;
            });

            // Observaciones
            if (document.getElementById('observaciones').value.trim()) {
                doc.text('OBSERVACIONES:', 20, yPos + 10);
                doc.text(document.getElementById('observaciones').value.trim(), 20, yPos + 17);
            }

            // Guardar PDF
            const nombreArchivo = `factura_${datosFactura.numero_completo || new Date().getTime()}.pdf`;
            doc.save(nombreArchivo);

        } catch (error) {
            console.error('Error generando PDF:', error);
            utils.showAlert('Error al generar PDF, pero la factura fue creada', 'warning');
        }
    }

    limpiarFactura() {
        // Limpiar datos
        this.clienteSeleccionado = null;
        this.productosFactura = [];
        this.mediosPagoFactura = [];
        this.productoSeleccionado = null;

        // Limpiar UI
        document.getElementById('clienteSearch').value = '';
        document.getElementById('productoSearch').value = '';
        document.getElementById('cantidad').value = '';
        document.getElementById('observaciones').value = '';
        document.getElementById('tipoPago').value = '';
        document.getElementById('montoPago').value = '';
        document.getElementById('referenciaPago').value = '';

        // Ocultar info cliente
        document.getElementById('clienteInfo').classList.add('hidden');

        // Re-render
        this.renderProductosFactura();
        this.renderMediosPago();
        this.actualizarResumen();
        this.validarCreacionFactura();
    }

    // Modal nuevo cliente
    mostrarModalNuevoCliente() {
        document.getElementById('modalNuevoCliente')?.classList.remove('hidden');
    }

    ocultarModalNuevoCliente() {
        document.getElementById('modalNuevoCliente')?.classList.add('hidden');
        document.getElementById('formNuevoCliente')?.reset();
    }

    async guardarNuevoCliente(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const clienteData = {
                nombres: formData.get('nombres'),
                apellidos: formData.get('apellidos'),
                nit: formData.get('nit') || null,
                telefono: formData.get('telefono') || null,
                email: formData.get('email') || null,
                direccion: formData.get('direccion') || null,
                acepta_promociones: false
            };

            const response = await api.post('/api/clientes', clienteData);
            
            if (response.success) {
                utils.showAlert('Cliente creado exitosamente', 'success');
                this.seleccionarCliente(response.data);
                this.ocultarModalNuevoCliente();
            }
        } catch (error) {
            console.error('Error creando cliente:', error);
            utils.showAlert(error.message || 'Error al crear cliente', 'error');
        }
    }

    mostrarLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.facturacionManager = new FacturacionManager();
});

// Funciones globales para usar desde HTML
window.facturacionManager = window.facturacionManager || {};