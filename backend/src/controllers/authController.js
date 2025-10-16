// backend/src/controllers/authController.js
const AuthService = require('../services/authService');
const { responseSuccess, responseError } = require('../utils/responses');
const { cookieConfig } = require('../config/jwt');

class AuthController {
  
  // Login de usuario
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar campos requeridos
      if (!username || !password) {
        return responseError(res, 'Username y contraseña son requeridos', 400);
      }

      // Autenticar usuario
      const authResult = await AuthService.authenticate(username, password);

      // Configurar cookie con el token
      res.cookie('token', authResult.token, cookieConfig);

      // Respuesta exitosa
      return responseSuccess(res, 'Inicio de sesión exitoso', {
        token: authResult.token,
        user: authResult.user
      });

    } catch (error) {
      console.error('Error en login:', error);
      
      // Manejar errores específicos
      if (error.message === 'Usuario no encontrado') {
        return responseError(res, 'Credenciales inválidas', 401);
      }
      
      if (error.message === 'Contraseña incorrecta') {
        return responseError(res, 'Credenciales inválidas', 401);
      }
      
      if (error.message === 'Usuario desactivado') {
        return responseError(res, 'Cuenta desactivada, contacte al administrador', 403);
      }
      
      if (error.message === 'Cuenta bloqueada por múltiples intentos fallidos') {
        return responseError(res, 'Cuenta bloqueada por seguridad, contacte al administrador', 423);
      }

      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  // Logout de usuario
  static async logout(req, res) {
    try {
      // Limpiar cookie del token
      res.clearCookie('token');
      
      return responseSuccess(res, 'Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error en logout:', error);
      return responseError(res, 'Error al cerrar sesión', 500);
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const userProfile = await AuthService.getProfile(userId);
      
      return responseSuccess(res, 'Perfil obtenido exitosamente', userProfile);
    } catch (error) {
      console.error('Error en getProfile:', error);
      return responseError(res, 'Error al obtener perfil', 500);
    }
  }

  // Verificar si el token es válido
  static async verifyToken(req, res) {
    try {
      // Si llegamos aquí, el token ya fue validado por el middleware
      return responseSuccess(res, 'Token válido', {
        user: req.user
      });
    } catch (error) {
      console.error('Error en verifyToken:', error);
      return responseError(res, 'Token inválido', 401);
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validar campos requeridos
      if (!currentPassword || !newPassword || !confirmPassword) {
        return responseError(res, 'Todos los campos son requeridos', 400);
      }

      // Verificar que las nuevas contraseñas coincidan
      if (newPassword !== confirmPassword) {
        return responseError(res, 'Las nuevas contraseñas no coinciden', 400);
      }

      // Validar longitud mínima de contraseña
      if (newPassword.length < 6) {
        return responseError(res, 'La contraseña debe tener al menos 6 caracteres', 400);
      }

      // Cambiar contraseña
      await AuthService.changePassword(userId, currentPassword, newPassword);

      return responseSuccess(res, 'Contraseña cambiada exitosamente');
    } catch (error) {
      console.error('Error en changePassword:', error);
      
      if (error.message === 'Contraseña actual incorrecta') {
        return responseError(res, 'La contraseña actual es incorrecta', 400);
      }

      return responseError(res, 'Error al cambiar contraseña', 500);
    }
  }

  // Refrescar token
  static async refreshToken(req, res) {
    try {
      const userId = req.user.id;
      
      // Obtener datos actuales del usuario
      const userProfile = await AuthService.getProfile(userId);
      
      // Generar nuevo token
      const newToken = AuthService.generateToken({
        id: userProfile.id,
        username: userProfile.username,
        perfil: userProfile.perfil,
        id_empleado: userProfile.id_empleado
      });

      // Configurar nueva cookie
      res.cookie('token', newToken, cookieConfig);

      return responseSuccess(res, 'Token renovado exitosamente', {
        token: newToken,
        user: userProfile
      });
    } catch (error) {
      console.error('Error en refreshToken:', error);
      return responseError(res, 'Error al renovar token', 500);
    }
  }
}

module.exports = AuthController;