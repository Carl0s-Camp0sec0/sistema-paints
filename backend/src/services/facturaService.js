// backend/src/services/facturaService.js

const FacturaRepository = require('../repositories/facturaRepository');
const ProductoRepository = require('../repositories/productoRepository');
const { executeTransaction } = require('../config/database');

class FacturaService {

  // Crear factura con sistema transaccional
  static async crearFactura(facturaData) {
    const { id_cliente, id_serie_factura, id_empleado, productos, mediosPago, observaciones } = facturaData;
    
    return executeTransaction(async (connection) => {
      try {
        // 1. Validar que el cliente existe
        const cliente = await FacturaRepository.obtenerClientePorId(id_cliente, connection);
        if (!cliente) {
          throw new Error('Cliente no encontrado');
        }

        // 2. Validar serie de factura
        const serie = await FacturaRepository.obtenerSeriePorId(id_serie_factura, connection);
        if (!serie) {
          throw new Error('Serie de factura no válida');
        }

        // 3. Generar número de factura usando procedimiento almacenado
        const numeroFactura = await FacturaRepository.generarNumeroFactura(id_serie_factura, connection);

        // 4. Validar stock y calcular totales
        let subtotal = 0;
        let descuentoTotal = 0;
        const productosValidados = [];

        for (const producto of productos) {
          // Validar que el producto existe y tiene precio
          const productoBD = await ProductoRepository.findById(producto.id_producto);
          if (!productoBD) {
            throw new Error(`Producto con ID ${producto.id_producto} no encontrado`);
          }

          // Validar stock disponible
          const stockDisponible = await FacturaRepository.verificarStock(
            producto.id_producto, 
            producto.cantidad, 
            connection
          );
          
          if (!stockDisponible.disponible) {
            throw new Error(`Stock insuficiente para ${productoBD.nombre}. Disponible: ${stockDisponible.stock_actual}, Requerido: ${producto.cantidad}`);
          }

          // Calcular valores
          const precio_unitario = productoBD.precio_actual || 0;
          const descuento_producto = (precio_unitario * (productoBD.porcentaje_descuento || 0)) / 100;
          const precio_con_descuento = precio_unitario - descuento_producto;
          const subtotal_producto = precio_con_descuento * producto.cantidad;

          productosValidados.push({
            ...producto,
            precio_unitario,
            descuento_unitario: descuento_producto,
            precio_con_descuento,
            subtotal_producto
          });

          subtotal += subtotal_producto;
          descuentoTotal += (descuento_producto * producto.cantidad);
        }

        // 5. Calcular IVA y total (12% IVA en Guatemala)
        const impuesto = subtotal * 0.12;
        const total = subtotal + impuesto;

        // 6. Validar medios de pago
        let totalPagos = 0;
        for (const pago of mediosPago) {
          if (!pago.id_tipo_pago || !pago.monto || pago.monto <= 0) {
            throw new Error('Datos de medio de pago inválidos');
          }
          totalPagos += parseFloat(pago.monto);
        }

        if (Math.abs(totalPagos - total) > 0.01) {
          throw new Error(`El total de pagos (${totalPagos.toFixed(2)}) no coincide con el total de la factura (${total.toFixed(2)})`);
        }

        // 7. Crear factura (usando nombres correctos de columnas)
        const facturaId = await FacturaRepository.crearFactura({
          id_cliente,
          id_serie: id_serie_factura, // Usar id_serie en lugar de id_serie_factura
          numero_factura: numeroFactura,
          id_empleado,
          subtotal,
          descuento_total: descuentoTotal,
          impuesto, // Usar impuesto en lugar de iva
          total,
          estado: 'Activa'
        }, connection);

        // 8. Crear detalle de factura
        for (const producto of productosValidados) {
          await FacturaRepository.crearDetalleFactura({
            id_factura: facturaId,
            id_producto: producto.id_producto,
            cantidad: producto.cantidad,
            precio_unitario: producto.precio_unitario,
            descuento_unitario: producto.descuento_unitario,
            subtotal: producto.subtotal_producto
          }, connection);
        }

        // 9. Crear medios de pago
        for (const pago of mediosPago) {
          await FacturaRepository.crearMedioPago({
            id_factura: facturaId,
            id_tipo_pago: pago.id_tipo_pago,
            monto: pago.monto,
            referencia: pago.referencia || null
          }, connection);
        }

        // 10. Actualizar stock usando trigger automático
        // (El trigger tr_actualizar_stock_venta se ejecutará automáticamente)

        // 11. Crear movimiento de inventario
        for (const producto of productosValidados) {
          await FacturaRepository.crearMovimientoInventario({
            id_producto: producto.id_producto,
            tipo_movimiento: 'Salida',
            cantidad: producto.cantidad,
            motivo: `Venta - Factura ${numeroFactura}`,
            id_empleado
          }, connection);
        }

        // 12. Retornar factura completa
        return await this.obtenerFacturaPorId(facturaId);

      } catch (error) {
        console.error('Error en transacción de factura:', error);
        throw error;
      }
    });
  }

  // Obtener facturas con filtros
  static async obtenerFacturas(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await FacturaRepository.obtenerFacturas({
        limit,
        offset,
        ...filters
      });

      const total = await FacturaRepository.contarFacturas(filters);
      
      return {
        facturas: result,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error en obtenerFacturas:', error);
      throw error;
    }
  }

  // Obtener factura por ID
  static async obtenerFacturaPorId(id) {
    try {
      const factura = await FacturaRepository.obtenerFacturaPorId(id);
      
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      return factura;
    } catch (error) {
      console.error('Error en obtenerFacturaPorId:', error);
      throw error;
    }
  }

  // Buscar factura por número
  static async buscarPorNumero(numeroFactura) {
    try {
      const factura = await FacturaRepository.buscarPorNumero(numeroFactura);
      
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      return factura;
    } catch (error) {
      console.error('Error en buscarPorNumero:', error);
      throw error;
    }
  }

  // Obtener detalle completo para impresión
  static async obtenerDetalleCompleto(id) {
    try {
      const factura = await FacturaRepository.obtenerDetalleCompleto(id);
      
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      return factura;
    } catch (error) {
      console.error('Error en obtenerDetalleCompleto:', error);
      throw error;
    }
  }

  // Anular factura
  static async anularFactura(id, motivoAnulacion, idEmpleado) {
    return executeTransaction(async (connection) => {
      try {
        // 1. Verificar que la factura existe y está activa
        const factura = await FacturaRepository.obtenerFacturaPorId(id, connection);
        if (!factura) {
          throw new Error('Factura no encontrada');
        }

        if (factura.estado === 'Anulada') {
          throw new Error('La factura ya está anulada');
        }

        // 2. Obtener productos de la factura para restaurar stock
        const detalles = await FacturaRepository.obtenerDetallesFactura(id, connection);

        // 3. Anular factura
        await FacturaRepository.anularFactura({
          id_factura: id,
          motivo_anulacion: motivoAnulacion,
          id_empleado_anulo: idEmpleado
        }, connection);

        // 4. Restaurar stock usando trigger
        // (El trigger tr_restaurar_stock_anulacion se ejecutará automáticamente)

        // 5. Crear movimientos de inventario de devolución
        for (const detalle of detalles) {
          await FacturaRepository.crearMovimientoInventario({
            id_producto: detalle.id_producto,
            tipo_movimiento: 'Entrada',
            cantidad: detalle.cantidad,
            motivo: `Anulación - Factura ${factura.numero_factura}`,
            id_empleado: idEmpleado
          }, connection);
        }

        return await this.obtenerFacturaPorId(id);

      } catch (error) {
        console.error('Error en anularFactura:', error);
        throw error;
      }
    });
  }

  // Obtener próximo número de factura
  static async obtenerProximoNumero(idSerie) {
    try {
      return await FacturaRepository.obtenerProximoNumero(idSerie);
    } catch (error) {
      console.error('Error en obtenerProximoNumero:', error);
      throw error;
    }
  }

  // Validar stock de productos
  static async validarStockProductos(productos) {
    try {
      const validaciones = [];
      let esValido = true;

      for (const producto of productos) {
        const stock = await FacturaRepository.verificarStock(producto.id_producto, producto.cantidad);
        validaciones.push({
          id_producto: producto.id_producto,
          cantidad_solicitada: producto.cantidad,
          stock_disponible: stock.stock_actual,
          es_valido: stock.disponible
        });

        if (!stock.disponible) {
          esValido = false;
        }
      }

      return {
        es_valido: esValido,
        productos: validaciones
      };
    } catch (error) {
      console.error('Error en validarStockProductos:', error);
      throw error;
    }
  }

  // Obtener tipos de pago
  static async obtenerTiposPago() {
    try {
      return await FacturaRepository.obtenerTiposPago();
    } catch (error) {
      console.error('Error en obtenerTiposPago:', error);
      throw error;
    }
  }

  // Obtener series de factura
  static async obtenerSeriesFactura() {
    try {
      return await FacturaRepository.obtenerSeriesFactura();
    } catch (error) {
      console.error('Error en obtenerSeriesFactura:', error);
      throw error;
    }
  }
}

module.exports = FacturaService;