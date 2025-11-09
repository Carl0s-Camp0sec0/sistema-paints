// backend/src/controllers/facturaController.js - CON GENERACIÓN PDF
const FacturaRepository = require('../repositories/facturaRepository');
const { responseSuccess, responseError } = require('../utils/responses');
const { generateFacturaPDF } = require('../utils/pdfGenerator');

class FacturaController {
  
  // Obtener todas las facturas con filtros
  static async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        cliente, 
        fecha_inicio,
        fecha_fin,
        estado = 'Activa',
        numero_factura
      } = req.query;

      const filters = {
        cliente: cliente ? parseInt(cliente) : null,
        fecha_inicio,
        fecha_fin,
        estado,
        numero_factura
      };

      const pagination = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100)
      };

      const result = await FacturaRepository.findAll(filters, pagination);

      return responseSuccess(res, 'Facturas obtenidas exitosamente', {
        facturas: result.facturas,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error en getAll facturas:', error);
      return responseError(res, 'Error al obtener facturas', 500);
    }
  }

  // Obtener factura por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de factura inválido', 400);
      }

      const factura = await FacturaRepository.findById(id);

      if (!factura) {
        return responseError(res, 'Factura no encontrada', 404);
      }

      return responseSuccess(res, 'Factura obtenida exitosamente', factura);

    } catch (error) {
      console.error('Error en getById factura:', error);
      return responseError(res, 'Error al obtener factura', 500);
    }
  }

  // Crear nueva factura
  static async create(req, res) {
    try {
      const {
        id_cliente,
        id_serie,
        productos, // Array de productos con cantidad
        medios_pago,
        observaciones
      } = req.body;

      // Validaciones básicas
      if (!id_cliente || !id_serie || !productos || !Array.isArray(productos) || productos.length === 0) {
        return responseError(res, 'Cliente, serie y productos son requeridos', 400);
      }

      if (!medios_pago || !Array.isArray(medios_pago) || medios_pago.length === 0) {
        return responseError(res, 'Debe especificar al menos un medio de pago', 400);
      }

      // Validar que los productos tengan la estructura correcta
      for (let producto of productos) {
        if (!producto.id_producto || !producto.cantidad || producto.cantidad <= 0) {
          return responseError(res, 'Todos los productos deben tener ID y cantidad válida', 400);
        }
      }

      // Crear la factura usando el repositorio
      const facturaData = {
        id_cliente: parseInt(id_cliente),
        id_serie: parseInt(id_serie),
        id_empleado: req.user.id, // Usuario autenticado
        productos,
        medios_pago,
        observaciones: observaciones?.trim()
      };

      const facturaId = await FacturaRepository.create(facturaData);
      const nuevaFactura = await FacturaRepository.findById(facturaId);

      return responseSuccess(res, 'Factura creada exitosamente', nuevaFactura, 201);

    } catch (error) {
      console.error('Error en create factura:', error);

      if (error.message.includes('Stock insuficiente')) {
        return responseError(res, error.message, 400);
      }

      if (error.message.includes('Producto no encontrado')) {
        return responseError(res, error.message, 400);
      }

      if (error.message.includes('Cliente no encontrado')) {
        return responseError(res, 'Cliente no encontrado', 400);
      }

      return responseError(res, 'Error al crear factura', 500);
    }
  }

  // Generar PDF de la factura
  static async generatePDF(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de factura inválido', 400);
      }

      // Obtener datos completos de la factura
      const factura = await FacturaRepository.findById(id);

      if (!factura) {
        return responseError(res, 'Factura no encontrada', 404);
      }

      // Generar el PDF
      const pdfBuffer = await generateFacturaPDF(factura);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Factura_${factura.numero_factura}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error en generatePDF factura:', error);
      return responseError(res, 'Error al generar PDF de la factura', 500);
    }
  }

  // Anular factura
  static async anular(req, res) {
    try {
      const { id } = req.params;
      const { motivo_anulacion } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de factura inválido', 400);
      }

      if (!motivo_anulacion || motivo_anulacion.trim().length < 5) {
        return responseError(res, 'Debe proporcionar un motivo de anulación válido (mínimo 5 caracteres)', 400);
      }

      // Verificar que la factura existe y está activa
      const factura = await FacturaRepository.findById(id);

      if (!factura) {
        return responseError(res, 'Factura no encontrada', 404);
      }

      if (factura.estado !== 'Activa') {
        return responseError(res, 'Solo se pueden anular facturas activas', 400);
      }

      // Anular la factura
      const anulada = await FacturaRepository.anular(id, motivo_anulacion.trim(), req.user.id);

      if (!anulada) {
        return responseError(res, 'Error al anular la factura', 500);
      }

      return responseSuccess(res, 'Factura anulada exitosamente');

    } catch (error) {
      console.error('Error en anular factura:', error);
      return responseError(res, 'Error al anular factura', 500);
    }
  }

  // Obtener estadísticas de facturas
  static async getStats(req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      const stats = await FacturaRepository.getStats(fecha_inicio, fecha_fin);

      return responseSuccess(res, 'Estadísticas obtenidas exitosamente', stats);

    } catch (error) {
      console.error('Error en getStats facturas:', error);
      return responseError(res, 'Error al obtener estadísticas', 500);
    }
  }

  // Obtener reporte de ventas
  static async getReporteVentas(req, res) {
    try {
      const { 
        fecha_inicio, 
        fecha_fin, 
        agrupacion = 'dia', // dia, semana, mes
        incluir_anuladas = false 
      } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return responseError(res, 'Fecha de inicio y fin son requeridas', 400);
      }

      const reporte = await FacturaRepository.getReporteVentas({
        fecha_inicio,
        fecha_fin,
        agrupacion,
        incluir_anuladas: incluir_anuladas === 'true'
      });

      return responseSuccess(res, 'Reporte de ventas obtenido exitosamente', reporte);

    } catch (error) {
      console.error('Error en getReporteVentas:', error);
      return responseError(res, 'Error al obtener reporte de ventas', 500);
    }
  }

  // Buscar facturas por número
  static async buscarPorNumero(req, res) {
    try {
      const { numero } = req.query;

      if (!numero || numero.trim().length < 3) {
        return responseError(res, 'Debe proporcionar al menos 3 caracteres para buscar', 400);
      }

      const facturas = await FacturaRepository.buscarPorNumero(numero.trim());

      return responseSuccess(res, 'Búsqueda completada exitosamente', facturas);

    } catch (error) {
      console.error('Error en buscarPorNumero facturas:', error);
      return responseError(res, 'Error al buscar facturas', 500);
    }
  }
}

module.exports = FacturaController;