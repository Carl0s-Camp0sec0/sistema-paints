// backend/src/utils/responses.js - VERSIÓN COMPLETA
/**
 * Función para respuestas exitosas
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de éxito
 * @param {*} data - Datos a enviar (opcional)
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 */
const responseSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  // Solo agregar data si no es null o undefined
  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Función para respuestas de error
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP (default: 400)
 * @param {*} details - Detalles adicionales del error (opcional)
 */
const responseError = (res, message, statusCode = 400, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  // Solo agregar details si no es null o undefined
  if (details !== null && details !== undefined) {
    response.details = details;
  }

  // Log del error para debugging
  console.error(`Error Response [${statusCode}]:`, message, details || '');

  return res.status(statusCode).json(response);
};

/**
 * Función para respuestas de paginación
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de éxito
 * @param {Array} data - Array de datos
 * @param {Object} pagination - Información de paginación
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 */
const responsePaginated = (res, message, data, pagination, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.total || data.length,
      itemsPerPage: pagination.limit || data.length,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    },
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Función para respuestas de validación
 * @param {Object} res - Objeto response de Express
 * @param {Array} errors - Array de errores de validación
 * @param {string} message - Mensaje principal (opcional)
 */
const responseValidation = (res, errors, message = 'Errores de validación') => {
  const response = {
    success: false,
    error: message,
    validation_errors: errors,
    timestamp: new Date().toISOString()
  };

  return res.status(422).json(response);
};

/**
 * Función para respuestas de autenticación fallida
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error de autenticación
 */
const responseUnauthorized = (res, message = 'No autorizado') => {
  return responseError(res, message, 401);
};

/**
 * Función para respuestas de acceso prohibido
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error de permisos
 */
const responseForbidden = (res, message = 'Acceso prohibido') => {
  return responseError(res, message, 403);
};

/**
 * Función para respuestas de recurso no encontrado
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error de recurso no encontrado
 */
const responseNotFound = (res, message = 'Recurso no encontrado') => {
  return responseError(res, message, 404);
};

/**
 * Función para respuestas de conflicto
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error de conflicto
 */
const responseConflict = (res, message = 'Conflicto de datos') => {
  return responseError(res, message, 409);
};

/**
 * Función para respuestas de error interno del servidor
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error interno
 * @param {*} error - Error object para logging (opcional)
 */
const responseInternalError = (res, message = 'Error interno del servidor', error = null) => {
  if (error) {
    console.error('Internal Server Error:', error);
  }

  return responseError(res, message, 500);
};

/**
 * Middleware para manejar rutas no encontradas
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
const handleNotFound = (req, res) => {
  return responseNotFound(res, `Ruta ${req.method} ${req.path} no encontrada`);
};

/**
 * Middleware para manejar errores globales
 * @param {Error} err - Error object
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 */
const handleGlobalError = (err, req, res, next) => {
  console.error('Global Error Handler:', err);

  // Error de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return responseError(res, 'JSON inválido en el cuerpo de la petición', 400);
  }

  // Error de archivo muy grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return responseError(res, 'Archivo demasiado grande', 413);
  }

  // Error de conexión a base de datos
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return responseInternalError(res, 'Error de conexión a la base de datos');
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return responseUnauthorized(res, 'Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    return responseUnauthorized(res, 'Token expirado');
  }

  // Errores de base de datos MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return responseConflict(res, 'Ya existe un registro con esos datos');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return responseError(res, 'Referencia no válida en base de datos', 400);
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return responseError(res, 'No se puede eliminar: registro tiene dependencias', 400);
  }

  // Error genérico
  return responseInternalError(res, 'Error interno del servidor', err);
};

module.exports = {
  responseSuccess,
  responseError,
  responsePaginated,
  responseValidation,
  responseUnauthorized,
  responseForbidden,
  responseNotFound,
  responseConflict,
  responseInternalError,
  handleNotFound,
  handleGlobalError
};