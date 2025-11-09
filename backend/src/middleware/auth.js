// backend/src/middleware/auth.js - BUG DE ROLES CORREGIDO
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

/**
 * Middleware de autenticación JWT
 * Verifica el token y carga la información del usuario
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Intentar obtener token del header Authorization
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Intentar obtener token de las cookies
    const cookieToken = req.cookies?.authToken;
    
    // Usar el token disponible (priorizar header)
    const token = headerToken || cookieToken;

    if (!token) {
      console.log('❌ No se encontró token de autenticación');
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
    }

    console.log('🔐 Authorization header present');

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('❌ Token inválido:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Buscar el usuario en la base de datos
    const query = `
      SELECT 
        u.id_usuario,
        u.username,
        u.perfil_usuario as rol,
        u.nombre_completo,
        u.email,
        u.estado,
        u.ultimo_acceso
      FROM usuarios u 
      WHERE u.id_usuario = ? AND u.estado = 1
    `;

    const usuarios = await executeQuery(query, [decoded.userId]);

    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado o inactivo:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo',
        code: 'USER_NOT_FOUND'
      });
    }

    const usuario = usuarios[0];

    // Agregar información del usuario al request
    req.user = {
      id: usuario.id_usuario,
      username: usuario.username,
      rol: usuario.rol,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      ultimo_acceso: usuario.ultimo_acceso
    };

    console.log(`Usuario autenticado: ${usuario.username} Rol: ${usuario.rol}`);

    next();

  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor en autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware de autorización por rol - CORREGIDO
 * Verifica que el usuario tenga los permisos necesarios
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado - Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // CORRECCIÓN: Verificación de roles mejorada
    const userRole = req.user.rol;
    const hasPermission = roles.includes(userRole);

    console.log(`🔍 Verificando permisos: Usuario ${req.user.username} (${userRole}) - Requeridos: [${roles.join(', ')}] - Permitido: ${hasPermission}`);

    if (!hasPermission) {
      console.log(`❌ Acceso denegado. Usuario ${req.user.username} con rol ${userRole} intentó acceder a recurso que requiere: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: userRole
      });
    }

    console.log(`✅ Acceso autorizado para ${req.user.username} (${userRole})`);
    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No bloquea si no hay token, pero carga el usuario si está presente
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = req.cookies?.authToken;
    const token = headerToken || cookieToken;

    if (!token) {
      // No hay token, continuar sin usuario
      req.user = null;
      return next();
    }

    // Hay token, intentar autenticar
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const query = `
        SELECT 
          u.id_usuario,
          u.username,
          u.perfil_usuario as rol,
          u.nombre_completo,
          u.email
        FROM usuarios u 
        WHERE u.id_usuario = ? AND u.estado = 1
      `;

      const usuarios = await executeQuery(query, [decoded.userId]);

      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        req.user = {
          id: usuario.id_usuario,
          username: usuario.username,
          rol: usuario.rol,
          nombre_completo: usuario.nombre_completo,
          email: usuario.email
        };
      } else {
        req.user = null;
      }

    } catch (jwtError) {
      // Token inválido, continuar sin usuario
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('❌ Error en middleware de autenticación opcional:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};