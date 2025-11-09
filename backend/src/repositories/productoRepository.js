// backend/src/repositories/productoRepository.js - CORREGIDO PARA ESTRUCTURA REAL
const { executeQuery } = require('../config/database');

class ProductoRepository {
  
  // Obtener todos los productos con información completa - CONSULTA CORREGIDA
  static async findAll(page = 1, limit = 10, search = '', categoria = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE p.estado = ?';
      let searchParams = ['Activo'];
      
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
      
      // CONSULTA CORREGIDA CON NOMBRES REALES DE CAMPOS
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.precio_venta,
          p.descuento_porcentaje,
          p.stock_minimo,
          p.stock_actual,
          p.duracion_anos,
          p.cobertura_m2,
          p.created_at,
          p.estado,
          c.nombre as categoria,
          u.nombre as unidad_medida,
          u.abreviatura as unidad_abrev,
          col.nombre as color,
          col.codigo_hex,
          (p.precio_venta * (1 - p.descuento_porcentaje/100)) as precio_final
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida u ON p.id_unidad_medida = u.id_unidad
        LEFT JOIN colores col ON p.id_color = col.id_color
        ${whereClause}
        ORDER BY p.nombre ASC
        LIMIT ? OFFSET ?
      `;
      
      const params = [...searchParams, limit, offset];
      
      const [countResult, productos] = await Promise.all([
        executeQuery(sqlCount, searchParams),
        executeQuery(sql, params)
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

  // Buscar producto por ID - CORREGIDO
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.precio_venta,
          p.descuento_porcentaje,
          p.stock_minimo,
          p.stock_actual,
          p.duracion_anos,
          p.cobertura_m2,
          p.created_at,
          p.updated_at,
          p.estado,
          c.nombre as categoria,
          c.id_categoria,
          u.nombre as unidad_medida,
          u.id_unidad,
          col.nombre as color,
          col.id_color
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida u ON p.id_unidad_medida = u.id_unidad
        LEFT JOIN colores col ON p.id_color = col.id_color
        WHERE p.id_producto = ? AND p.estado = ?
      `;
      
      const result = await executeQuery(sql, [id, 'Activo']);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById producto:', error);
      throw error;
    }
  }

  // Crear nuevo producto - CORREGIDO
  static async create(productoData) {
    try {
      const sql = `
        INSERT INTO productos (
          codigo, nombre, descripcion, id_categoria, precio_venta, 
          descuento_porcentaje, id_unidad_medida, id_color,
          stock_minimo, stock_actual, duracion_anos, cobertura_m2, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await executeQuery(sql, [
        productoData.codigo,
        productoData.nombre,
        productoData.descripcion || null,
        productoData.id_categoria,
        productoData.precio_venta || 0,
        productoData.descuento_porcentaje || 0,
        productoData.id_unidad_medida,
        productoData.id_color || null,
        productoData.stock_minimo || 5,
        productoData.stock_actual || 0,
        productoData.duracion_anos || null,
        productoData.cobertura_m2 || null,
        'Activo'
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create producto:', error);
      throw error;
    }
  }

  // Actualizar producto - CORREGIDO
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
      
      if (productoData.precio_venta !== undefined) {
        fields.push('precio_venta = ?');
        values.push(productoData.precio_venta);
      }
      
      if (productoData.descuento_porcentaje !== undefined) {
        fields.push('descuento_porcentaje = ?');
        values.push(productoData.descuento_porcentaje);
      }
      
      if (productoData.stock_minimo !== undefined) {
        fields.push('stock_minimo = ?');
        values.push(productoData.stock_minimo);
      }
      
      if (productoData.stock_actual !== undefined) {
        fields.push('stock_actual = ?');
        values.push(productoData.stock_actual);
      }
      
      if (productoData.id_categoria !== undefined) {
        fields.push('id_categoria = ?');
        values.push(productoData.id_categoria);
      }
      
      if (productoData.id_unidad_medida !== undefined) {
        fields.push('id_unidad_medida = ?');
        values.push(productoData.id_unidad_medida);
      }
      
      if (productoData.id_color !== undefined) {
        fields.push('id_color = ?');
        values.push(productoData.id_color);
      }
      
      if (productoData.duracion_anos !== undefined) {
        fields.push('duracion_anos = ?');
        values.push(productoData.duracion_anos);
      }
      
      if (productoData.cobertura_m2 !== undefined) {
        fields.push('cobertura_m2 = ?');
        values.push(productoData.cobertura_m2);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const sql = `
        UPDATE productos 
        SET ${fields.join(', ')}
        WHERE id_producto = ? AND estado = ?
      `;
      
      values.push('Activo');
      
      const result = await executeQuery(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update producto:', error);
      throw error;
    }
  }

  // Desactivar producto (soft delete) - CORREGIDO
  static async delete(id) {
    try {
      const sql = `
        UPDATE productos 
        SET estado = ?
        WHERE id_producto = ?
      `;
      
      const result = await executeQuery(sql, ['Inactivo', id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en delete producto:', error);
      throw error;
    }
  }

  // Verificar si existe producto por código - CORREGIDO
  static async existsByCode(codigo, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM productos
        WHERE codigo = ? AND estado = ?
      `;
      let params = [codigo, 'Activo'];
      
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

  // Obtener productos para select/dropdown - CORREGIDO
  static async getForSelect() {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.precio_venta,
          (p.precio_venta * (1 - p.descuento_porcentaje/100)) as precio_final
        FROM productos p
        WHERE p.estado = ?
        ORDER BY p.nombre ASC
      `;
      
      return await executeQuery(sql, ['Activo']);
    } catch (error) {
      console.error('Error en getForSelect productos:', error);
      throw error;
    }
  }

  // Obtener productos con stock bajo - CORREGIDO
  static async getProductsWithLowStock() {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.stock_minimo,
          p.stock_actual,
          c.nombre as categoria
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        WHERE p.estado = ? AND p.stock_actual <= p.stock_minimo
        ORDER BY p.stock_actual ASC, p.nombre
      `;
      
      return await executeQuery(sql, ['Activo']);
    } catch (error) {
      console.error('Error en getProductsWithLowStock:', error);
      throw error;
    }
  }

  // Obtener categorías para los dropdowns
  static async getCategorias() {
    try {
      const sql = `
        SELECT id_categoria, nombre
        FROM categorias_productos
        WHERE estado = ?
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql, ['Activo']);
    } catch (error) {
      console.error('Error en getCategorias:', error);
      throw error;
    }
  }

  // Obtener unidades de medida para los dropdowns
  static async getUnidadesMedida() {
    try {
      const sql = `
        SELECT id_unidad, nombre, abreviatura
        FROM unidades_medida
        WHERE estado = ?
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql, ['Activo']);
    } catch (error) {
      console.error('Error en getUnidadesMedida:', error);
      throw error;
    }
  }

  // Obtener colores para los dropdowns
  static async getColores() {
    try {
      const sql = `
        SELECT id_color, nombre, codigo_hex
        FROM colores
        WHERE estado = ?
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql, ['Activo']);
    } catch (error) {
      console.error('Error en getColores:', error);
      throw error;
    }
  }
}

module.exports = ProductoRepository;