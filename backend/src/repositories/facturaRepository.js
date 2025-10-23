// backend/src/repositories/facturaRepository.js

const { executeQuery } = require('../config/database');

class FacturaRepository {

  // Obtener tipos de pago
  static async obtenerTiposPago() {
    try {
      const sql = `
        SELECT id_tipo_pago, nombre, descripcion, estado
        FROM tipos_pago 
        WHERE estado = 1
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en obtenerTiposPago:', error);
      throw error;
    }
  }

  // Obtener series de factura
  static async obtenerSeriesFactura() {
    try {
      const sql = `
        SELECT id_serie, letra_serie, descripcion, estado
        FROM series_facturas 
        WHERE estado = 1
        ORDER BY letra_serie ASC
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en obtenerSeriesFactura:', error);
      throw error;
    }
  }

  // Verificar stock disponible
  static async verificarStock(idProducto, cantidadRequerida, connection = null) {
    try {
      const sql = `
        SELECT 
          p.nombre as producto,
          COALESCE(SUM(sb.cantidad_actual), 0) as stock_actual,
          ? as cantidad_requerida,
          CASE 
            WHEN COALESCE(SUM(sb.cantidad_actual), 0) >= ? THEN TRUE 
            ELSE FALSE 
          END as disponible
        FROM productos p
        LEFT JOIN stock_bodega sb ON p.id_producto = sb.id_producto
        WHERE p.id_producto = ? AND p.estado = 1
        GROUP BY p.id_producto
      `;
      
      const result = await executeQuery(sql, [cantidadRequerida, cantidadRequerida, idProducto], connection);
      
      if (result.length === 0) {
        return {
          producto: 'Producto no encontrado',
          stock_actual: 0,
          cantidad_requerida: cantidadRequerida,
          disponible: false
        };
      }
      
      return result[0];
    } catch (error) {
      console.error('Error en verificarStock:', error);
      throw error;
    }
  }

  // Obtener próximo número de factura
  static async obtenerProximoNumero(idSerie) {
    try {
      const sql = `
        SELECT 
          COALESCE(MAX(CAST(numero_factura AS UNSIGNED)), 0) + 1 as proximo_numero
        FROM facturas 
        WHERE id_serie_factura = ?
      `;
      
      const result = await executeQuery(sql, [idSerie]);
      return result[0]?.proximo_numero || 1;
    } catch (error) {
      console.error('Error en obtenerProximoNumero:', error);
      throw error;
    }
  }

  // Obtener facturas con paginación
  static async obtenerFacturas(params) {
    try {
      let sql = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_factura,
          f.total_factura,
          f.estado,
          CONCAT(c.nombre_completo) as cliente,
          c.nit,
          CONCAT(u.nombres, ' ', u.apellidos) as empleado
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN usuarios u ON f.id_empleado = u.id_usuario
        WHERE 1=1
      `;

      const sqlParams = [];

      // Filtros de búsqueda
      if (params.search && params.search.trim()) {
        sql += ` AND (
          f.numero_factura LIKE ? OR
          c.nombre_completo LIKE ? OR
          c.nit LIKE ?
        )`;
        const searchTerm = `%${params.search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Filtros de fecha
      if (params.fecha_inicio) {
        sql += ` AND f.fecha_factura >= ?`;
        sqlParams.push(params.fecha_inicio);
      }

      if (params.fecha_fin) {
        sql += ` AND f.fecha_factura <= ?`;
        sqlParams.push(params.fecha_fin);
      }

      // Filtro por empleado
      if (params.id_empleado) {
        sql += ` AND f.id_empleado = ?`;
        sqlParams.push(params.id_empleado);
      }

      // Filtro por estado
      if (params.estado) {
        sql += ` AND f.estado = ?`;
        sqlParams.push(params.estado);
      }

      sql += ` ORDER BY f.fecha_factura DESC`;

      // Paginación
      if (params.limit && params.offset !== undefined) {
        sql += ` LIMIT ? OFFSET ?`;
        sqlParams.push(parseInt(params.limit), parseInt(params.offset));
      }

      return await executeQuery(sql, sqlParams);
    } catch (error) {
      console.error('Error en obtenerFacturas:', error);
      throw error;
    }
  }

  // Contar facturas para paginación
  static async contarFacturas(filters = {}) {
    try {
      let sql = `
        SELECT COUNT(*) as total
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN usuarios u ON f.id_empleado = u.id_usuario
        WHERE 1=1
      `;

      const sqlParams = [];

      // Aplicar mismos filtros que en obtenerFacturas
      if (filters.search && filters.search.trim()) {
        sql += ` AND (
          f.numero_factura LIKE ? OR
          c.nombre_completo LIKE ? OR
          c.nit LIKE ?
        )`;
        const searchTerm = `%${filters.search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.fecha_inicio) {
        sql += ` AND f.fecha_factura >= ?`;
        sqlParams.push(filters.fecha_inicio);
      }

      if (filters.fecha_fin) {
        sql += ` AND f.fecha_factura <= ?`;
        sqlParams.push(filters.fecha_fin);
      }

      if (filters.id_empleado) {
        sql += ` AND f.id_empleado = ?`;
        sqlParams.push(filters.id_empleado);
      }

      if (filters.estado) {
        sql += ` AND f.estado = ?`;
        sqlParams.push(filters.estado);
      }

      const result = await executeQuery(sql, sqlParams);
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error en contarFacturas:', error);
      throw error;
    }
  }

  // Obtener factura por ID
  static async obtenerFacturaPorId(id) {
    try {
      const sql = `
        SELECT 
          f.*,
          c.nombre_completo as cliente_nombre,
          c.nit as cliente_nit,
          c.telefono as cliente_telefono,
          c.email as cliente_email,
          c.direccion as cliente_direccion,
          CONCAT(u.nombres, ' ', u.apellidos) as empleado_nombre
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN usuarios u ON f.id_empleado = u.id_usuario
        WHERE f.id_factura = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      return result[0] || null;
    } catch (error) {
      console.error('Error en obtenerFacturaPorId:', error);
      throw error;
    }
  }

  // Buscar factura por número
  static async buscarPorNumero(numeroFactura) {
    try {
      const sql = `
        SELECT 
          f.*,
          c.nombre_completo as cliente_nombre,
          c.nit as cliente_nit,
          CONCAT(u.nombres, ' ', u.apellidos) as empleado_nombre
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN usuarios u ON f.id_empleado = u.id_usuario
        WHERE f.numero_factura = ?
      `;
      
      const result = await executeQuery(sql, [numeroFactura]);
      return result[0] || null;
    } catch (error) {
      console.error('Error en buscarPorNumero:', error);
      throw error;
    }
  }

  // Obtener detalle completo para impresión
  static async obtenerDetalleCompleto(id) {
    try {
      // Primero obtenemos la factura
      const factura = await this.obtenerFacturaPorId(id);
      if (!factura) {
        return null;
      }

      // Obtener detalles de productos
      const detallesSql = `
        SELECT 
          df.cantidad,
          df.precio_unitario,
          df.descuento_unitario,
          df.subtotal_producto,
          p.nombre as producto,
          p.codigo,
          p.descripcion,
          um.nombre as unidad
        FROM detalle_facturas df
        INNER JOIN productos p ON df.id_producto = p.id_producto
        LEFT JOIN unidades_medida um ON p.id_unidad = um.id_unidad
        WHERE df.id_factura = ?
        ORDER BY df.id_detalle
      `;
      
      const detalles = await executeQuery(detallesSql, [id]);

      // Obtener medios de pago
      const pagosSql = `
        SELECT 
          mp.monto,
          mp.referencia,
          tp.nombre as tipo_pago
        FROM medios_pago_factura mp
        INNER JOIN tipos_pago tp ON mp.id_tipo_pago = tp.id_tipo_pago
        WHERE mp.id_factura = ?
        ORDER BY mp.id_medio_pago
      `;
      
      const mediosPago = await executeQuery(pagosSql, [id]);

      return {
        ...factura,
        detalles,
        medios_pago: mediosPago
      };
    } catch (error) {
      console.error('Error en obtenerDetalleCompleto:', error);
      throw error;
    }
  }
}

module.exports = FacturaRepository;