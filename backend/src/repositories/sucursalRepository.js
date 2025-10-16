// backend/src/repositories/sucursalRepository.js
const { executeQuery } = require('../config/database');

class SucursalRepository {
  
  // Obtener todas las sucursales activas
  static async findAll(page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE estado = TRUE';
      let searchParams = [];
      
      if (search) {
        whereClause += ' AND (nombre LIKE ? OR ciudad LIKE ? OR departamento LIKE ?)';
        const searchTerm = `%${search}%`;
        searchParams = [searchTerm, searchTerm, searchTerm];
      }
      
      const sqlCount = `
        SELECT COUNT(*) as total
        FROM sucursales
        ${whereClause}
      `;
      
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          direccion,
          ciudad,
          departamento,
          telefono,
          latitud,
          longitud,
          estado
        FROM sucursales
        ${whereClause}
        ORDER BY nombre ASC
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, sucursales] = await Promise.all([
        executeQuery(sqlCount, searchParams),
        executeQuery(sql, [...searchParams, limit, offset])
      ]);
      
      return {
        sucursales,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw error;
    }
  }

  // Buscar sucursal por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          direccion,
          ciudad,
          departamento,
          telefono,
          latitud,
          longitud,
          estado
        FROM sucursales
        WHERE id_sucursal = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw error;
    }
  }

  // Crear nueva sucursal
  static async create(sucursalData) {
    try {
      const sql = `
        INSERT INTO sucursales (
          nombre, direccion, ciudad, departamento, 
          telefono, latitud, longitud, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
      `;
      
      const result = await executeQuery(sql, [
        sucursalData.nombre,
        sucursalData.direccion,
        sucursalData.ciudad,
        sucursalData.departamento,
        sucursalData.telefono || null,
        sucursalData.latitud || null,
        sucursalData.longitud || null
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  // Actualizar sucursal
  static async update(id, sucursalData) {
    try {
      const fields = [];
      const values = [];
      
      if (sucursalData.nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(sucursalData.nombre);
      }
      
      if (sucursalData.direccion !== undefined) {
        fields.push('direccion = ?');
        values.push(sucursalData.direccion);
      }
      
      if (sucursalData.ciudad !== undefined) {
        fields.push('ciudad = ?');
        values.push(sucursalData.ciudad);
      }
      
      if (sucursalData.departamento !== undefined) {
        fields.push('departamento = ?');
        values.push(sucursalData.departamento);
      }
      
      if (sucursalData.telefono !== undefined) {
        fields.push('telefono = ?');
        values.push(sucursalData.telefono);
      }
      
      if (sucursalData.latitud !== undefined) {
        fields.push('latitud = ?');
        values.push(sucursalData.latitud);
      }
      
      if (sucursalData.longitud !== undefined) {
        fields.push('longitud = ?');
        values.push(sucursalData.longitud);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const sql = `
        UPDATE sucursales 
        SET ${fields.join(', ')}
        WHERE id_sucursal = ? AND estado = TRUE
      `;
      
      const result = await executeQuery(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  // Desactivar sucursal (soft delete)
  static async delete(id) {
    try {
      const sql = `
        UPDATE sucursales 
        SET estado = FALSE
        WHERE id_sucursal = ?
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en delete:', error);
      throw error;
    }
  }

  // Verificar si existe sucursal por nombre
  static async existsByName(nombre, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM sucursales
        WHERE nombre = ? AND estado = TRUE
      `;
      let params = [nombre];
      
      if (excludeId) {
        sql += ' AND id_sucursal != ?';
        params.push(excludeId);
      }
      
      const result = await executeQuery(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByName:', error);
      throw error;
    }
  }

  // Obtener sucursales para select/dropdown
  static async getForSelect() {
    try {
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          ciudad
        FROM sucursales
        WHERE estado = TRUE
        ORDER BY nombre ASC
      `;
      
      return await executeQuery(sql);
    } catch (error) {
      console.error('Error en getForSelect:', error);
      throw error;
    }
  }

  // Buscar sucursal más cercana por coordenadas GPS
  static async findNearestByCoordinates(lat, lng, limit = 3) {
    try {
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          direccion,
          ciudad,
          departamento,
          telefono,
          latitud,
          longitud,
          (6371 * acos(
            cos(radians(?)) * cos(radians(latitud)) * 
            cos(radians(longitud) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitud))
          )) AS distancia_km
        FROM sucursales
        WHERE estado = TRUE 
          AND latitud IS NOT NULL 
          AND longitud IS NOT NULL
        ORDER BY distancia_km ASC
        LIMIT ?
      `;
      
      return await executeQuery(sql, [lat, lng, lat, limit]);
    } catch (error) {
      console.error('Error en findNearestByCoordinates:', error);
      throw error;
    }
  }
}

module.exports = SucursalRepository;