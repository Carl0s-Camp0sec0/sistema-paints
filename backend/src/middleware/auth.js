// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { responseError } = require('../utils/responses');

/**
 * Middleware para autenticar token JWT
 */
async function authenticateToken(req, res, next) {
  try {
    // Obtener token del header o cookies
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies?.authToken;

    if (!token) {
      return responseError(res, 'Token de acceso requerido', 401);
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure');
    
    // Verificar si el usuario aún existe y está activo - ESTRUCTURA ACTUALIZADA
    const userQuery = `
      SELECT 
        u.id_usuario,
        u.username,
        u.perfil_usuario,  -- CAMBIADO: ahora es ENUM directo
        u.estado,
        e.id_empleado,
        e.nombres,
        e.apellidos,
        e.id_sucursal,
        s.nombre as sucursal_nombre
      FROM usuarios u
      LEFT JOIN empleados e ON u.id_usuario = e.id_usuario
      LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
      WHERE u.id_usuario = ? AND u.estado = 1
    `;
    
    const users = await executeQuery(userQuery, [decoded.userId]);
    
    if (!users || users.length === 0) {
      return responseError(res, 'Usuario no válido o inactivo', 401);
    }

    const user = users[0];
    
    // Agregar información del usuario al request
    req.user = {
      id_usuario: user.id_usuario,
      username: user.username,
      perfil_usuario: user.perfil_usuario, // CAMBIADO: estructura simplificada
      id_empleado: user.id_empleado,
      nombres: user.nombres,
      apellidos: user.apellidos,
      id_sucursal: user.id_sucursal,
      sucursal_nombre: user.sucursal_nombre
    };

    next();
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    
    if (error.name === 'TokenExpiredError') {
      return responseError(res, 'Token expirado', 401);
    }
    
    if (error.name === 'JsonWebTokenError') {
      return responseError(res, 'Token inválido', 401);
    }
    
    return responseError(res, 'Error de autenticación', 401);
  }
}

/**
 * Middleware para autorizar roles específicos - ACTUALIZADO
 */
function authorizeRoles(allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      const userRole = req.user.perfil_usuario; // CAMBIADO: acceso directo al ENUM
      
      if (!allowedRoles.includes(userRole)) {
        return responseError(res, 'No tienes permisos para realizar esta acción', 403);
      }

      next();
    } catch (error) {
      console.error('Error en authorizeRoles:', error);
      return responseError(res, 'Error de autorización', 500);
    }
  };
}

/**
 * Middleware específico para Gerente
 */
function requireGerente(req, res, next) {
  return authorizeRoles(['Gerente'])(req, res, next);
}

/**
 * Middleware específico para Gerente o Digitador
 */
function requireGerenteOrDigitador(req, res, next) {
  return authorizeRoles(['Gerente', 'Digitador'])(req, res, next);
}

/**
 * Middleware de autenticación básica (cualquier usuario logueado)
 */
function requireAuth(req, res, next) {
  return authenticateToken(req, res, next);
}

/**
 * Verificar permisos granulares (para futura implementación)
 */
async function checkPermission(userId, module, action) {
  try {
    // Para compatibilidad futura si implementas la tabla permisos
    const permissionQuery = `
      SELECT COUNT(*) as has_permission
      FROM permisos 
      WHERE id_usuario = ? 
        AND modulo = ? 
        AND puede_${action} = 1 
        AND estado = 1
    `;
    
    const result = await executeQuery(permissionQuery, [userId, module]);
    return result[0].has_permission > 0;
  } catch (error) {
    // Si no existe la tabla permisos, usar roles básicos
    console.log('Usando sistema de roles básico');
    return true;
  }
}

/**
 * Generar token JWT
 */
function generateToken(user) {
  const payload = {
    userId: user.id_usuario,
    username: user.username,
    perfil: user.perfil_usuario, // CAMBIADO: estructura simplificada
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

/**
 * Verificar token sin middleware (para funciones auxiliares)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure');
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireGerente,
  requireGerenteOrDigitador,
  requireAuth,
  checkPermission,
  generateToken,
  verifyToken
};