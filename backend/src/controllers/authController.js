// backend/src/controllers/authController.js
const crypto = require('crypto');
const { executeQuery } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { responseSuccess, responseError } = require('../utils/responses');

class AuthController {

  /**
   * Login de usuario - ACTUALIZADO para nueva estructura
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validaciones básicas
      if (!username || !password) {
        return responseError(res, 'Username y password son requeridos', 400);
      }

      // Buscar usuario - CONSULTA ACTUALIZADA
      const userQuery = `
        SELECT 
          u.id_usuario,
          u.username,
          u.password_hash,
          u.salt,
          u.perfil_usuario,  -- CAMBIADO: ENUM directo
          u.estado,
          u.intentos_login,
          e.nombres,
          e.apellidos,
          e.id_sucursal,
          s.nombre as sucursal_nombre
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_usuario = e.id_usuario  
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.username = ?
      `;
      
      const users = await executeQuery(userQuery, [username]);
      
      if (!users || users.length === 0) {
        return responseError(res, 'Credenciales inválidas', 401);
      }

      const user = users[0];

      // Verificar estado del usuario
      if (!user.estado) {
        return responseError(res, 'Usuario inactivo', 401);
      }

      // Verificar intentos de login (máximo 5)
      if (user.intentos_login >= 5) {
        return responseError(res, 'Usuario bloqueado por múltiples intentos fallidos', 401);
      }

      // Verificar contraseña
      const hashedPassword = crypto.createHash('sha256').update(password + user.salt).digest('hex');
      
      if (hashedPassword !== user.password_hash) {
        // Incrementar intentos fallidos
        await executeQuery(
          'UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id_usuario = ?',
          [user.id_usuario]
        );
        
        return responseError(res, 'Credenciales inválidas', 401);
      }

      // Login exitoso - resetear intentos y actualizar último acceso
      await executeQuery(
        'UPDATE usuarios SET intentos_login = 0, ultimo_acceso = NOW() WHERE id_usuario = ?',
        [user.id_usuario]
      );

      // Generar token
      const token = generateToken(user);

      // Preparar datos de respuesta
      const userData = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario, // CAMBIADO: estructura simplificada
        nombres: user.nombres,
        apellidos: user.apellidos,
        id_sucursal: user.id_sucursal,
        sucursal_nombre: user.sucursal_nombre
      };

      // Configurar cookie segura
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      return responseSuccess(res, 'Login exitoso', {
        user: userData,
        token: token
      });

    } catch (error) {
      console.error('Error en login:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Logout de usuario
   */
  static async logout(req, res) {
    try {
      // Limpiar cookie
      res.clearCookie('authToken');
      return responseSuccess(res, 'Logout exitoso');
    } catch (error) {
      console.error('Error en logout:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  static async getProfile(req, res) {
    try {
      const userData = {
        id_usuario: req.user.id_usuario,
        username: req.user.username,
        perfil_usuario: req.user.perfil_usuario,
        nombres: req.user.nombres,
        apellidos: req.user.apellidos,
        id_sucursal: req.user.id_sucursal,
        sucursal_nombre: req.user.sucursal_nombre
      };

      return responseSuccess(res, 'Perfil obtenido exitosamente', userData);
    } catch (error) {
      console.error('Error en getProfile:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Verificar token
   */
  static async verifyToken(req, res) {
    try {
      // Si llegó hasta aquí, el token es válido (verificado por middleware)
      return responseSuccess(res, 'Token válido', {
        valid: true,
        user: req.user
      });
    } catch (error) {
      console.error('Error en verifyToken:', error);
      return responseError(res, 'Token inválido', 401);
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id_usuario;

      // Validaciones
      if (!currentPassword || !newPassword) {
        return responseError(res, 'Contraseña actual y nueva son requeridas', 400);
      }

      if (newPassword.length < 6) {
        return responseError(res, 'La nueva contraseña debe tener al menos 6 caracteres', 400);
      }

      // Obtener datos actuales del usuario
      const userQuery = 'SELECT password_hash, salt FROM usuarios WHERE id_usuario = ?';
      const users = await executeQuery(userQuery, [userId]);
      
      if (!users || users.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      const user = users[0];

      // Verificar contraseña actual
      const currentHash = crypto.createHash('sha256').update(currentPassword + user.salt).digest('hex');
      
      if (currentHash !== user.password_hash) {
        return responseError(res, 'Contraseña actual incorrecta', 400);
      }

      // Generar nueva contraseña hasheada (mantener mismo salt)
      const newPasswordHash = crypto.createHash('sha256').update(newPassword + user.salt).digest('hex');

      // Actualizar en base de datos
      await executeQuery(
        'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
        [newPasswordHash, userId]
      );

      return responseSuccess(res, 'Contraseña actualizada exitosamente');

    } catch (error) {
      console.error('Error en changePassword:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Refrescar token (para futuras implementaciones)
   */
  static async refreshToken(req, res) {
    try {
      // Generar nuevo token con la misma información
      const newToken = generateToken(req.user);

      // Actualizar cookie
      res.cookie('authToken', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return responseSuccess(res, 'Token renovado exitosamente', {
        token: newToken
      });

    } catch (error) {
      console.error('Error en refreshToken:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }
}

module.exports = AuthController;