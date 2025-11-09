// backend/src/repositories/baseRepository.js - REPOSITORIO BASE PARA TU BD ACTUAL
const { executeQuery, getConnection } = require('../config/database');

class BaseRepository {
  
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  // Buscar por ID
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error en findById para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Buscar todos con filtros
  async findAll(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
      const params = [];

      // Agregar filtros dinámicamente
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query += ` AND ${key} = ?`;
          params.push(filters[key]);
        }
      });

      // Agregar paginación
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await executeQuery(query, params);
      
      // Contar total para paginación
      let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
      const countParams = [];
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          countQuery += ` AND ${key} = ?`;
          countParams.push(filters[key]);
        }
      });
      
      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error(`Error en findAll para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Crear nuevo registro
  async create(data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      const result = await executeQuery(query, values);
      
      return result.insertId;

    } catch (error) {
      console.error(`Error en create para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Actualizar registro
  async update(id, data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      
      if (fields.length === 0) {
        return false;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
      
      const result = await executeQuery(query, [...values, id]);
      return result.affectedRows > 0;

    } catch (error) {
      console.error(`Error en update para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Eliminar registro
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      const result = await executeQuery(query, [id]);
      return result.affectedRows > 0;

    } catch (error) {
      console.error(`Error en delete para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Soft delete
  async softDelete(id, statusField = 'estado', deletedValue = 'eliminado') {
    try {
      const query = `UPDATE ${this.tableName} SET ${statusField} = ? WHERE ${this.primaryKey} = ?`;
      const result = await executeQuery(query, [deletedValue, id]);
      return result.affectedRows > 0;

    } catch (error) {
      console.error(`Error en softDelete para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Contar registros
  async count(filters = {}) {
    try {
      let query = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
      const params = [];

      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query += ` AND ${key} = ?`;
          params.push(filters[key]);
        }
      });

      const result = await executeQuery(query, params);
      return result[0].total;

    } catch (error) {
      console.error(`Error en count para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Buscar por campo específico
  async findBy(field, value) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${field} = ?`;
      const results = await executeQuery(query, [value]);
      return results;

    } catch (error) {
      console.error(`Error en findBy para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Buscar uno por campo específico
  async findOneBy(field, value) {
    try {
      const results = await this.findBy(field, value);
      return results.length > 0 ? results[0] : null;

    } catch (error) {
      console.error(`Error en findOneBy para tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  // Verificar si existe
  async exists(field, value, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${field} = ?`;
      const params = [value];

      if (excludeId) {
        query += ` AND ${this.primaryKey} != ?`;
        params.push(excludeId);
      }

      const result = await executeQuery(query, params);
      return result[0].count > 0;

    } catch (error) {
      console.error(`Error en exists para tabla ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;