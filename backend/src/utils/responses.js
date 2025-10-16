// backend/src/utils/responses.js

// Respuesta exitosa estándar
const responseSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Respuesta de error estándar
const responseError = (res, message, statusCode = 400, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Solo incluir detalles del error en desarrollo
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

// Respuesta para datos paginados
const responsePaginated = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// Respuesta para validaciones
const responseValidation = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: 'Errores de validación',
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  responseSuccess,
  responseError,
  responsePaginated,
  responseValidation
};