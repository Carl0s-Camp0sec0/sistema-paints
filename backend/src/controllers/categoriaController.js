// backend/src/controllers/categoriaController.js
const CategoriaService = require('../services/categoriaService');
const { responseSuccess, responseError, responsePaginated } = require('../utils/responses');

class CategoriaController {
  
  // Obtener todas las categorías
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      if (page < 1 || limit < 1 || limit > 100) {
        return responseError(res, 'Parámetros de paginación inválidos', 400);
      }

      const result = await CategoriaService.getAllCategorias(page, limit, search);

      return responsePaginated(
        res, 
        'Categorías obtenidas exitosamente',
        result.categorias,
        {
          page,
          limit,
          total: result.total
        }
      );
    } catch (error) {
      console.error('Error en getAll categorías:', error);
      return responseError(res, 'Error al obtener categorías', 500);
    }
  }

  // Obtener categoría por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const categoria = await CategoriaService.getCategoriaById(id);
      
      return responseSuccess(res, 'Categoría obtenida exitosamente', categoria);
    } catch (error) {
      console.error('Error en getById categoría:', error);
      
      if (error.message === 'ID de categoría inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Categoría no encontrada') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al obtener categoría', 500);
    }
  }

  // Crear nueva categoría
  static async create(req, res) {
    try {
      const categoriaData = req.body;
      
      const newCategoria = await CategoriaService.createCategoria(categoriaData);
      
      return responseSuccess(res, 'Categoría creada exitosamente', newCategoria, 201);
    } catch (error) {
      console.error('Error en create categoría:', error);
      
      if (error.message.includes('requerido') || 
          error.message.includes('inválido') ||
          error.message.includes('exceder') ||
          error.message.includes('caracteres') ||
          error.message.includes('Ya existe')) {
        return responseError(res, error.message, 400);
      }

      return responseError(res, 'Error al crear categoría', 500);
    }
  }

  // Actualizar categoría
  static async update(req, res) {
    try {
      const { id } = req.params;
      const categoriaData = req.body;
      
      const updatedCategoria = await CategoriaService.updateCategoria(id, categoriaData);
      
      return responseSuccess(res, 'Categoría actualizada exitosamente', updatedCategoria);
    } catch (error) {
      console.error('Error en update categoría:', error);
      
      if (error.message === 'ID de categoría inválido' ||
          error.message === 'No hay datos para actualizar' ||
          error.message.includes('caracteres') ||
          error.message.includes('inválido')) {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Categoría no encontrada') {
        return responseError(res, error.message, 404);
      }
      
      if (error.message.includes('Ya existe')) {
        return responseError(res, error.message, 409);
      }

      return responseError(res, 'Error al actualizar categoría', 500);
    }
  }

  // Eliminar categoría
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      await CategoriaService.deleteCategoria(id);
      
      return responseSuccess(res, 'Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error en delete categoría:', error);
      
      if (error.message === 'ID de categoría inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Categoría no encontrada') {
        return responseError(res, error.message, 404);
      }
      
      if (error.message.includes('productos asociados')) {
        return responseError(res, error.message, 409);
      }

      return responseError(res, 'Error al eliminar categoría', 500);
    }
  }

  // Obtener categorías para select
  static async getForSelect(req, res) {
    try {
      const categorias = await CategoriaService.getCategoriasForSelect();
      
      return responseSuccess(res, 'Categorías para select obtenidas', categorias);
    } catch (error) {
      console.error('Error en getForSelect categorías:', error);
      return responseError(res, 'Error al obtener categorías', 500);
    }
  }

  // Obtener estadísticas de categorías
  static async getStats(req, res) {
    try {
      const stats = await CategoriaService.getCategoriaStats();
      
      return responseSuccess(res, 'Estadísticas de categorías obtenidas', stats);
    } catch (error) {
      console.error('Error en getStats categorías:', error);
      return responseError(res, 'Error al obtener estadísticas', 500);
    }
  }
}

module.exports = CategoriaController;