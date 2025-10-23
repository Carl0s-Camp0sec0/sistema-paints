// backend/src/repositories/clienteRepository.js

const { executeQuery } = require('../config/database');

class ClienteRepository {

  // Obtener todos los clientes con filtros
  static async findAll(params = {}) {
    try {
      let sql = `
        SELECT 
          id_cliente,
          nombres,
          apellidos,
          nit,
          telefono,
          email,
          direccion,
          fecha_registro,
          CONCAT(nombres, ' ', apellidos) as nombre_completo
        FROM clientes
        WHERE estado = TRUE
      `;

      const sqlParams = [];

      // Filtro de búsqueda
      if (params.search && params.search.trim()) {
        sql += ` AND (
          nombres LIKE ? OR
          apellidos LIKE ? OR
          nit LIKE ? OR
          email LIKE ? OR
          CONCAT(nombres, ' ', apellidos) LIKE ?
        )`;
        const searchTerm = `%${params.search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Ordenamiento
      const validSortFields = ['nombres', 'apellidos', 'nit', 'fecha_registro', 'email'];
      const sortBy = validSortFields.includes(params.sortBy) ? params.sortBy : 'nombres';
      const sortOrder = params.sortOrder === 'desc' ? 'DESC' : 'ASC';
      
      sql += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Paginación
      if (params.limit) {
        sql += ` LIMIT ? OFFSET ?`;
        sqlParams.push(params.limit, params.offset || 0);
      }

      return await executeQuery(sql, sqlParams);
    } catch (error) {
      console.error('Error en findAll clientes:', error);
      throw error;
    }
  }

  // Contar clientes
  static async count(params = {}) {
    try {
      let sql = `
        SELECT COUNT(*) as total
        FROM clientes
        WHERE estado = TRUE
      `;

      const sqlParams = [];

      if (params.search && params.search.trim()) {
        sql += ` AND (
          nombres LIKE ? OR
          apellidos LIKE ? OR
          nit LIKE ? OR
          email LIKE ? OR
          CONCAT(nombres, ' ', apellidos) LIKE ?
        )`;
        const searchTerm = `%${params.search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const result = await executeQuery(sql, sqlParams);
      return result[0].total;
    } catch (error) {
      console.error('Error en count clientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          id_cliente,
          nombres,
          apellidos,
          nit,
          telefono,
          email,
          direccion,
          fecha_registro,
          CONCAT(nombres, ' ', apellidos) as nombre_completo
        FROM clientes
        WHERE id_cliente = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById cliente:', error);
      throw error;
    }
  }

  // Crear cliente
  static async create(clienteData) {
    try {
      const sql = `
        INSERT INTO clientes (
          nombres, apellidos, nit, telefono, email, direccion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, TRUE)
      `;
      
      const result = await executeQuery(sql, [
        clienteData.nombres,
        clienteData.apellidos,
        clienteData.nit,
        clienteData.telefono || null,
        clienteData.email || null,
        clienteData.direccion || null
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create cliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  static async update(id, clienteData) {
    try {
      const fields = [];
      const values = [];
      
      if (clienteData.nombres !== undefined) {
        fields.push('nombres = ?');
        values.push(clienteData.nombres);
      }
      
      if (clienteData.apellidos !== undefined) {
        fields.push('apellidos = ?');
        values.push(clienteData.apellidos);
      }
      
      if (clienteData.nit !== undefined) {
        fields.push('nit = ?');
        values.push(clienteData.nit);
      }
      
      if (clienteData.telefono !== undefined) {
        fields.push('telefono = ?');
        values.push(clienteData.telefono);
      }
      
      if (clienteData.email !== undefined) {
        fields.push('email = ?');
        values.push(clienteData.email);
      }
      
      if (clienteData.direccion !== undefined) {
        fields.push('direccion = ?');
        values.push(clienteData.direccion);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const sql = `
        UPDATE clientes 
        SET ${fields.join(', ')}
        WHERE id_cliente = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update cliente:', error);
      throw error;
    }
  }

  // Eliminar cliente (soft delete)
  static async delete(id) {
    try {
      const sql = `
        UPDATE clientes 
        SET estado = FALSE
        WHERE id_cliente = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en delete cliente:', error);
      throw error;
    }
  }

  // Buscar por NIT
  static async findByNit(nit) {
    try {
      const sql = `
        SELECT 
          id_cliente,
          nombres,
          apellidos,
          nit,
          telefono,
          email,
          direccion,
          fecha_registro,
          CONCAT(nombres, ' ', apellidos) as nombre_completo
        FROM clientes
        WHERE nit = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, [nit]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findByNit cliente:', error);
      throw error;
    }
  }

  // Verificar si existe por NIT
  static async existsByNit(nit, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM clientes
        WHERE nit = ? AND estado = TRUE
      `;
      let params = [nit];
      
      if (excludeId) {
        sql += ' AND id_cliente != ?';
        params.push(excludeId);
      }
      
      const result = await executeQuery(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByNit cliente:', error);
      throw error;
    }
  }

  // Obtener clientes para select/dropdown
  static async getForSelect(search = '') {
    try {
      let sql = `
        SELECT 
          id_cliente,
          nit,
          CONCAT(nombres, ' ', apellidos) as nombre_completo,
          nombres,
          apellidos
        FROM clientes
        WHERE estado = TRUE
      `;

      const sqlParams = [];

      if (search && search.trim()) {
        sql += ` AND (
          nombres LIKE ? OR
          apellidos LIKE ? OR
          nit LIKE ? OR
          CONCAT(nombres, ' ', apellidos) LIKE ?
        )`;
        const searchTerm = `%${search.trim()}%`;
        sqlParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      sql += ` ORDER BY nombres ASC LIMIT 50`;
      
      return await executeQuery(sql, sqlParams);
    } catch (error) {
      console.error('Error en getForSelect clientes:', error);
      throw error;
    }
  }

  // Verificar si tiene facturas asociadas
  static async hasFacturas(id) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM facturas
        WHERE id_cliente = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en hasFacturas cliente:', error);
      throw error;
    }
  }
}

module.exports = ClienteRepository;