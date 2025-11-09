// backend/src/repositories/facturaRepository.js - BÁSICO PARA TU PROYECTO ACTUAL
const { executeQuery, getConnection } = require('../config/database');

class FacturaRepository {
  
  // Obtener todas las facturas con filtros básicos
  static async findAll(filters = {}, pagination = { page: 1, limit: 10 }) {
    try {
      const { cliente, fecha_inicio, fecha_fin, estado, numero_factura } = filters;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let baseQuery = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_emision,
          f.subtotal,
          f.total,
          f.estado,
          f.observaciones,
          CONCAT(IFNULL(c.nombres, ''), ' ', IFNULL(c.apellidos, '')) as cliente_nombre,
          c.nit as cliente_nit
        FROM facturas f
        LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
        WHERE 1=1
      `;

      const queryParams = [];
      let whereConditions = '';

      // Filtros básicos
      if (estado) {
        whereConditions += ` AND f.estado = ?`;
        queryParams.push(estado);
      }

      if (numero_factura) {
        whereConditions += ` AND f.numero_factura LIKE ?`;
        queryParams.push(`%${numero_factura}%`);
      }

      baseQuery += whereConditions;
      baseQuery += ` ORDER BY f.fecha_emision DESC LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      const facturas = await executeQuery(baseQuery, queryParams);

      return {
        facturas,
        pagination: {
          page,
          limit,
          total: facturas.length,
          totalPages: Math.ceil(facturas.length / limit),
          hasNext: false,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Error en FacturaRepository.findAll:', error);
      throw error;
    }
  }

  // Buscar factura por ID
  static async findById(id) {
    try {
      const facturaQuery = `
        SELECT 
          f.*,
          CONCAT(IFNULL(c.nombres, ''), ' ', IFNULL(c.apellidos, '')) as cliente_nombre,
          c.nombres as cliente_nombres,
          c.apellidos as cliente_apellidos,
          c.nit as cliente_nit,
          c.telefono as cliente_telefono,
          c.direccion as cliente_direccion
        FROM facturas f
        LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
        WHERE f.id_factura = ?
      `;

      const facturas = await executeQuery(facturaQuery, [id]);

      if (facturas.length === 0) {
        return null;
      }

      // Por ahora retornamos solo la factura básica
      // Se puede expandir después para incluir productos y medios de pago
      return facturas[0];

    } catch (error) {
      console.error('Error en FacturaRepository.findById:', error);
      throw error;
    }
  }

  // Crear nueva factura (versión básica)
  static async create(facturaData) {
    try {
      // Por ahora, una implementación básica
      // Se puede expandir después para manejar transacciones completas
      
      const query = `
        INSERT INTO facturas (
          numero_factura, id_serie, id_cliente, id_empleado,
          fecha_emision, subtotal, total, estado, observaciones
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, 'Activa', ?)
      `;

      // Generar un número de factura simple por ahora
      const numeroFactura = `F${Date.now()}`;

      const params = [
        numeroFactura,
        facturaData.id_serie,
        facturaData.id_cliente,
        facturaData.id_empleado,
        0, // subtotal temporal
        0, // total temporal
        facturaData.observaciones
      ];

      const result = await executeQuery(query, params);
      return result.insertId;

    } catch (error) {
      console.error('Error en FacturaRepository.create:', error);
      throw error;
    }
  }

  // Anular factura
  static async anular(id, motivo, empleadoId) {
    try {
      const query = `
        UPDATE facturas 
        SET estado = 'Anulada', 
            fecha_anulacion = NOW(), 
            motivo_anulacion = ?
        WHERE id_factura = ?
      `;

      const result = await executeQuery(query, [motivo, id]);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error en FacturaRepository.anular:', error);
      throw error;
    }
  }

  // Validar stock (versión básica)
  static async validarStock(productos) {
    try {
      const validaciones = [];
      
      for (let producto of productos) {
        const query = `
          SELECT p.nombre, p.stock_actual 
          FROM productos p 
          WHERE p.id_producto = ?
        `;
        
        const result = await executeQuery(query, [producto.id_producto]);
        
        if (result.length > 0) {
          const prod = result[0];
          validaciones.push({
            id_producto: producto.id_producto,
            nombre: prod.nombre,
            cantidad_solicitada: producto.cantidad,
            stock_actual: prod.stock_actual,
            disponible: prod.stock_actual >= producto.cantidad
          });
        }
      }

      return validaciones;

    } catch (error) {
      console.error('Error en FacturaRepository.validarStock:', error);
      throw error;
    }
  }

  // Buscar facturas por número
  static async buscarPorNumero(numero) {
    try {
      const query = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_emision,
          f.total,
          f.estado,
          CONCAT(IFNULL(c.nombres, ''), ' ', IFNULL(c.apellidos, '')) as cliente_nombre
        FROM facturas f
        LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
        WHERE f.numero_factura LIKE ?
        ORDER BY f.fecha_emision DESC
        LIMIT 20
      `;

      const facturas = await executeQuery(query, [`%${numero}%`]);
      return facturas;

    } catch (error) {
      console.error('Error en FacturaRepository.buscarPorNumero:', error);
      throw error;
    }
  }

  // Obtener próximo número de factura
  static async obtenerProximoNumero(id_serie) {
    try {
      const query = `
        SELECT correlativo_actual, prefijo 
        FROM series_facturas 
        WHERE id_serie = ?
      `;

      const result = await executeQuery(query, [id_serie]);
      
      if (result.length === 0) {
        throw new Error('Serie no encontrada');
      }

      const serie = result[0];
      const siguienteNumero = serie.correlativo_actual + 1;
      const numeroCompleto = `${serie.prefijo}${siguienteNumero.toString().padStart(8, '0')}`;

      return numeroCompleto;

    } catch (error) {
      console.error('Error en FacturaRepository.obtenerProximoNumero:', error);
      throw error;
    }
  }

  // Obtener estadísticas básicas
  static async getStats(fechaInicio = null, fechaFin = null) {
    try {
      let whereCondition = "WHERE f.estado = 'Activa'";
      const params = [];

      if (fechaInicio) {
        whereCondition += " AND DATE(f.fecha_emision) >= ?";
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereCondition += " AND DATE(f.fecha_emision) <= ?";
        params.push(fechaFin);
      }

      const query = `
        SELECT 
          COUNT(*) as total_facturas,
          COALESCE(SUM(f.total), 0) as total_ventas,
          COALESCE(AVG(f.total), 0) as promedio_venta,
          COALESCE(MAX(f.total), 0) as venta_mayor
        FROM facturas f
        ${whereCondition}
      `;

      const stats = await executeQuery(query, params);
      return stats[0];

    } catch (error) {
      console.error('Error en FacturaRepository.getStats:', error);
      throw error;
    }
  }
}

module.exports = FacturaRepository;