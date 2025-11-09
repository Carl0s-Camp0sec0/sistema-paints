// backend/src/controllers/authController.js - CORREGIDO PARA LOGOUT
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery } = require('../config/database');
const { jwtConfig, cookieConfig } = require('../config/jwt');
const { responseSuccess, responseError } = require('../utils/responses');

class AuthController {
  
  // Método de login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar entrada
      if (!username || !password) {
        return responseError(res, 'Usuario y contraseña son requeridos', 400);
      }

      // Buscar usuario en la base de datos
      const query = `
        SELECT 
          u.id_usuario,
          u.username,
          u.password_hash,
          u.salt,
          u.perfil_usuario as rol,
          u.nombre_completo,
          u.email,
          u.estado,
          e.id_sucursal,
          s.nombre as sucursal_nombre
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado  
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.username = ? AND u.estado = 1
      `;

      const usuarios = await executeQuery(query, [username]);

      if (usuarios.length === 0) {
        return responseError(res, 'Usuario no encontrado o inactivo', 401);
      }

      const usuario = usuarios[0];

      // Verificar contraseña usando el método de hash de tu BD
      const passwordToVerify = crypto
        .createHash('sha256')
        .update(password + usuario.salt)
        .digest('hex');

      if (passwordToVerify !== usuario.password_hash) {
        return responseError(res, 'Contraseña incorrecta', 401);
      }

      // Generar JWT token
      const tokenPayload = {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        username: usuario.username,
        nombre: usuario.nombre_completo,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        perfil_usuario: usuario.rol,
        id_sucursal: usuario.id_sucursal,
        sucursal: usuario.sucursal_nombre
      };

      const token = jwt.sign(tokenPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });

      // Actualizar último acceso
      await executeQuery(
        'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
        [usuario.id_usuario]
      );

      // Configurar cookie
      res.cookie('authToken', token, cookieConfig);

      // Respuesta de éxito
      return responseSuccess(res, 'Inicio de sesión exitoso', {
        user: {
          id: usuario.id_usuario,
          username: usuario.username,
          nombre: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol,
          id_sucursal: usuario.id_sucursal,
          sucursal: usuario.sucursal_nombre
        },
        token
      });

    } catch (error) {
      console.error('Error en login:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  // Método de logout corregido
  static async logout(req, res) {
    try {
      // Limpiar cookie de autenticación
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
      });

      // También limpiar cualquier otra cookie relacionada
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
      });

      console.log('Usuario cerró sesión exitosamente');

      return responseSuccess(res, 'Sesión cerrada exitosamente', {
        redirectUrl: '/pages/login.html',
        message: 'Redirigiendo al login...'
      });

    } catch (error) {
      console.error('Error en logout:', error);
      return responseError(res, 'Error al cerrar sesión', 500);
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      if (!req.user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      // Obtener información completa del usuario
      const query = `
        SELECT 
          u.id_usuario,
          u.username,
          u.nombre_completo,
          u.email,
          u.perfil_usuario as rol,
          u.ultimo_acceso,
          u.fecha_creacion,
          e.id_sucursal,
          s.nombre as sucursal_nombre,
          s.direccion as sucursal_direccion
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.id_usuario = ?
      `;

      const usuarios = await executeQuery(query, [req.user.id]);

      if (usuarios.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      const userProfile = usuarios[0];

      return responseSuccess(res, 'Perfil obtenido exitosamente', {
        user: {
          id: userProfile.id_usuario,
          username: userProfile.username,
          nombre: userProfile.nombre_completo,
          email: userProfile.email,
          rol: userProfile.rol,
          ultimo_acceso: userProfile.ultimo_acceso,
          fecha_creacion: userProfile.fecha_creacion,
          sucursal: {
            id: userProfile.id_sucursal,
            nombre: userProfile.sucursal_nombre,
            direccion: userProfile.sucursal_direccion
          }
        }
      });

    } catch (error) {
      console.error('Error en getProfile:', error);
      return responseError(res, 'Error al obtener perfil', 500);
    }
  }

  // Verificar estado del token
  static async verifyToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.authToken;
      
      let token = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (cookieToken) {
        token = cookieToken;
      }

      if (!token) {
        return responseError(res, 'No hay token presente', 401);
      }

      jwt.verify(token, jwtConfig.secret, (err, decoded) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            return responseError(res, 'Token expirado', 401);
          } else if (err.name === 'JsonWebTokenError') {
            return responseError(res, 'Token inválido', 401);
          } else {
            return responseError(res, 'Error de verificación', 401);
          }
        }

        return responseSuccess(res, 'Token válido', {
          user: {
            id: decoded.id_usuario,
            username: decoded.username,
            nombre: decoded.nombre_completo,
            rol: decoded.perfil_usuario
          },
          expires_in: decoded.exp
        });
      });

    } catch (error) {
      console.error('Error en verifyToken:', error);
      return responseError(res, 'Error al verificar token', 500);
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!req.user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      if (!currentPassword || !newPassword) {
        return responseError(res, 'Contraseña actual y nueva contraseña son requeridas', 400);
      }

      if (newPassword.length < 6) {
        return responseError(res, 'La nueva contraseña debe tener al menos 6 caracteres', 400);
      }

      // Obtener información del usuario
      const usuarios = await executeQuery(
        'SELECT password_hash, salt FROM usuarios WHERE id_usuario = ?',
        [req.user.id]
      );

      if (usuarios.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      const usuario = usuarios[0];

      // Verificar contraseña actual
      const currentPasswordHash = crypto
        .createHash('sha256')
        .update(currentPassword + usuario.salt)
        .digest('hex');

      if (currentPasswordHash !== usuario.password_hash) {
        return responseError(res, 'Contraseña actual incorrecta', 400);
      }

      // Generar nuevo hash
      const newSalt = 'salt_' + Date.now();
      const newPasswordHash = crypto
        .createHash('sha256')
        .update(newPassword + newSalt)
        .digest('hex');

      // Actualizar contraseña
      await executeQuery(
        'UPDATE usuarios SET password_hash = ?, salt = ? WHERE id_usuario = ?',
        [newPasswordHash, newSalt, req.user.id]
      );

      return responseSuccess(res, 'Contraseña cambiada exitosamente');

    } catch (error) {
      console.error('Error en changePassword:', error);
      return responseError(res, 'Error al cambiar contraseña', 500);
    }
  }
}

module.exports = AuthController;