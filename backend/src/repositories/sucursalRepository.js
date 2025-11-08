// backend/src/repositories/sucursalRepository.js - CORREGIDO

const { executeQuery } = require('../config/database');

class SucursalRepository {
  async findAll(page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE estado = TRUE';
      let params = [];

      if (search) {
        whereClause += ' AND (nombre LIKE ? OR direccion LIKE ? OR departamento LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // QUITAMOS 'ciudad' de la consulta
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          direccion,
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

      params.push(limit, offset);
      const sucursales = await executeQuery(sql, params);

      // Contar total
      const countSql = `
        SELECT COUNT(*) as total 
        FROM sucursales 
        ${whereClause.replace('LIMIT ? OFFSET ?', '')}
      `;
      
      const countParams = params.slice(0, -2); // Quitar limit y offset
      const [countResult] = await executeQuery(countSql, countParams);

      return {
        data: sucursales,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          direccion,
          departamento,
          telefono,
          latitud,
          longitud,
          estado
        FROM sucursales 
        WHERE id_sucursal = ?
      `;
      
      const [sucursal] = await executeQuery(sql, [id]);
      return sucursal;
    } catch (error) {
      console.error('Error en findById:', error);
      throw error;
    }
  }

  async create(sucursalData) {
    try {
      const sql = `
        INSERT INTO sucursales (
          nombre, direccion, departamento, telefono, 
          latitud, longitud, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        sucursalData.nombre,
        sucursalData.direccion,
        sucursalData.departamento,
        sucursalData.telefono,
        sucursalData.latitud,
        sucursalData.longitud,
        sucursalData.estado !== undefined ? sucursalData.estado : true
      ];

      const result = await executeQuery(sql, params);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  async update(id, sucursalData) {
    try {
      const fields = [];
      const params = [];

      if (sucursalData.nombre !== undefined) {
        fields.push('nombre = ?');
        params.push(sucursalData.nombre);
      }

      if (sucursalData.direccion !== undefined) {
        fields.push('direccion = ?');
        params.push(sucursalData.direccion);
      }

      if (sucursalData.departamento !== undefined) {
        fields.push('departamento = ?');
        params.push(sucursalData.departamento);
      }

      if (sucursalData.telefono !== undefined) {
        fields.push('telefono = ?');
        params.push(sucursalData.telefono);
      }

      if (sucursalData.latitud !== undefined) {
        fields.push('latitud = ?');
        params.push(sucursalData.latitud);
      }

      if (sucursalData.longitud !== undefined) {
        fields.push('longitud = ?');
        params.push(sucursalData.longitud);
      }

      if (sucursalData.estado !== undefined) {
        fields.push('estado = ?');
        params.push(sucursalData.estado);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      const sql = `
        UPDATE sucursales 
        SET ${fields.join(', ')} 
        WHERE id_sucursal = ?
      `;

      params.push(id);
      await executeQuery(sql, params);

      return await this.findById(id);
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const sql = 'UPDATE sucursales SET estado = FALSE WHERE id_sucursal = ?';
      await executeQuery(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en delete:', error);
      throw error;
    }
  }

  async findNearest(lat, lng, limit = 5) {
    try {
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          direccion,
          departamento,
          telefono,
          latitud,
          longitud,
          estado,
          (6371 * acos(cos(radians(?)) * cos(radians(latitud)) * 
           cos(radians(longitud) - radians(?)) + sin(radians(?)) * 
           sin(radians(latitud)))) AS distancia
        FROM sucursales 
        WHERE estado = TRUE 
          AND latitud IS NOT NULL 
          AND longitud IS NOT NULL
        ORDER BY distancia ASC
        LIMIT ?
      `;

      const sucursales = await executeQuery(sql, [lat, lng, lat, limit]);
      return sucursales;
    } catch (error) {
      console.error('Error en findNearest:', error);
      throw error;
    }
  }

  async getForSelect() {
    try {
      const sql = `
        SELECT 
          id_sucursal,
          nombre,
          departamento
        FROM sucursales 
        WHERE estado = TRUE
        ORDER BY nombre ASC
      `;

      const sucursales = await executeQuery(sql);
      return sucursales;
    } catch (error) {
      console.error('Error en getForSelect:', error);
      throw error;
    }
  }
}

module.exports = new SucursalRepository();