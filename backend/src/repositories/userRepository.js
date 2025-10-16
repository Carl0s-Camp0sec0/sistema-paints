// backend/src/repositories/userRepository.js
const { executeQuery } = require('../config/database');

class UserRepository {
  
  // Buscar usuario por username
  static async findByUsername(username) {
    try {
      const sql = `
        SELECT 
          u.id_usuario,
          u.username,
          u.password_hash,
          u.salt,
          u.perfil_usuario,
          u.estado,
          u.fecha_creacion,
          u.ultimo_acceso,
          u.intentos_login,
          e.id_empleado,
          CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
          s.nombre as sucursal
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_usuario = e.id_usuario
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.username = ? AND u.estado = TRUE
      `;
      
      const result = await executeQuery(sql, [username]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findByUsername:', error);
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          u.id_usuario,
          u.username,
          u.perfil_usuario,
          u.estado,
          u.fecha_creacion,
          u.ultimo_acceso,
          e.id_empleado,
          CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
          s.nombre as sucursal,
          s.id_sucursal
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_usuario = e.id_usuario
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.id_usuario = ? AND u.estado = TRUE
      `;
      
      const result = await executeQuery(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw error;
    }
  }

  // Actualizar último acceso
  static async updateLastAccess(userId) {
    try {
      const sql = `
        UPDATE usuarios 
        SET ultimo_acceso = NOW(),
            intentos_login = 0
        WHERE id_usuario = ?
      `;
      
      return await executeQuery(sql, [userId]);
    } catch (error) {
      console.error('Error en updateLastAccess:', error);
      throw error;
    }
  }

  // Incrementar intentos de login
  static async incrementLoginAttempts(userId) {
    try {
      const sql = `
        UPDATE usuarios 
        SET intentos_login = intentos_login + 1
        WHERE id_usuario = ?
      `;
      
      return await executeQuery(sql, [userId]);
    } catch (error) {
      console.error('Error en incrementLoginAttempts:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios (para administración)
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const sqlCount = `
        SELECT COUNT(*) as total
        FROM usuarios u
        WHERE u.estado = TRUE
      `;
      
      const sql = `
        SELECT 
          u.id_usuario,
          u.username,
          u.perfil_usuario,
          u.estado,
          u.fecha_creacion,
          u.ultimo_acceso,
          u.intentos_login,
          e.id_empleado,
          CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
          s.nombre as sucursal
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_usuario = e.id_usuario
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.estado = TRUE
        ORDER BY u.fecha_creacion DESC
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, users] = await Promise.all([
        executeQuery(sqlCount),
        executeQuery(sql, [limit, offset])
      ]);
      
      return {
        users,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw error;
    }
  }

  // Crear nuevo usuario
  static async create(userData) {
    try {
      const sql = `
        INSERT INTO usuarios (username, password_hash, salt, perfil_usuario, estado)
        VALUES (?, ?, ?, ?, TRUE)
      `;
      
      const result = await executeQuery(sql, [
        userData.username,
        userData.password_hash,
        userData.salt,
        userData.perfil_usuario
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  // Actualizar usuario
  static async update(userId, userData) {
    try {
      const fields = [];
      const values = [];
      
      if (userData.username) {
        fields.push('username = ?');
        values.push(userData.username);
      }
      
      if (userData.password_hash && userData.salt) {
        fields.push('password_hash = ?', 'salt = ?');
        values.push(userData.password_hash, userData.salt);
      }
      
      if (userData.perfil_usuario) {
        fields.push('perfil_usuario = ?');
        values.push(userData.perfil_usuario);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(userId);
      
      const sql = `
        UPDATE usuarios 
        SET ${fields.join(', ')}
        WHERE id_usuario = ?
      `;
      
      return await executeQuery(sql, values);
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  // Desactivar usuario (soft delete)
  static async deactivate(userId) {
    try {
      const sql = `
        UPDATE usuarios 
        SET estado = FALSE
        WHERE id_usuario = ?
      `;
      
      return await executeQuery(sql, [userId]);
    } catch (error) {
      console.error('Error en deactivate:', error);
      throw error;
    }
  }
}

module.exports = UserRepository;