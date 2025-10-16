// backend/src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserRepository = require('../repositories/userRepository');
const { jwtConfig } = require('../config/jwt');

class AuthService {
  
  // Autenticar usuario
  static async authenticate(username, password) {
    try {
      // Buscar usuario por username
      const user = await UserRepository.findByUsername(username);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.estado) {
        throw new Error('Usuario desactivado');
      }

      // Verificar intentos de login excesivos
      if (user.intentos_login >= 3) {
        throw new Error('Cuenta bloqueada por múltiples intentos fallidos');
      }

      // Verificar contraseña
      const isValidPassword = await this.verifyPassword(password, user.salt, user.password_hash);
      
      if (!isValidPassword) {
        // Incrementar intentos fallidos
        await UserRepository.incrementLoginAttempts(user.id_usuario);
        throw new Error('Contraseña incorrecta');
      }

      // Actualizar último acceso
      await UserRepository.updateLastAccess(user.id_usuario);

      // Generar token JWT
      const token = this.generateToken({
        id: user.id_usuario,
        username: user.username,
        perfil: user.perfil_usuario,
        id_empleado: user.id_empleado
      });

      // Retornar datos del usuario y token
      return {
        token,
        user: {
          id: user.id_usuario,
          username: user.username,
          perfil: user.perfil_usuario,
          nombre_completo: user.nombre_completo,
          sucursal: user.sucursal,
          id_empleado: user.id_empleado
        }
      };
    } catch (error) {
      console.error('Error en authenticate:', error);
      throw error;
    }
  }

  // Verificar contraseña con salt
  static async verifyPassword(password, salt, hashedPassword) {
    try {
      // Crear hash con la contraseña y salt proporcionados
      const hash = crypto.createHash('sha256');
      hash.update(password + salt);
      const passwordHash = hash.digest('hex');
      
      return passwordHash === hashedPassword;
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      return false;
    }
  }

  // Generar hash de contraseña con salt
  static async hashPassword(password) {
    try {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHash('sha256');
      hash.update(password + salt);
      const passwordHash = hash.digest('hex');
      
      return {
        salt,
        passwordHash
      };
    } catch (error) {
      console.error('Error generando hash:', error);
      throw error;
    }
  }

  // Generar token JWT
  static generateToken(payload) {
    try {
      return jwt.sign(
        {
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          iss: jwtConfig.issuer,
          aud: jwtConfig.audience
        },
        jwtConfig.secret,
        {
          expiresIn: jwtConfig.expiresIn
        }
      );
    } catch (error) {
      console.error('Error generando token:', error);
      throw error;
    }
  }

  // Verificar token JWT
  static verifyToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      console.error('Error verificando token:', error);
      throw error;
    }
  }

  // Obtener perfil del usuario
  static async getProfile(userId) {
    try {
      const user = await UserRepository.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return {
        id: user.id_usuario,
        username: user.username,
        perfil: user.perfil_usuario,
        nombre_completo: user.nombre_completo,
        sucursal: user.sucursal,
        id_sucursal: user.id_sucursal,
        id_empleado: user.id_empleado,
        ultimo_acceso: user.ultimo_acceso
      };
    } catch (error) {
      console.error('Error en getProfile:', error);
      throw error;
    }
  }

  // Crear nuevo usuario
  static async createUser(userData) {
    try {
      // Verificar si el username ya existe
      const existingUser = await UserRepository.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('El nombre de usuario ya existe');
      }

      // Generar hash de contraseña
      const { salt, passwordHash } = await this.hashPassword(userData.password);

      // Crear usuario
      const userId = await UserRepository.create({
        username: userData.username,
        password_hash: passwordHash,
        salt: salt,
        perfil_usuario: userData.perfil_usuario
      });

      return userId;
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
    }
  }

        // Cambiar contraseña
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserRepository.findByUsername(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isValidPassword = await this.verifyPassword(currentPassword, user.salt, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Generar nuevo hash
      const { salt, passwordHash } = await this.hashPassword(newPassword);

      // Actualizar contraseña
      await UserRepository.update(userId, {
        password_hash: passwordHash,
        salt: salt
      });

      return true;
    } catch (error) {
      console.error('Error en changePassword:', error);
      throw error;
    }
  }
}

module.exports = AuthService;