// backend/src/services/facturaService.js

const FacturaRepository = require('../repositories/facturaRepository');
const { executeQuery } = require('../config/database');

class FacturaService {

  // Obtener facturas con filtros y paginación
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
          itemsPerPage: limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error en obtenerFacturas:', error);
      throw new Error('Error al obtener facturas');
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

  // Obtener próximo número de factura
  static async obtenerProximoNumero(idSerie) {
    try {
      return await FacturaRepository.obtenerProximoNumero(idSerie);
    } catch (error) {
      console.error('Error en obtenerProximoNumero:', error);
      throw new Error('Error al obtener próximo número de factura');
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
      throw new Error('Error al validar stock de productos');
    }
  }

  // Obtener tipos de pago
  static async obtenerTiposPago() {
    try {
      return await FacturaRepository.obtenerTiposPago();
    } catch (error) {
      console.error('Error en obtenerTiposPago:', error);
      throw new Error('Error al obtener tipos de pago');
    }
  }

  // Obtener series de factura
  static async obtenerSeriesFactura() {
    try {
      return await FacturaRepository.obtenerSeriesFactura();
    } catch (error) {
      console.error('Error en obtenerSeriesFactura:', error);
      throw new Error('Error al obtener series de factura');
    }
  }

  // Crear factura (implementación básica)
  static async crearFactura(facturaData) {
    try {
      // Esta es una implementación básica
      // En la implementación completa sería con transacciones
      
      const { id_cliente, productos, mediosPago } = facturaData;
      
      // Validar que el cliente existe
      const clienteExiste = await executeQuery(
        'SELECT id_cliente FROM clientes WHERE id_cliente = ? AND estado = 1',
        [id_cliente]
      );
      
      if (clienteExiste.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      // Validar stock de productos
      const validacionStock = await this.validarStockProductos(productos);
      if (!validacionStock.es_valido) {
        throw new Error('Stock insuficiente para algunos productos');
      }

      // Por ahora retornamos un objeto simulado
      // En la implementación completa se crearía la factura real
      return {
        id_factura: Date.now(), // ID temporal
        numero_factura: `F-${Date.now()}`,
        mensaje: 'Factura creada exitosamente (implementación básica)',
        ...facturaData
      };
      
    } catch (error) {
      console.error('Error en crearFactura:', error);
      throw error;
    }
  }

  // Anular factura (implementación básica para Fase 3)
  static async anularFactura(id, motivoAnulacion, idEmpleado) {
    try {
      // Verificar que la factura existe
      const factura = await this.obtenerFacturaPorId(id);
      
      if (factura.estado === 'Anulada') {
        throw new Error('La factura ya está anulada');
      }

      // Por ahora solo simularemos la anulación
      // En la implementación completa se haría con transacciones
      await executeQuery(
        'UPDATE facturas SET estado = ?, fecha_anulacion = NOW(), motivo_anulacion = ?, id_empleado_anulo = ? WHERE id_factura = ?',
        ['Anulada', motivoAnulacion, idEmpleado, id]
      );

      return await this.obtenerFacturaPorId(id);
      
    } catch (error) {
      console.error('Error en anularFactura:', error);
      throw error;
    }
  }
}

module.exports = FacturaService;