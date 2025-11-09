// backend/src/repositories/categoriaRepository.js - VERSIÓN CORREGIDA COMPLETA
const { executeQuery } = require('../config/database');

class CategoriaRepository {
  
  // Obtener todas las categorías con paginación - CORREGIDO
  static async findAll(page = 1, limit = 12, search = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE estado = ?';
      let searchParams = ['Activo'];
      
      if (search) {
        whereClause += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm);
      }
      
      const sqlCount = `
        SELECT COUNT(*) as total
        FROM categorias_productos
        ${whereClause}
      `;
      
      const sql = `
        SELECT 
          id_categoria,
          nombre,
          descripcion,
          estado,
          created_at,
          updated_at,
          (SELECT COUNT(*) FROM productos p WHERE p.id_categoria = categorias_productos.id_categoria AND p.estado = 'Activo') as total_productos
        FROM categorias_productos
        ${whereClause}
        ORDER BY nombre ASC
        LIMIT ? OFFSET ?
      `;
      
      const params = [...searchParams, limit, offset];
      
      const [countResult, categorias] = await Promise.all([
        executeQuery(sqlCount, searchParams),
        executeQuery(sql, params)
      ]);
      
      return {
        categorias,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('Error en findAll categorías:', error);
      throw error;
    }
  }

  // Buscar categoría por ID - CORREGIDO
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          id_categoria,
          nombre,
          descripcion,
          estado,
          created_at,
          updated_at
        FROM categorias_productos
        WHERE id_categoria = ? AND estado = ?
      `;
      
      const result = await executeQuery(sql, [id, 'Activo']);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById categoría:', error);
      throw error;
    }
  }

  // Crear nueva categoría - CORREGIDO
  static async create(categoriaData) {
    try {
      const sql = `
        INSERT INTO categorias_productos (nombre, descripcion, estado)
        VALUES (?, ?, ?)
      `;
      
      const result = await executeQuery(sql, [
        categoriaData.nombre,
        categoriaData.descripcion || null,
        'Activo'
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create categoría:', error);
      throw error;
    }
  }

  // Actualizar categoría - CORREGIDO
  static async update(id, categoriaData) {
    try {
      const fields = [];
      const values = [];
      
      if (categoriaData.nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(categoriaData.nombre);
      }
      
      if (categoriaData.descripcion !== undefined) {
        fields.push('descripcion = ?');
        values.push(categoriaData.descripcion);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const sql = `
        UPDATE categorias_productos 
        SET ${fields.join(', ')}
        WHERE id_categoria = ? AND estado = ?
      `;
      
      values.push('Activo');
      
      const result = await executeQuery(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update categoría:', error);
      throw error;
    }
  }

  // Desactivar categoría (soft delete) - CORREGIDO
  static async delete(id) {
    try {
      // Primero verificar si tiene productos asociados
      const hasProducts = await this.hasProducts(id);
      if (hasProducts) {
        throw new Error('No se puede eliminar la categoría porque tiene productos asociados');
      }

      const sql = `
        UPDATE categorias_productos 
        SET estado = ?
        WHERE id_categoria = ?
      `;
      
      const result = await executeQuery(sql, ['Inactivo', id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en delete categoría:', error);
      throw error;
    }
  }

  // Verificar si existe categoría por nombre - CORREGIDO
  static async existsByName(nombre, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM categorias_productos
        WHERE nombre = ? AND estado = ?
      `;
      let params = [nombre, 'Activo'];
      
      if (excludeId) {
        sql += ' AND id_categoria != ?';
        params.push(excludeId);
      }
      
      const result = await executeQuery(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByName categoría:', error);
      throw error;
    }
  }

  // Obtener categorías para select/dropdown - CORREGIDO
  static async getForSelect() {
    try {
      const sql = `
        SELECT 
          id_categoria,
          nombre
        FROM categorias_productos
        WHERE estado = ?
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql, ['Activo']);
    } catch (error) {
      console.error('Error en getForSelect categorías:', error);
      throw error;
    }
  }

  // Verificar si la categoría tiene productos asociados - CORREGIDO
  static async hasProducts(id) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM productos
        WHERE id_categoria = ? AND estado = ?
      `;
      
      const result = await executeQuery(sql, [id, 'Activo']);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en hasProducts:', error);
      throw error;
    }
  }

  // Obtener estadísticas de la categoría
  static async getStats(id) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_productos,
          COALESCE(SUM(p.stock_actual), 0) as total_stock,
          COALESCE(AVG(p.precio_venta), 0) as precio_promedio
        FROM productos p
        WHERE p.id_categoria = ? AND p.estado = ?
      `;
      
      const result = await executeQuery(sql, [id, 'Activo']);
      return result[0];
    } catch (error) {
      console.error('Error en getStats categoría:', error);
      throw error;
    }
  }
}

module.exports = CategoriaRepository;