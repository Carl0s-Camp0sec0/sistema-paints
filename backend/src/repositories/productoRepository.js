// backend/src/repositories/productoRepository.js
const { executeQuery } = require('../config/database');

class ProductoRepository {
  
  // Obtener todos los productos con información completa
  static async findAll(page = 1, limit = 10, search = '', categoria = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE p.estado = TRUE';
      let searchParams = [];
      
      if (search) {
        whereClause += ' AND (p.codigo LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ?)';
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (categoria && categoria !== 'all') {
        whereClause += ' AND p.id_categoria = ?';
        searchParams.push(categoria);
      }
      
      const sqlCount = `
        SELECT COUNT(*) as total
        FROM productos p
        ${whereClause}
      `;
      
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.porcentaje_descuento,
          p.stock_minimo,
          p.tiempo_duracion_anos,
          p.extension_cobertura_m2,
          p.fecha_creacion,
          p.estado,
          c.nombre as categoria,
          u.nombre as unidad_medida,
          u.abreviatura as unidad_abrev,
          col.nombre as color,
          col.codigo_hex,
          hp.precio_venta,
          hp.precio_compra,
          (hp.precio_venta * (1 - p.porcentaje_descuento/100)) as precio_final,
          COALESCE(SUM(sb.cantidad_actual), 0) as stock_total
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida u ON p.id_unidad = u.id_unidad
        LEFT JOIN colores col ON p.id_color = col.id_color
        LEFT JOIN historial_precios hp ON p.id_producto = hp.id_producto AND hp.estado_precio = 'Activo'
        LEFT JOIN stock_bodega sb ON p.id_producto = sb.id_producto
        ${whereClause}
        GROUP BY p.id_producto, p.codigo, p.nombre, p.descripcion, p.porcentaje_descuento, 
                 p.stock_minimo, p.tiempo_duracion_anos, p.extension_cobertura_m2, 
                 p.fecha_creacion, p.estado, c.nombre, u.nombre, u.abreviatura,
                 col.nombre, col.codigo_hex, hp.precio_venta, hp.precio_compra
        ORDER BY p.nombre ASC
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, productos] = await Promise.all([
        executeQuery(sqlCount, searchParams),
        executeQuery(sql, [...searchParams, limit, offset])
      ]);
      
      return {
        productos,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('Error en findAll productos:', error);
      throw error;
    }
  }

  // Buscar producto por ID con información completa
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.porcentaje_descuento,
          p.stock_minimo,
          p.id_categoria,
          p.id_unidad,
          p.id_color,
          p.tiempo_duracion_anos,
          p.extension_cobertura_m2,
          p.fecha_creacion,
          p.estado,
          c.nombre as categoria,
          u.nombre as unidad_medida,
          u.abreviatura as unidad_abrev,
          col.nombre as color,
          col.codigo_hex,
          hp.precio_venta,
          hp.precio_compra,
          (hp.precio_venta * (1 - p.porcentaje_descuento/100)) as precio_final,
          COALESCE(SUM(sb.cantidad_actual), 0) as stock_total
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida u ON p.id_unidad = u.id_unidad
        LEFT JOIN colores col ON p.id_color = col.id_color
        LEFT JOIN historial_precios hp ON p.id_producto = hp.id_producto AND hp.estado_precio = 'Activo'
        LEFT JOIN stock_bodega sb ON p.id_producto = sb.id_producto
        WHERE p.id_producto = ? AND p.estado = TRUE
        GROUP BY p.id_producto
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById producto:', error);
      throw error;
    }
  }

  // Crear nuevo producto
  static async create(productoData) {
    try {
      const sql = `
        INSERT INTO productos (
          codigo, nombre, descripcion, porcentaje_descuento, 
          stock_minimo, id_categoria, id_unidad, id_color,
          tiempo_duracion_anos, extension_cobertura_m2, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `;
      
      const result = await executeQuery(sql, [
        productoData.codigo,
        productoData.nombre,
        productoData.descripcion || null,
        productoData.porcentaje_descuento || 0,
        productoData.stock_minimo || 10,
        productoData.id_categoria,
        productoData.id_unidad,
        productoData.id_color || null,
        productoData.tiempo_duracion_anos || null,
        productoData.extension_cobertura_m2 || null
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create producto:', error);
      throw error;
    }
  }

  // Actualizar producto
  static async update(id, productoData) {
    try {
      const fields = [];
      const values = [];
      
      if (productoData.codigo !== undefined) {
        fields.push('codigo = ?');
        values.push(productoData.codigo);
      }
      
      if (productoData.nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(productoData.nombre);
      }
      
      if (productoData.descripcion !== undefined) {
        fields.push('descripcion = ?');
        values.push(productoData.descripcion);
      }
      
      if (productoData.porcentaje_descuento !== undefined) {
        fields.push('porcentaje_descuento = ?');
        values.push(productoData.porcentaje_descuento);
      }
      
      if (productoData.stock_minimo !== undefined) {
        fields.push('stock_minimo = ?');
        values.push(productoData.stock_minimo);
      }
      
      if (productoData.id_categoria !== undefined) {
        fields.push('id_categoria = ?');
        values.push(productoData.id_categoria);
      }
      
      if (productoData.id_unidad !== undefined) {
        fields.push('id_unidad = ?');
        values.push(productoData.id_unidad);
      }
      
      if (productoData.id_color !== undefined) {
        fields.push('id_color = ?');
        values.push(productoData.id_color);
      }
      
      if (productoData.tiempo_duracion_anos !== undefined) {
        fields.push('tiempo_duracion_anos = ?');
        values.push(productoData.tiempo_duracion_anos);
      }
      
      if (productoData.extension_cobertura_m2 !== undefined) {
        fields.push('extension_cobertura_m2 = ?');
        values.push(productoData.extension_cobertura_m2);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const sql = `
        UPDATE productos 
        SET ${fields.join(', ')}
        WHERE id_producto = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update producto:', error);
      throw error;
    }
  }

  // Desactivar producto (soft delete)
  static async delete(id) {
    try {
      const sql = `
        UPDATE productos 
        SET estado = FALSE
        WHERE id_producto = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en delete producto:', error);
      throw error;
    }
  }

  // Verificar si existe producto por código
  static async existsByCode(codigo, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM productos
        WHERE codigo = ? AND estado = TRUE
      `;
      let params = [codigo];
      
      if (excludeId) {
        sql += ' AND id_producto != ?';
        params.push(excludeId);
      }
      
      const result = await executeQuery(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByCode producto:', error);
      throw error;
    }
  }

  // Obtener productos para select/dropdown
  static async getForSelect() {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          hp.precio_venta,
          (hp.precio_venta * (1 - p.porcentaje_descuento/100)) as precio_final
        FROM productos p
        LEFT JOIN historial_precios hp ON p.id_producto = hp.id_producto AND hp.estado_precio = 'Activo'
        WHERE p.estado = TRUE
        ORDER BY p.nombre ASC
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en getForSelect productos:', error);
      throw error;
    }
  }

  // Crear precio para producto
  static async createPrice(priceData) {
    try {
      // Primero desactivar precio actual si existe
      await executeQuery(`
        UPDATE historial_precios 
        SET estado_precio = 'Inactivo', fecha_fin = NOW()
        WHERE id_producto = ? AND estado_precio = 'Activo'
      `, [priceData.id_producto]);

      // Crear nuevo precio
      const sql = `
        INSERT INTO historial_precios (
          id_producto, precio_venta, precio_compra, 
          motivo_cambio, id_empleado_modifico, estado_precio
        ) VALUES (?, ?, ?, ?, ?, 'Activo')
      `;
      
      const result = await executeQuery(sql, [
        priceData.id_producto,
        priceData.precio_venta,
        priceData.precio_compra || null,
        priceData.motivo_cambio || 'Actualización de precio',
        priceData.id_empleado_modifico || null
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en createPrice:', error);
      throw error;
    }
  }

  // Obtener historial de precios de un producto
  static async getPriceHistory(productId) {
    try {
      const sql = `
        SELECT 
          hp.id_historial_precio,
          hp.precio_venta,
          hp.precio_compra,
          hp.fecha_inicio,
          hp.fecha_fin,
          hp.motivo_cambio,
          hp.estado_precio,
          CONCAT(e.nombres, ' ', e.apellidos) as empleado_modifico
        FROM historial_precios hp
        LEFT JOIN empleados e ON hp.id_empleado_modifico = e.id_empleado
        WHERE hp.id_producto = ?
        ORDER BY hp.fecha_inicio DESC
      `;
      
      return await executeQuery(sql, [productId]);
    } catch (error) {
      console.error('Error en getPriceHistory:', error);
      throw error;
    }
  }

  // Obtener stock por bodega de un producto
  static async getStockByProduct(productId) {
    try {
      const sql = `
        SELECT 
          sb.id_stock,
          sb.cantidad_actual,
          sb.fecha_ultima_actualizacion,
          b.nombre as bodega,
          s.nombre as sucursal
        FROM stock_bodega sb
        INNER JOIN bodegas b ON sb.id_bodega = b.id_bodega
        INNER JOIN sucursales s ON b.id_sucursal = s.id_sucursal
        WHERE sb.id_producto = ?
        ORDER BY s.nombre, b.nombre
      `;
      
      return await executeQuery(sql, [productId]);
    } catch (error) {
      console.error('Error en getStockByProduct:', error);
      throw error;
    }
  }

  // Obtener productos con stock bajo
  static async getProductsWithLowStock() {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.stock_minimo,
          COALESCE(SUM(sb.cantidad_actual), 0) as stock_total,
          c.nombre as categoria
        FROM productos p
        LEFT JOIN stock_bodega sb ON p.id_producto = sb.id_producto
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        WHERE p.estado = TRUE
        GROUP BY p.id_producto, p.codigo, p.nombre, p.stock_minimo, c.nombre
        HAVING stock_total <= p.stock_minimo
        ORDER BY stock_total ASC, p.nombre
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en getProductsWithLowStock:', error);
      throw error;
    }
  }
}

module.exports = ProductoRepository;