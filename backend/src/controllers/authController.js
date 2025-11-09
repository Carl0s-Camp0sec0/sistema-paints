// backend/src/controllers/authController.js - VERSIÓN FINAL SIN ERRORES
const { responseSuccess, responseError } = require('../utils/responses');
const { executeQuery } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const crypto = require('crypto');

class AuthController {
  
  /**
   * Login de usuario - CORREGIDO SIN ERROR DE THIS
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar datos de entrada
      if (!username || !password) {
        return responseError(res, 'Username y password son requeridos', 400);
      }

      // Buscar usuario en base de datos - CONSULTA CORREGIDA
      const userQuery = `
        SELECT 
          u.id_usuario,
          u.username,
          u.password_hash,
          u.salt,
          u.perfil_usuario,
          u.estado,
          u.intentos_login,
          u.nombre_completo,
          u.id_empleado,
          COALESCE(e.nombres, '') as nombres,
          COALESCE(e.apellidos, '') as apellidos,
          COALESCE(e.id_sucursal, NULL) as id_sucursal,
          COALESCE(s.nombre, 'Sin sucursal') as sucursal_nombre
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.username = ?
      `;

      const users = await executeQuery(userQuery, [username]);

      if (!users || users.length === 0) {
        return responseError(res, 'Credenciales inválidas', 401);
      }

      const user = users[0];

      // Verificar si el usuario está activo
      if (!user.estado) {
        return responseError(res, 'Usuario desactivado', 401);
      }

      // Verificar intentos de login excesivos
      if (user.intentos_login >= 5) {
        return responseError(res, 'Cuenta bloqueada por múltiples intentos fallidos. Contacte al administrador.', 423);
      }

      // Verificar contraseña - CORRECCIÓN: usar AuthController.verifyPassword
      const isValidPassword = await AuthController.verifyPassword(password, user.salt, user.password_hash);
      
      if (!isValidPassword) {
        // Incrementar intentos fallidos
        await executeQuery(
          'UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id_usuario = ?',
          [user.id_usuario]
        );
        
        return responseError(res, 'Credenciales inválidas', 401);
      }

      // Resetear intentos fallidos y actualizar último acceso
      await executeQuery(
        'UPDATE usuarios SET intentos_login = 0, ultimo_acceso = NOW() WHERE id_usuario = ?',
        [user.id_usuario]
      );

      // Generar token JWT - CORRECCIÓN: asegurar estructura correcta
      const tokenData = {
        id_usuario: user.id_usuario,
        username: user.username,
        perfil_usuario: user.perfil_usuario
      };

      const token = generateToken(tokenData);

      // Configurar cookie con token
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      // Respuesta exitosa
      return responseSuccess(res, 'Login exitoso', {
        user: {
          id: user.id_usuario,
          username: user.username,
          perfil: user.perfil_usuario,
          nombre_completo: user.nombre_completo,
          sucursal: user.sucursal_nombre,
          id_empleado: user.id_empleado
        },
        token
      });

    } catch (error) {
      console.error('Error en login:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  }

  /**
   * Obtener perfil del usuario autenticado - CORREGIDO
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      // Obtener información completa del usuario - CONSULTA CORREGIDA
      const userQuery = `
        SELECT 
          u.id_usuario,
          u.username,
          u.perfil_usuario,
          u.nombre_completo,
          u.email,
          u.ultimo_acceso,
          u.id_empleado,
          COALESCE(e.nombres, '') as nombres,
          COALESCE(e.apellidos, '') as apellidos,
          COALESCE(e.telefono, '') as telefono,
          COALESCE(e.id_sucursal, NULL) as id_sucursal,
          COALESCE(s.nombre, 'Sin sucursal') as sucursal_nombre,
          COALESCE(s.direccion, '') as sucursal_direccion
        FROM usuarios u
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
        LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
        WHERE u.id_usuario = ?
      `;

      const users = await executeQuery(userQuery, [user.id_usuario]);

      if (!users || users.length === 0) {
        return responseError(res, 'Usuario no encontrado', 404);
      }

      const userInfo = users[0];

      return responseSuccess(res, 'Perfil obtenido exitosamente', {
        id: userInfo.id_usuario,
        username: userInfo.username,
        perfil: userInfo.perfil_usuario,
        nombre_completo: userInfo.nombre_completo,
        email: userInfo.email,
        ultimo_acceso: userInfo.ultimo_acceso,
        empleado: {
          id: userInfo.id_empleado,
          nombres: userInfo.nombres,
          apellidos: userInfo.apellidos,
          telefono: userInfo.telefono
        },
        sucursal: {
          id: userInfo.id_sucursal,
          nombre: userInfo.sucursal_nombre,
          direccion: userInfo.sucursal_direccion
        }
      });

    } catch (error) {
      console.error('Error en getProfile:', error);
      return responseError(res, 'Error al obtener perfil', 500);
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
      return responseError(res, 'Error al cerrar sesión', 500);
    }
  }

  /**
   * Verificar token
   */
  static async verifyToken(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return responseError(res, 'Token inválido', 401);
      }

      return responseSuccess(res, 'Token válido', {
        user: {
          id: user.id_usuario,
          username: user.username,
          perfil: user.perfil_usuario,
          nombre_completo: user.nombre_completo,
          sucursal: user.sucursal_nombre
        }
      });

    } catch (error) {
      console.error('Error en verifyToken:', error);
      return responseError(res, 'Error al verificar token', 500);
    }
  }

  /**
   * Verificar contraseña con SHA256 + salt - MÉTODO ESTÁTICO CORREGIDO
   */
  static async verifyPassword(password, salt, hash) {
    try {
      // Crear hash con la contraseña proporcionada y el salt
      const hasher = crypto.createHash('sha256');
      hasher.update(password + salt);
      const computedHash = hasher.digest('hex');
      
      console.log('🔐 Verificando contraseña:');
      console.log('   Password:', password);
      console.log('   Salt:', salt);
      console.log('   Hash esperado:', hash);
      console.log('   Hash calculado:', computedHash);
      console.log('   ¿Coinciden?', computedHash === hash);
      
      // Comparar con el hash almacenado
      return computedHash === hash;
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      return false;
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id_usuario;

      // Validar datos de entrada
      if (!currentPassword || !newPassword) {
        return responseError(res, 'Contraseña actual y nueva contraseña son requeridas', 400);
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

      // Verificar contraseña actual - CORRECCIÓN: usar AuthController.verifyPassword
      const isCurrentPasswordValid = await AuthController.verifyPassword(currentPassword, user.salt, user.password_hash);
      
      if (!isCurrentPasswordValid) {
        return responseError(res, 'Contraseña actual incorrecta', 400);
      }

      // Generar nuevo salt y hash
      const newSalt = crypto.randomBytes(16).toString('hex');
      const hasher = crypto.createHash('sha256');
      hasher.update(newPassword + newSalt);
      const newHash = hasher.digest('hex');

      // Actualizar en base de datos
      await executeQuery(
        'UPDATE usuarios SET password_hash = ?, salt = ? WHERE id_usuario = ?',
        [newHash, newSalt, userId]
      );

      return responseSuccess(res, 'Contraseña actualizada exitosamente');

    } catch (error) {
      console.error('Error en changePassword:', error);
      return responseError(res, 'Error al cambiar contraseña', 500);
    }
  }

  /**
   * Obtener información básica del sistema para el dashboard
   */
  static async getDashboardInfo(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      // Obtener contadores básicos
      const dashboardQuery = `
        SELECT 
          (SELECT COUNT(*) FROM sucursales WHERE estado = 'Activo') as total_sucursales,
          (SELECT COUNT(*) FROM categorias_productos WHERE estado = 'Activo') as total_categorias,
          (SELECT COUNT(*) FROM productos WHERE estado = 'Activo') as total_productos,
          (SELECT COUNT(*) FROM clientes WHERE estado = 'Activo') as total_clientes,
          (SELECT COUNT(*) FROM empleados WHERE estado = 'Activo') as total_empleados
      `;

      const dashboard = await executeQuery(dashboardQuery);

      return responseSuccess(res, 'Información del dashboard obtenida exitosamente', {
        user: {
          id: user.id_usuario,
          username: user.username,
          perfil: user.perfil_usuario,
          nombre_completo: user.nombre_completo,
          sucursal: user.sucursal_nombre
        },
        statistics: dashboard[0]
      });

    } catch (error) {
      console.error('Error en getDashboardInfo:', error);
      return responseError(res, 'Error al obtener información del dashboard', 500);
    }
  }
}

module.exports = AuthController;