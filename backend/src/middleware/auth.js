// backend/src/middleware/auth.js - CORREGIDO PARA TU SISTEMA
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/jwt');
const { responseError } = require('../utils/responses');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization o de las cookies
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.authToken;
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return responseError(res, 'Token de acceso requerido', 401);
    }

    // Verificar y decodificar el token
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) {
        console.log('Error JWT:', err.name);
        if (err.name === 'TokenExpiredError') {
          return responseError(res, 'Token expirado', 401);
        } else if (err.name === 'JsonWebTokenError') {
          return responseError(res, 'Token inválido', 401);
        } else {
          return responseError(res, 'Error de autenticación', 401);
        }
      }

      // Agregar información del usuario al objeto request
      req.user = {
        id: decoded.id || decoded.id_usuario,
        nombre: decoded.nombre || decoded.nombre_completo,
        email: decoded.email,
        rol: decoded.rol || decoded.perfil_usuario,
        id_sucursal: decoded.id_sucursal,
        username: decoded.username
      };

      console.log('Usuario autenticado:', req.user.username, 'Rol:', req.user.rol);
      next();
    });

  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return responseError(res, 'Error interno de autenticación', 500);
  }
};

// Middleware para autorizar roles específicos
const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      // Verificar si el rol del usuario está permitido
      if (!allowedRoles.includes(req.user.rol)) {
        return responseError(res, 'Acceso denegado: permisos insuficientes', 403, {
          requiredRoles: allowedRoles,
          userRole: req.user.rol
        });
      }

      next();

    } catch (error) {
      console.error('Error en authorizeRoles:', error);
      return responseError(res, 'Error interno de autorización', 500);
    }
  };
};

// Middleware para verificar acceso a sucursal específica
const authorizeSucursal = (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    const userSucursal = req.user.id_sucursal;

    // Los gerentes pueden acceder a cualquier sucursal
    if (req.user.rol === 'Gerente') {
      return next();
    }

    // Otros roles solo pueden acceder a su propia sucursal
    if (id_sucursal && parseInt(id_sucursal) !== userSucursal) {
      return responseError(res, 'Acceso denegado: no puede acceder a esta sucursal', 403);
    }

    next();

  } catch (error) {
    console.error('Error en authorizeSucursal:', error);
    return responseError(res, 'Error interno de autorización de sucursal', 500);
  }
};

// Middleware opcional de autenticación (para rutas públicas)
const optionalAuth = (req, res, next) => {
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
      return next();
    }

    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) {
        return next();
      }

      req.user = {
        id: decoded.id || decoded.id_usuario,
        nombre: decoded.nombre || decoded.nombre_completo,
        email: decoded.email,
        rol: decoded.rol || decoded.perfil_usuario,
        id_sucursal: decoded.id_sucursal,
        username: decoded.username
      };

      next();
    });

  } catch (error) {
    next();
  }
};

// Función para verificar permisos específicos
const hasPermission = (req, permission) => {
  if (!req.user) return false;

  const rolePermissions = {
    'Gerente': ['all'],
    'Digitador': ['read', 'create', 'update'],
    'Cajero': ['read']
  };

  const userPermissions = rolePermissions[req.user.rol] || [];
  
  return userPermissions.includes('all') || userPermissions.includes(permission);
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeSucursal,
  optionalAuth,
  hasPermission
};