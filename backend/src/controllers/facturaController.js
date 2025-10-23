// backend/src/controllers/facturaController.js

const FacturaService = require('../services/facturaService');
const { responseSuccess, responseError } = require('../utils/responses');

class FacturaController {
  
  // Crear nueva factura con transacción
  static async crearFactura(req, res) {
    try {
      const { 
        id_cliente, 
        id_serie_factura, 
        productos, 
        mediosPago,
        observaciones 
      } = req.body;

      // Validaciones básicas
      if (!id_cliente || !productos || !Array.isArray(productos) || productos.length === 0) {
        return responseError(res, 'Datos de factura incompletos', 400);
      }

      if (!mediosPago || !Array.isArray(mediosPago) || mediosPago.length === 0) {
        return responseError(res, 'Debe especificar al menos un medio de pago', 400);
      }

      // Obtener usuario del token
      const id_empleado = req.user.id_usuario;

      const facturaData = {
        id_cliente,
        id_serie_factura,
        id_empleado,
        productos,
        mediosPago,
        observaciones
      };

      const factura = await FacturaService.crearFactura(facturaData);

      return responseSuccess(res, 'Factura creada exitosamente', factura, 201);
    } catch (error) {
      console.error('Error en crearFactura:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener facturas con paginación
  static async obtenerFacturas(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        fecha_inicio,
        fecha_fin,
        id_empleado,
        estado
      } = req.query;

      const filters = {
        search: search.trim(),
        fecha_inicio,
        fecha_fin,
        id_empleado,
        estado
      };

      const result = await FacturaService.obtenerFacturas(
        parseInt(page), 
        parseInt(limit), 
        filters
      );

      return responseSuccess(res, 'Facturas obtenidas exitosamente', result);
    } catch (error) {
      console.error('Error en obtenerFacturas:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener factura por ID
  static async obtenerFacturaPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de factura inválido', 400);
      }

      const factura = await FacturaService.obtenerFacturaPorId(parseInt(id));

      return responseSuccess(res, 'Factura obtenida exitosamente', factura);
    } catch (error) {
      console.error('Error en obtenerFacturaPorId:', error);
      if (error.message === 'Factura no encontrada') {
        return responseError(res, error.message, 404);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Buscar factura por número
  static async buscarPorNumero(req, res) {
    try {
      const { numero_factura } = req.params;

      if (!numero_factura) {
        return responseError(res, 'Número de factura requerido', 400);
      }

      const factura = await FacturaService.buscarPorNumero(numero_factura);

      return responseSuccess(res, 'Factura encontrada', factura);
    } catch (error) {
      console.error('Error en buscarPorNumero:', error);
      if (error.message === 'Factura no encontrada') {
        return responseError(res, error.message, 404);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener detalle completo de factura para impresión
  static async obtenerDetalleParaImpresion(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de factura inválido', 400);
      }

      const detalle = await FacturaService.obtenerDetalleCompleto(parseInt(id));

      return responseSuccess(res, 'Detalle de factura obtenido', detalle);
    } catch (error) {
      console.error('Error en obtenerDetalleParaImpresion:', error);
      if (error.message === 'Factura no encontrada') {
        return responseError(res, error.message, 404);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Anular factura (para Fase 3)
  static async anularFactura(req, res) {
    try {
      const { id } = req.params;
      const { motivo_anulacion } = req.body;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de factura inválido', 400);
      }

      if (!motivo_anulacion || motivo_anulacion.trim().length === 0) {
        return responseError(res, 'Motivo de anulación requerido', 400);
      }

      const id_empleado = req.user.id_usuario;

      const facturaAnulada = await FacturaService.anularFactura(
        parseInt(id), 
        motivo_anulacion.trim(),
        id_empleado
      );

      return responseSuccess(res, 'Factura anulada exitosamente', facturaAnulada);
    } catch (error) {
      console.error('Error en anularFactura:', error);
      if (error.message === 'Factura no encontrada' || error.message === 'La factura ya está anulada') {
        return responseError(res, error.message, 400);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener próximo número de factura
  static async obtenerProximoNumero(req, res) {
    try {
      const { id_serie } = req.params;

      if (!id_serie || isNaN(id_serie)) {
        return responseError(res, 'ID de serie requerido', 400);
      }

      const proximoNumero = await FacturaService.obtenerProximoNumero(parseInt(id_serie));

      return responseSuccess(res, 'Próximo número obtenido', { numero_factura: proximoNumero });
    } catch (error) {
      console.error('Error en obtenerProximoNumero:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Validar stock antes de facturar
  static async validarStock(req, res) {
    try {
      const { productos } = req.body;

      if (!productos || !Array.isArray(productos)) {
        return responseError(res, 'Lista de productos requerida', 400);
      }

      const validacion = await FacturaService.validarStockProductos(productos);

      return responseSuccess(res, 'Validación de stock completada', validacion);
    } catch (error) {
      console.error('Error en validarStock:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
}

module.exports = FacturaController;