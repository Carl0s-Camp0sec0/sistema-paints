// backend/src/repositories/facturaRepository.js

const { executeQuery } = require('../config/database');

class FacturaRepository {

  // Obtener cliente por ID
  static async obtenerClientePorId(id, connection = null) {
    try {
      const sql = `
        SELECT id_cliente, nombres, apellidos, nit, telefono, email, direccion
        FROM clientes 
        WHERE id_cliente = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, [id], connection);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      throw error;
    }
  }

  // Obtener serie de factura por ID
  static async obtenerSeriePorId(id, connection = null) {
    try {
      const sql = `
        SELECT id_serie, letra_serie, estado
        FROM series_facturas 
        WHERE id_serie = ? AND estado = 1
      `;
      
      const result = await executeQuery(sql, [id], connection);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en obtenerSeriePorId:', error);
      throw error;
    }
  }

  // Generar número de factura usando procedimiento almacenado
  static async generarNumeroFactura(idSerie, connection = null) {
    try {
      const sql = 'CALL sp_generar_numero_factura(?, @numero_factura)';
      await executeQuery(sql, [idSerie], connection);
      
      const result = await executeQuery('SELECT @numero_factura as numero_factura', [], connection);
      return result[0].numero_factura;
    } catch (error) {
      console.error('Error en generarNumeroFactura:', error);
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
        WHERE p.id_producto = ? AND p.estado = TRUE
        GROUP BY p.id_producto
      `;
      
      const result = await executeQuery(sql, [cantidadRequerida, cantidadRequerida, idProducto], connection);
      
      if (result.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error en verificarStock:', error);
      throw error;
    }
  }

  // Crear factura (usando nombres correctos de columnas)
  static async crearFactura(facturaData, connection = null) {
    try {
      const sql = `
        INSERT INTO facturas (
          id_cliente, id_serie, numero_factura, id_empleado,
          subtotal, descuento_total, impuesto, total, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await executeQuery(sql, [
        facturaData.id_cliente,
        facturaData.id_serie, // Usar id_serie no id_serie_factura
        facturaData.numero_factura,
        facturaData.id_empleado,
        facturaData.subtotal,
        facturaData.descuento_total,
        facturaData.impuesto, // Usar impuesto no iva
        facturaData.total,
        facturaData.estado
      ], connection);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en crearFactura:', error);
      throw error;
    }
  }

  // Crear detalle de factura
  static async crearDetalleFactura(detalleData, connection = null) {
    try {
      const sql = `
        INSERT INTO detalle_facturas (
          id_factura, id_producto, cantidad, precio_unitario, 
          descuento_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await executeQuery(sql, [
        detalleData.id_factura,
        detalleData.id_producto,
        detalleData.cantidad,
        detalleData.precio_unitario,
        detalleData.descuento_unitario,
        detalleData.subtotal
      ], connection);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en crearDetalleFactura:', error);
      throw error;
    }
  }

  // Crear medio de pago
  static async crearMedioPago(pagoData, connection = null) {
    try {
      const sql = `
        INSERT INTO medios_pago_factura (
          id_factura, id_tipo_pago, monto, referencia
        ) VALUES (?, ?, ?, ?)
      `;
      
      const result = await executeQuery(sql, [
        pagoData.id_factura,
        pagoData.id_tipo_pago,
        pagoData.monto,
        pagoData.referencia
      ], connection);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en crearMedioPago:', error);
      throw error;
    }
  }

  // Obtener facturas con filtros
  static async obtenerFacturas(params) {
    try {
      let sql = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_emision,
          f.total,
          f.estado,
          CONCAT(sf.letra_serie, '-', f.numero_factura) as numero_completo,
          CONCAT(c.nombres, ' ', c.apellidos) as cliente,
          c.nit,
          CONCAT(e.nombres, ' ', e.apellidos) as empleado
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN series_facturas sf ON f.id_serie = sf.id_serie
        INNER JOIN empleados e ON f.id_empleado = e.id_empleado
        WHERE 1=1
      `;

      const sqlParams = [];

      // Filtros
      if (params.search && params.search.trim()) {
        sql += ` AND (
          f.numero_factura LIKE ? OR
          CONCAT(c.nombres, ' ', c.apellidos) LIKE ? OR
          c.nit LIKE ?
        )`;
        const searchTerm = `%${params.search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (params.fecha_inicio) {
        sql += ` AND DATE(f.fecha_emision) >= ?`;
        sqlParams.push(params.fecha_inicio);
      }

      if (params.fecha_fin) {
        sql += ` AND DATE(f.fecha_emision) <= ?`;
        sqlParams.push(params.fecha_fin);
      }

      if (params.id_empleado) {
        sql += ` AND f.id_empleado = ?`;
        sqlParams.push(params.id_empleado);
      }

      if (params.estado) {
        sql += ` AND f.estado = ?`;
        sqlParams.push(params.estado);
      }

      sql += ` ORDER BY f.fecha_emision DESC`;

      if (params.limit) {
        sql += ` LIMIT ? OFFSET ?`;
        sqlParams.push(params.limit, params.offset || 0);
      }

      return await executeQuery(sql, sqlParams);
    } catch (error) {
      console.error('Error en obtenerFacturas:', error);
      throw error;
    }
  }

  // Obtener factura por ID con detalles
  static async obtenerFacturaPorId(id, connection = null) {
    try {
      const sql = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_emision,
          f.subtotal,
          f.descuento_total,
          f.impuesto,
          f.total,
          f.estado,
          f.fecha_anulacion,
          f.motivo_anulacion,
          CONCAT(sf.letra_serie, '-', f.numero_factura) as numero_completo,
          sf.letra_serie,
          c.id_cliente,
          CONCAT(c.nombres, ' ', c.apellidos) as cliente,
          c.nit,
          c.telefono,
          c.email,
          c.direccion,
          e.id_empleado,
          CONCAT(e.nombres, ' ', e.apellidos) as empleado
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN series_facturas sf ON f.id_serie = sf.id_serie
        INNER JOIN empleados e ON f.id_empleado = e.id_empleado
        WHERE f.id_factura = ?
      `;
      
      const facturaResult = await executeQuery(sql, [id], connection);
      
      if (facturaResult.length === 0) {
        return null;
      }

      const factura = facturaResult[0];

      // Obtener detalles
      const detallesSql = `
        SELECT 
          df.id_detalle,
          df.cantidad,
          df.precio_unitario,
          df.descuento_unitario,
          df.subtotal,
          p.id_producto,
          p.nombre as producto,
          p.codigo,
          u.nombre as unidad,
          c.nombre as color
        FROM detalle_facturas df
        INNER JOIN productos p ON df.id_producto = p.id_producto
        LEFT JOIN unidades_medida u ON p.id_unidad = u.id_unidad
        LEFT JOIN colores c ON p.id_color = c.id_color
        WHERE df.id_factura = ?
        ORDER BY df.id_detalle
      `;
      
      const detalles = await executeQuery(detallesSql, [id], connection);

      // Obtener medios de pago
      const pagosSql = `
        SELECT 
          mp.id_medio_pago,
          mp.monto,
          mp.referencia,
          tp.id_tipo_pago,
          tp.nombre as tipo_pago
        FROM medios_pago_factura mp
        INNER JOIN tipos_pago tp ON mp.id_tipo_pago = tp.id_tipo_pago
        WHERE mp.id_factura = ?
        ORDER BY mp.id_medio_pago
      `;
      
      const mediosPago = await executeQuery(pagosSql, [id], connection);

      return {
        ...factura,
        detalles,
        medios_pago: mediosPago
      };
    } catch (error) {
      console.error('Error en obtenerFacturaPorId:', error);
      throw error;
    }
  }

  // Obtener tipos de pago
  static async obtenerTiposPago() {
    try {
      const sql = `
        SELECT id_tipo_pago, nombre, descripcion
        FROM tipos_pago
        WHERE estado = TRUE
        ORDER BY nombre
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
        SELECT id_serie, letra_serie, numero_actual
        FROM series_facturas
        WHERE estado = 1
        ORDER BY letra_serie
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en obtenerSeriesFactura:', error);
      throw error;
    }
  }

  // Obtener próximo número de factura
  static async obtenerProximoNumero(idSerie) {
    try {
      const sql = `
        SELECT 
          CONCAT(sf.letra_serie, '-', LPAD(sf.numero_actual + 1, 8, '0')) as proximo_numero
        FROM series_facturas sf
        WHERE sf.id_serie = ? AND sf.estado = 1
      `;
      
      const result = await executeQuery(sql, [idSerie]);
      
      if (result.length === 0) {
        throw new Error('Serie de factura no válida');
      }
      
      return result[0].proximo_numero;
    } catch (error) {
      console.error('Error en obtenerProximoNumero:', error);
      throw error;
    }
  }

  // Crear movimiento de inventario
  static async crearMovimientoInventario(movimientoData, connection = null) {
    try {
      const sql = `
        INSERT INTO movimientos_inventario (
          id_producto, tipo_movimiento, cantidad, motivo, id_empleado
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      const result = await executeQuery(sql, [
        movimientoData.id_producto,
        movimientoData.tipo_movimiento,
        movimientoData.cantidad,
        movimientoData.motivo,
        movimientoData.id_empleado
      ], connection);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en crearMovimientoInventario:', error);
      throw error;
    }
  }

  // Contar facturas con filtros
  static async contarFacturas(params) {
    try {
      let sql = `
        SELECT COUNT(*) as total
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        WHERE 1=1
      `;

      const sqlParams = [];

      if (params.search && params.search.trim()) {
        sql += ` AND (
          f.numero_factura LIKE ? OR
          CONCAT(c.nombres, ' ', c.apellidos) LIKE ? OR
          c.nit LIKE ?
        )`;
        const searchTerm = `%${params.search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (params.fecha_inicio) {
        sql += ` AND DATE(f.fecha_emision) >= ?`;
        sqlParams.push(params.fecha_inicio);
      }

      if (params.fecha_fin) {
        sql += ` AND DATE(f.fecha_emision) <= ?`;
        sqlParams.push(params.fecha_fin);
      }

      const result = await executeQuery(sql, sqlParams);
      return result[0].total;
    } catch (error) {
      console.error('Error en contarFacturas:', error);
      throw error;
    }
  }

  // Buscar factura por número
  static async buscarPorNumero(numeroFactura) {
    try {
      const sql = `
        SELECT f.id_factura
        FROM facturas f
        INNER JOIN series_facturas sf ON f.id_serie = sf.id_serie
        WHERE CONCAT(sf.letra_serie, '-', f.numero_factura) = ?
      `;
      
      const result = await executeQuery(sql, [numeroFactura]);
      
      if (result.length === 0) {
        return null;
      }

      return await this.obtenerFacturaPorId(result[0].id_factura);
    } catch (error) {
      console.error('Error en buscarPorNumero:', error);
      throw error;
    }
  }

  // Obtener detalle completo para impresión
  static async obtenerDetalleCompleto(id) {
    try {
      const sql = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_emision,
          f.subtotal,
          f.descuento_total,
          f.impuesto,
          f.total,
          f.estado,
          CONCAT(sf.letra_serie, '-', f.numero_factura) as numero_completo,
          
          -- Datos del cliente
          c.nombres as cliente_nombres,
          c.apellidos as cliente_apellidos,
          c.nit as cliente_nit,
          c.telefono as cliente_telefono,
          c.email as cliente_email,
          c.direccion as cliente_direccion,
          
          -- Datos del empleado
          CONCAT(e.nombres, ' ', e.apellidos) as empleado,
          
          -- Datos de la sucursal
          s.nombre as sucursal,
          s.direccion as sucursal_direccion,
          s.telefono as sucursal_telefono
        FROM facturas f
        INNER JOIN clientes c ON f.id_cliente = c.id_cliente
        INNER JOIN series_facturas sf ON f.id_serie = sf.id_serie
        INNER JOIN empleados e ON f.id_empleado = e.id_empleado
        INNER JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE f.id_factura = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      
      if (result.length === 0) {
        return null;
      }

      const factura = result[0];

      // Obtener detalles
      const detallesSql = `
        SELECT 
          df.cantidad,
          df.precio_unitario,
          df.descuento_unitario,
          df.subtotal,
          p.nombre as producto,
          p.codigo,
          p.descripcion,
          u.nombre as unidad
        FROM detalle_facturas df
        INNER JOIN productos p ON df.id_producto = p.id_producto
        LEFT JOIN unidades_medida u ON p.id_unidad = u.id_unidad
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