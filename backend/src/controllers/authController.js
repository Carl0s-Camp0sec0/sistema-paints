// backend/src/controllers/authController.js
// VERSIÓN FINAL CORREGIDA BASADA EN TU ESTRUCTURA REAL DE BD

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { responseSuccess, responseError } = require('../utils/responses');

class AuthController {
  
  // FUNCIÓN LOGIN ADAPTADA A TU ESTRUCTURA REAL
  static async login(req, res) {
    try {
      console.log(`${new Date().toISOString()} - POST /api/auth/login`);
      
      const { username, password } = req.body;

      // Validaciones básicas
      if (!username || !password) {
        return responseError(res, 'Username y password son requeridos', 400);
      }

      console.log(`🔍 Intentando login para usuario: ${username}`);

      // CONSULTA CORREGIDA - Solo tabla usuarios (sin JOINs problemáticos)
      const userQuery = `
        SELECT 
          id_usuario,
          username,
          password_hash,
          salt,
          estado,
          intentos_login,
          ultimo_acceso,
          perfil_usuario
        FROM usuarios 
        WHERE username = ?
      `;

      const users = await executeQuery(userQuery, [username]);

      if (!users || users.length === 0) {
        console.log(`❌ Usuario no encontrado: ${username}`);
        return responseError(res, 'Credenciales inválidas', 401);
      }

      const user = users[0];
      console.log(`📋 Usuario encontrado: ${user.username}, Estado: ${user.estado}, Intentos: ${user.intentos_login}`);

      // Verificar estado del usuario
      if (!user.estado) {
        console.log(`❌ Usuario desactivado: ${username}`);
        return responseError(res, 'Cuenta desactivada', 401);
      }

      // Verificar intentos excesivos
      if (user.intentos_login >= 3) {
        console.log(`❌ Cuenta bloqueada por intentos: ${username}`);
        return responseError(res, 'Cuenta bloqueada por múltiples intentos fallidos', 401);
      }

      // Verificar contraseña usando SHA256 + salt
      const hash = crypto.createHash('sha256');
      hash.update(password + user.salt);
      const calculatedHash = hash.digest('hex');

      console.log(`🔐 Hash calculado: ${calculatedHash}`);
      console.log(`🔐 Hash esperado: ${user.password_hash}`);

      if (calculatedHash !== user.password_hash) {
        // Incrementar intentos fallidos
        await executeQuery(
          'UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id_usuario = ?',
          [user.id_usuario]
        );
        
        console.log(`❌ Contraseña incorrecta para: ${username}`);
        return responseError(res, 'Credenciales inválidas', 401);
      }

      console.log('✅ Contraseña correcta');

      // Login exitoso - resetear intentos y actualizar último acceso
      await executeQuery(
        'UPDATE usuarios SET intentos_login = 0, ultimo_acceso = NOW() WHERE id_usuario = ?',
        [user.id_usuario]
      );

      // INTENTAR OBTENER INFORMACIÓN DE EMPLEADO (opcional)
      let empleadoInfo = null;
      try {
        const empleadoQuery = `
          SELECT 
            e.id_empleado,
            CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
            s.nombre as sucursal,
            s.departamento
          FROM empleados e
          LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
          WHERE e.id_usuario = ?
        `;
        
        const empleados = await executeQuery(empleadoQuery, [user.id_usuario]);
        if (empleados && empleados.length > 0) {
          empleadoInfo = empleados[0];
          console.log('📋 Información de empleado encontrada:', empleadoInfo);
        } else {
          console.log('ℹ️  No hay información de empleado asociada');
        }
      } catch (empleadoError) {
        console.log('⚠️  Error obteniendo info de empleado:', empleadoError.message);
        // Continuar sin información de empleado
      }

      // Generar token JWT
      const tokenPayload = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario,
        id_empleado: empleadoInfo?.id_empleado || null
      };

      const token = jwt.sign(
        tokenPayload, 
        process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure', 
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // DATOS DEL USUARIO - Combinando info base + empleado (si existe)
      const userData = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario,
        perfil: user.perfil_usuario, // Frontend compatibility
        nombre_completo: empleadoInfo?.nombre_completo || user.username,
        sucursal: empleadoInfo?.sucursal || 'Sin asignar',
        departamento: empleadoInfo?.departamento || null,
        id_empleado: empleadoInfo?.id_empleado || null,
        ultimo_acceso: new Date().toISOString()
      };

      console.log('✅ Login exitoso para:', username);
      console.log('📋 Datos de usuario finales:', userData);

      // ESTRUCTURA DE RESPUESTA CORREGIDA
      return responseSuccess(res, 'Login exitoso', {
        user: userData,
        token: token
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  // FUNCIÓN GETPROFILE ADAPTADA
  static async getProfile(req, res) {
    try {
      const userId = req.user.id_usuario;
      console.log(`🔍 Obteniendo perfil para usuario ID: ${userId}`);

      // Consulta base de usuario
      const userQuery = `
        SELECT 
          id_usuario,
          username,
          perfil_usuario,
          ultimo_acceso
        FROM usuarios 
        WHERE id_usuario = ?
      `;

      const users = await executeQuery(userQuery, [userId]);
      
      if (!users || users.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      const user = users[0];

      // Intentar obtener información de empleado
      let empleadoInfo = null;
      try {
        const empleadoQuery = `
          SELECT 
            e.id_empleado,
            CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
            s.nombre as sucursal,
            s.departamento
          FROM empleados e
          LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
          WHERE e.id_usuario = ?
        `;
        
        const empleados = await executeQuery(empleadoQuery, [userId]);
        if (empleados && empleados.length > 0) {
          empleadoInfo = empleados[0];
        }
      } catch (empleadoError) {
        console.log('⚠️  Error obteniendo info de empleado en profile:', empleadoError.message);
      }

      // Datos normalizados
      const userData = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario,
        perfil: user.perfil_usuario,
        nombre_completo: empleadoInfo?.nombre_completo || user.username,
        sucursal: empleadoInfo?.sucursal || 'Sin asignar',
        departamento: empleadoInfo?.departamento || null,
        id_empleado: empleadoInfo?.id_empleado || null,
        ultimo_acceso: user.ultimo_acceso
      };

      return responseSuccess(res, 'Perfil obtenido exitosamente', userData);
    } catch (error) {
      console.error('❌ Error en getProfile:', error);
      return responseError(res, 'Error al obtener perfil', 500);
    }
  }

  static async logout(req, res) {
    try {
      console.log(`🚪 Logout para usuario ID: ${req.user?.id_usuario || 'desconocido'}`);
      return responseSuccess(res, 'Logout exitoso', null);
    } catch (error) {
      console.error('❌ Error en logout:', error);
      return responseError(res, 'Error al cerrar sesión', 500);
    }
  }

  static async verifyToken(req, res) {
    try {
      const userData = {
        id_usuario: req.user.id_usuario,
        username: req.user.username,
        perfil_usuario: req.user.perfil_usuario,
        perfil: req.user.perfil_usuario
      };
      
      return responseSuccess(res, 'Token válido', userData);
    } catch (error) {
      console.error('❌ Error en verifyToken:', error);
      return responseError(res, 'Error al verificar token', 500);
    }
  }

  // FUNCIÓN PARA CAMBIO DE CONTRASEÑA
  static async changePassword(req, res) {
    try {
      const userId = req.user.id_usuario;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return responseError(res, 'Contraseña actual y nueva contraseña son requeridas', 400);
      }

      if (newPassword.length < 6) {
        return responseError(res, 'La nueva contraseña debe tener al menos 6 caracteres', 400);
      }

      // Buscar usuario actual
      const userQuery = 'SELECT password_hash, salt FROM usuarios WHERE id_usuario = ?';
      const users = await executeQuery(userQuery, [userId]);

      if (!users || users.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      const user = users[0];

      // Verificar contraseña actual
      const hash = crypto.createHash('sha256');
      hash.update(currentPassword + user.salt);
      const calculatedHash = hash.digest('hex');

      if (calculatedHash !== user.password_hash) {
        return responseError(res, 'Contraseña actual incorrecta', 401);
      }

      // Generar nuevo hash para la nueva contraseña
      const newHash = crypto.createHash('sha256');
      newHash.update(newPassword + user.salt);
      const newPasswordHash = newHash.digest('hex');

      // Actualizar contraseña
      await executeQuery(
        'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
        [newPasswordHash, userId]
      );

      console.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);
      
      return responseSuccess(res, 'Contraseña cambiada exitosamente', null);
    } catch (error) {
      console.error('❌ Error en changePassword:', error);
      return responseError(res, 'Error al cambiar contraseña', 500);
    }
  }

  // FUNCIÓN PARA REFRESH TOKEN
  static async refreshToken(req, res) {
    try {
      const { id_usuario, username, perfil_usuario, id_empleado } = req.user;

      const tokenPayload = {
        id_usuario,
        username,
        perfil_usuario,
        id_empleado
      };

      const newToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return responseSuccess(res, 'Token renovado exitosamente', {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });
    } catch (error) {
      console.error('❌ Error en refreshToken:', error);
      return responseError(res, 'Error al renovar token', 500);
    }
  }

  // FUNCIÓN PARA OBTENER USUARIOS (solo para administradores)
  static async getUsers(req, res) {
    try {
      if (req.user.perfil_usuario !== 'Gerente') {
        return responseError(res, 'No tienes permisos para ver esta información', 403);
      }

      const usersQuery = `
        SELECT 
          u.id_usuario,
          u.username,
          u.perfil_usuario,
          u.estado,
          u.ultimo_acceso,
          COALESCE(CONCAT(e.nombres, ' ', e.apellidos), u.username) as nombre_completo,
          COALESCE(s.nombre, 'Sin asignar') as sucursal
        FROM usuarios u
        LEFT JOIN empleados e ON e.id_usuario = u.id_usuario
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        ORDER BY u.username
      `;

      const users = await executeQuery(usersQuery);
      
      return responseSuccess(res, 'Usuarios obtenidos exitosamente', users);
    } catch (error) {
      console.error('❌ Error en getUsers:', error);
      return responseError(res, 'Error al obtener usuarios', 500);
    }
  }

  // FUNCIÓN PARA RESET DE INTENTOS DE LOGIN
  static async resetLoginAttempts(req, res) {
    try {
      const { userId } = req.params;
      
      if (req.user.perfil_usuario !== 'Gerente') {
        return responseError(res, 'No tienes permisos para realizar esta acción', 403);
      }

      await executeQuery(
        'UPDATE usuarios SET intentos_login = 0 WHERE id_usuario = ?',
        [userId]
      );

      console.log(`✅ Intentos de login reseteados para usuario ID: ${userId}`);
      
      return responseSuccess(res, 'Intentos de login reseteados exitosamente', null);
    } catch (error) {
      console.error('❌ Error en resetLoginAttempts:', error);
      return responseError(res, 'Error al resetear intentos de login', 500);
    }
  }
}

module.exports = AuthController;