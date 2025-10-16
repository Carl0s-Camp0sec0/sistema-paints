// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/jwt');
const { responseError } = require('../utils/responses');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization o de las cookies
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies.token;
    
    const token = tokenFromHeader || tokenFromCookie;
    
    if (!token) {
      return responseError(res, 'Token de acceso requerido', 401);
    }

    // Verificar y decodificar el token
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return responseError(res, 'Token expirado', 401);
        }
        if (err.name === 'JsonWebTokenError') {
          return responseError(res, 'Token inválido', 401);
        }
        return responseError(res, 'Error al verificar token', 401);
      }

      // Agregar información del usuario decodificada al request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        perfil: decoded.perfil,
        id_empleado: decoded.id_empleado
      };
      
      next();
    });
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return responseError(res, 'Error interno del servidor', 500);
  }
};

// Middleware para verificar perfiles específicos
const requireProfile = (profiles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return responseError(res, 'Usuario no autenticado', 401);
      }

      const userProfile = req.user.perfil;
      const allowedProfiles = Array.isArray(profiles) ? profiles : [profiles];
      
      if (!allowedProfiles.includes(userProfile)) {
        return responseError(res, 'Permisos insuficientes para esta operación', 403);
      }
      
      next();
    } catch (error) {
      console.error('Error en middleware de perfiles:', error);
      return responseError(res, 'Error interno del servidor', 500);
    }
  };
};

// Middleware para verificar si es Gerente
const requireGerente = requireProfile(['Gerente']);

// Middleware para verificar si es Gerente o Digitador
const requireGerenteOrDigitador = requireProfile(['Gerente', 'Digitador']);

// Middleware para todos los perfiles (solo autenticación)
const requireAuth = authenticateToken;

module.exports = {
  authenticateToken,
  requireProfile,
  requireGerente,
  requireGerenteOrDigitador,
  requireAuth
};