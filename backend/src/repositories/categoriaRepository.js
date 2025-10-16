// backend/src/repositories/categoriaRepository.js
const { executeQuery } = require('../config/database');

class CategoriaRepository {
  
  // Obtener todas las categorías activas
  static async findAll(page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE estado = TRUE';
      let searchParams = [];
      
      if (search) {
        whereClause += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
        const searchTerm = `%${search}%`;
        searchParams = [searchTerm, searchTerm];
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
          estado
        FROM categorias_productos
        ${whereClause}
        ORDER BY nombre ASC
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, categorias] = await Promise.all([
        executeQuery(sqlCount, searchParams),
        executeQuery(sql, [...searchParams, limit, offset])
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

  // Buscar categoría por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          id_categoria,
          nombre,
          descripcion,
          estado
        FROM categorias_productos
        WHERE id_categoria = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById categoría:', error);
      throw error;
    }
  }

  // Crear nueva categoría
  static async create(categoriaData) {
    try {
      const sql = `
        INSERT INTO categorias_productos (
          nombre, descripcion, estado
        ) VALUES (?, ?, TRUE)
      `;
      
      const result = await executeQuery(sql, [
        categoriaData.nombre,
        categoriaData.descripcion || null
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create categoría:', error);
      throw error;
    }
  }

  // Actualizar categoría
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
        WHERE id_categoria = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update categoría:', error);
      throw error;
    }
  }

  // Desactivar categoría (soft delete)
  static async delete(id) {
    try {
      const sql = `
        UPDATE categorias_productos 
        SET estado = FALSE
        WHERE id_categoria = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en delete categoría:', error);
      throw error;
    }
  }

  // Verificar si existe categoría por nombre
  static async existsByName(nombre, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM categorias_productos
        WHERE nombre = ? AND estado = TRUE
      `;
      let params = [nombre];
      
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

  // Obtener categorías para select/dropdown
  static async getForSelect() {
    try {
      const sql = `
        SELECT 
          id_categoria,
          nombre
        FROM categorias_productos
        WHERE estado = TRUE
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en getForSelect categorías:', error);
      throw error;
    }
  }

  // Verificar si la categoría tiene productos asociados
  static async hasProducts(id) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM productos
        WHERE id_categoria = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, [id]);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en hasProducts:', error);
      throw error;
    }
  }

  // Obtener estadísticas de categorías
  static async getStats() {
    try {
      const sql = `
        SELECT 
          c.id_categoria,
          c.nombre,
          COUNT(p.id_producto) as total_productos,
          COALESCE(SUM(sb.cantidad_actual), 0) as stock_total
        FROM categorias_productos c
        LEFT JOIN productos p ON c.id_categoria = p.id_categoria AND p.estado = TRUE
        LEFT JOIN stock_bodega sb ON p.id_producto = sb.id_producto
        WHERE c.estado = TRUE
        GROUP BY c.id_categoria, c.nombre
        ORDER BY c.nombre ASC
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en getStats categorías:', error);
      throw error;
    }
  }
}

module.exports = CategoriaRepository;