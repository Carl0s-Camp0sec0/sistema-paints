// backend/src/controllers/authController.js - VERSIÓN COMPLETA CON TODAS LAS FUNCIONES

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { responseSuccess, responseError } = require('../utils/responses');

class AuthController {

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validaciones básicas
      if (!username || !password) {
        return responseError(res, 'Username y password son requeridos', 400);
      }

      console.log(`🔍 Intentando login para usuario: ${username}`);

      // Buscar usuario
      const userQuery = `
        SELECT 
          u.id_usuario,
          u.username,
          u.password_hash,
          u.salt,
          u.perfil_usuario,
          u.estado,
          u.intentos_login
        FROM usuarios u
        WHERE u.username = ?
      `;
      
      const users = await executeQuery(userQuery, [username]);
      
      if (!users || users.length === 0) {
        console.log('❌ Usuario no encontrado');
        return responseError(res, 'Credenciales inválidas', 401);
      }

      const user = users[0];
      console.log(`📋 Usuario encontrado: ${user.username}, Estado: ${user.estado}, Intentos: ${user.intentos_login}`);

      // Verificar estado del usuario
      if (!user.estado) {
        console.log('❌ Usuario inactivo');
        return responseError(res, 'Usuario inactivo', 401);
      }

      // Verificar intentos de login (máximo 5)
      if (user.intentos_login >= 5) {
        console.log('❌ Usuario bloqueado por intentos');
        return responseError(res, 'Usuario bloqueado por múltiples intentos fallidos', 401);
      }

      // Verificar contraseña
      const hashedPassword = crypto.createHash('sha256').update(password + user.salt).digest('hex');
      console.log(`🔐 Hash calculado: ${hashedPassword}`);
      console.log(`🔐 Hash esperado: ${user.password_hash}`);
      
      if (hashedPassword !== user.password_hash) {
        console.log('❌ Contraseña incorrecta');
        
        // Incrementar intentos fallidos
        await executeQuery(
          'UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id_usuario = ?',
          [user.id_usuario]
        );
        
        return responseError(res, 'Credenciales inválidas', 401);
      }

      console.log('✅ Contraseña correcta');

      // Login exitoso - resetear intentos y actualizar último acceso
      await executeQuery(
        'UPDATE usuarios SET intentos_login = 0, ultimo_acceso = NOW() WHERE id_usuario = ?',
        [user.id_usuario]
      );

      // Generar token JWT
      const tokenPayload = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure', {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });

      // Datos del usuario para el frontend
      const userData = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario,
        ultimo_acceso: new Date().toISOString()
      };

      console.log('✅ Login exitoso');

      return responseSuccess(res, 'Login exitoso', {
        user: userData,
        token: token
      });

    } catch (error) {
      console.error('Error en login:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  static async getProfile(req, res) {
    try {
      const userId = req.user.id_usuario;

      const userQuery = `
        SELECT 
          u.id_usuario,
          u.username,
          u.perfil_usuario,
          u.ultimo_acceso
        FROM usuarios u
        WHERE u.id_usuario = ?
      `;

      const users = await executeQuery(userQuery, [userId]);
      
      if (!users || users.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      return responseSuccess(res, 'Perfil obtenido exitosamente', users[0]);
    } catch (error) {
      console.error('Error en getProfile:', error);
      return responseError(res, 'Error al obtener perfil', 500);
    }
  }

  static async logout(req, res) {
    try {
      // En este caso simple, solo enviamos respuesta exitosa
      // El frontend se encarga de limpiar el token
      return responseSuccess(res, 'Logout exitoso', null);
    } catch (error) {
      console.error('Error en logout:', error);
      return responseError(res, 'Error al cerrar sesión', 500);
    }
  }

  static async verifyToken(req, res) {
    try {
      // Si llegamos aquí, el token es válido (verificado por middleware)
      return responseSuccess(res, 'Token válido', req.user);
    } catch (error) {
      console.error('Error en verifyToken:', error);
      return responseError(res, 'Error al verificar token', 500);
    }
  }

  // Función adicional para cambio de contraseña (si la necesitas)
  static async changePassword(req, res) {
    try {
      return responseSuccess(res, 'Función de cambio de contraseña no implementada aún', null);
    } catch (error) {
      console.error('Error en changePassword:', error);
      return responseError(res, 'Error al cambiar contraseña', 500);
    }
  }

  // Función adicional para refresh token (si la necesitas)
  static async refreshToken(req, res) {
    try {
      return responseSuccess(res, 'Función de refresh token no implementada aún', null);
    } catch (error) {
      console.error('Error en refreshToken:', error);
      return responseError(res, 'Error al refrescar token', 500);
    }
  }
}

module.exports = AuthController;