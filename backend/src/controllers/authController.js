// backend/src/controllers/authController.js - COMPLETO Y FUNCIONAL
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery } = require('../config/database');
const { responseSuccess, responseError } = require('../utils/responses');

class AuthController {
  
  // Método de login - CORREGIDO COMPLETAMENTE
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      console.log('🔐 Intento de login para usuario:', username);

      // Validar entrada
      if (!username || !password) {
        console.log('❌ Faltan credenciales');
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
          u.intentos_login,
          e.id_sucursal,
          s.nombre as sucursal_nombre
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado  
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.username = ?
      `;

      const usuarios = await executeQuery(query, [username]);

      if (usuarios.length === 0) {
        console.log('❌ Usuario no encontrado:', username);
        return responseError(res, 'Credenciales inválidas', 401);
      }

      const usuario = usuarios[0];

      // Verificar estado del usuario
      if (usuario.estado !== 1) {
        console.log('❌ Usuario inactivo:', username);
        return responseError(res, 'Cuenta desactivada. Contacta al administrador.', 401);
      }

      // Verificar si la cuenta está bloqueada
      if (usuario.intentos_login >= 5) {
        console.log('❌ Cuenta bloqueada por intentos:', username);
        return responseError(res, 'Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador.', 401);
      }

      // Verificar contraseña usando el método de hash de tu BD
      const passwordToVerify = crypto
        .createHash('sha256')
        .update(password + usuario.salt)
        .digest('hex');

      if (passwordToVerify !== usuario.password_hash) {
        console.log('❌ Contraseña incorrecta para usuario:', username);
        
        // Incrementar intentos fallidos
        await executeQuery(
          'UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id_usuario = ?',
          [usuario.id_usuario]
        );
        
        return responseError(res, 'Credenciales inválidas', 401);
      }

      console.log('✅ Credenciales válidas para usuario:', username);

      // Reset intentos de login exitoso
      await executeQuery(
        'UPDATE usuarios SET intentos_login = 0, ultimo_acceso = NOW() WHERE id_usuario = ?',
        [usuario.id_usuario]
      );

      // Crear payload del token - ESTRUCTURA CORRECTA
      const tokenPayload = {
        userId: usuario.id_usuario, // Para el middleware de auth
        id_usuario: usuario.id_usuario,
        username: usuario.username,
        rol: usuario.rol,
        perfil_usuario: usuario.rol
      };

      // Generar JWT token
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure',
        { 
          expiresIn: '24h',
          issuer: 'sistema-paints'
        }
      );

      // Datos del usuario para el frontend - ESTRUCTURA CORRECTA
      const userData = {
        id_usuario: usuario.id_usuario,
        id: usuario.id_usuario,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        perfil_usuario: usuario.rol,
        perfil: usuario.rol,
        id_sucursal: usuario.id_sucursal,
        sucursal: usuario.sucursal_nombre || 'Sin asignar',
        ultimo_acceso: usuario.ultimo_acceso
      };

      console.log('✅ Login exitoso, enviando respuesta...');

      // Configurar cookie de autenticación
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      });

      // Respuesta de éxito con estructura esperada por el frontend
      return responseSuccess(res, 'Inicio de sesión exitoso', {
        user: userData,
        token: token
      });

    } catch (error) {
      console.error('❌ Error interno en login:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  // Método de logout
  static async logout(req, res) {
    try {
      // Limpiar cookies
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
      });

      console.log('✅ Usuario cerró sesión exitosamente');

      return responseSuccess(res, 'Sesión cerrada exitosamente');

    } catch (error) {
      console.error('❌ Error en logout:', error);
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
          s.nombre as sucursal_nombre
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
        id_usuario: userProfile.id_usuario,
        username: userProfile.username,
        nombre_completo: userProfile.nombre_completo,
        email: userProfile.email,
        perfil_usuario: userProfile.rol,
        ultimo_acceso: userProfile.ultimo_acceso,
        sucursal: userProfile.sucursal_nombre
      });

    } catch (error) {
      console.error('❌ Error en getProfile:', error);
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

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure');
        
        return responseSuccess(res, 'Token válido', {
          user: {
            id: decoded.id_usuario,
            username: decoded.username,
            rol: decoded.rol
          },
          expires: decoded.exp
        });
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return responseError(res, 'Token expirado', 401);
        } else {
          return responseError(res, 'Token inválido', 401);
        }
      }

    } catch (error) {
      console.error('❌ Error en verifyToken:', error);
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

      // Generar hash para nueva contraseña
      const newPasswordHash = crypto
        .createHash('sha256')
        .update(newPassword + usuario.salt)
        .digest('hex');

      // Actualizar contraseña
      await executeQuery(
        'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
        [newPasswordHash, req.user.id]
      );

      return responseSuccess(res, 'Contraseña cambiada exitosamente');

    } catch (error) {
      console.error('❌ Error en changePassword:', error);
      return responseError(res, 'Error al cambiar contraseña', 500);
    }
  }
}

module.exports = AuthController;