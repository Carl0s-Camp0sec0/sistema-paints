// backend/src/middleware/auth.js - VERSIÓN FINAL CORREGIDA PARA TU ESTRUCTURA
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { responseError } = require('../utils/responses');

/**
 * Middleware para autenticar token JWT - CORREGIDO CON RELACIÓN CORRECTA
 */
async function authenticateToken(req, res, next) {
  try {
    // Obtener token del header o cookies
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies?.authToken;

    if (!token) {
      console.log('No token provided');
      return responseError(res, 'Token de acceso requerido', 401);
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure');
    
    console.log('Token decoded:', decoded); // Para debugging

    // CORRECCIÓN: Verificar que el decoded tenga la información necesaria
    const userId = decoded.userId || decoded.id || decoded.user_id;
    
    if (!userId) {
      console.error('Token no contiene ID de usuario válido:', decoded);
      return responseError(res, 'Token inválido: falta información del usuario', 401);
    }

    // Verificar si el usuario aún existe y está activo - CONSULTA CORREGIDA
    const userQuery = `
      SELECT 
        u.id_usuario,
        u.username,
        u.perfil_usuario,
        u.estado,
        u.nombre_completo,
        u.id_empleado,
        COALESCE(e.nombres, '') as nombres,
        COALESCE(e.apellidos, '') as apellidos,
        COALESCE(e.id_sucursal, NULL) as id_sucursal,
        COALESCE(s.nombre, 'Sin sucursal') as sucursal_nombre
      FROM usuarios u
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
      WHERE u.id_usuario = ?
        AND u.estado = 1
    `;
    
    console.log('Ejecutando query con userId:', userId); // Para debugging
    
    const users = await executeQuery(userQuery, [userId]);
    
    if (!users || users.length === 0) {
      console.error('Usuario no encontrado o inactivo para ID:', userId);
      return responseError(res, 'Usuario no válido o inactivo', 401);
    }

    const user = users[0];
    
    // Agregar información del usuario al request
    req.user = {
      id_usuario: user.id_usuario,
      username: user.username,
      perfil_usuario: user.perfil_usuario,
      nombre_completo: user.nombre_completo,
      id_empleado: user.id_empleado,
      nombres: user.nombres,
      apellidos: user.apellidos,
      id_sucursal: user.id_sucursal,
      sucursal_nombre: user.sucursal_nombre
    };

    console.log('Usuario autenticado:', req.user.username); // Para debugging

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
 * Middleware para autorizar roles específicos
 */
function authorizeRoles(allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      const userRole = req.user.perfil_usuario;
      
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
 * Middleware de autenticación básica
 */
function requireAuth(req, res, next) {
  return authenticateToken(req, res, next);
}

/**
 * Generar token JWT - CORREGIDO
 */
function generateToken(user) {
  const payload = {
    userId: user.id_usuario || user.id, // CORRECCIÓN: asegurar que el ID se incluya correctamente
    username: user.username,
    perfil: user.perfil_usuario,
    iat: Math.floor(Date.now() / 1000)
  };

  console.log('Generando token con payload:', payload); // Para debugging

  return jwt.sign(payload, process.env.JWT_SECRET || 'paints_system_secret_key_2024_very_secure', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

/**
 * Verificar token sin middleware
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
  generateToken,
  verifyToken
};