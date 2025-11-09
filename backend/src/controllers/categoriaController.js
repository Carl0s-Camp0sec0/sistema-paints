// backend/src/controllers/categoriaController.js - VERSIÓN CORREGIDA COMPLETA
const CategoriaRepository = require('../repositories/categoriaRepository');
const { responseSuccess, responseError } = require('../utils/responses');

class CategoriaController {

  // Obtener todas las categorías
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const search = req.query.search || '';

      const result = await CategoriaRepository.findAll(page, limit, search);

      return responseSuccess(res, 'Categorías obtenidas exitosamente', {
        categorias: result.categorias,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error en getAll categorías:', error);
      return responseError(res, 'Error al obtener categorías', 500);
    }
  }

  // Obtener categoría por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de categoría inválido', 400);
      }

      const categoria = await CategoriaRepository.findById(id);

      if (!categoria) {
        return responseError(res, 'Categoría no encontrada', 404);
      }

      // Obtener estadísticas de la categoría
      const stats = await CategoriaRepository.getStats(id);
      categoria.estadisticas = stats;

      return responseSuccess(res, 'Categoría obtenida exitosamente', categoria);
    } catch (error) {
      console.error('Error en getById categoría:', error);
      return responseError(res, 'Error al obtener categoría', 500);
    }
  }

  // Crear nueva categoría
  static async create(req, res) {
    try {
      const { nombre, descripcion } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim().length === 0) {
        return responseError(res, 'El nombre de la categoría es requerido', 400);
      }

      if (nombre.trim().length < 2) {
        return responseError(res, 'El nombre debe tener al menos 2 caracteres', 400);
      }

      if (nombre.trim().length > 100) {
        return responseError(res, 'El nombre no puede exceder 100 caracteres', 400);
      }

      // Verificar si ya existe una categoría con ese nombre
      const existsByName = await CategoriaRepository.existsByName(nombre.trim());
      if (existsByName) {
        return responseError(res, 'Ya existe una categoría con ese nombre', 409);
      }

      const categoriaData = {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null
      };

      const categoriaId = await CategoriaRepository.create(categoriaData);

      const nuevaCategoria = await CategoriaRepository.findById(categoriaId);

      return responseSuccess(res, 'Categoría creada exitosamente', nuevaCategoria, 201);
    } catch (error) {
      console.error('Error en create categoría:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return responseError(res, 'Ya existe una categoría con ese nombre', 409);
      }
      
      return responseError(res, 'Error al crear categoría', 500);
    }
  }

  // Actualizar categoría existente
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de categoría inválido', 400);
      }

      // Verificar si la categoría existe
      const existingCategoria = await CategoriaRepository.findById(id);
      if (!existingCategoria) {
        return responseError(res, 'Categoría no encontrada', 404);
      }

      // Validar nombre si se proporciona
      if (nombre !== undefined) {
        if (!nombre || nombre.trim().length === 0) {
          return responseError(res, 'El nombre de la categoría es requerido', 400);
        }

        if (nombre.trim().length < 2) {
          return responseError(res, 'El nombre debe tener al menos 2 caracteres', 400);
        }

        if (nombre.trim().length > 100) {
          return responseError(res, 'El nombre no puede exceder 100 caracteres', 400);
        }

        // Verificar nombre duplicado
        const existsByName = await CategoriaRepository.existsByName(nombre.trim(), id);
        if (existsByName) {
          return responseError(res, 'Ya existe una categoría con ese nombre', 409);
        }
      }

      const updateData = {};
      
      if (nombre !== undefined) {
        updateData.nombre = nombre.trim();
      }
      
      if (descripcion !== undefined) {
        updateData.descripcion = descripcion?.trim() || null;
      }

      if (Object.keys(updateData).length === 0) {
        return responseError(res, 'No hay datos para actualizar', 400);
      }

      const updated = await CategoriaRepository.update(id, updateData);

      if (!updated) {
        return responseError(res, 'No se pudo actualizar la categoría', 400);
      }

      const updatedCategoria = await CategoriaRepository.findById(id);

      return responseSuccess(res, 'Categoría actualizada exitosamente', updatedCategoria);
    } catch (error) {
      console.error('Error en update categoría:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return responseError(res, 'Ya existe una categoría con ese nombre', 409);
      }
      
      return responseError(res, 'Error al actualizar categoría', 500);
    }
  }

  // Eliminar categoría (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de categoría inválido', 400);
      }

      const categoria = await CategoriaRepository.findById(id);
      if (!categoria) {
        return responseError(res, 'Categoría no encontrada', 404);
      }

      // Verificar si tiene productos asociados
      const hasProducts = await CategoriaRepository.hasProducts(id);
      if (hasProducts) {
        return responseError(res, 'No se puede eliminar la categoría porque tiene productos asociados', 400);
      }

      const deleted = await CategoriaRepository.delete(id);

      if (!deleted) {
        return responseError(res, 'No se pudo eliminar la categoría', 400);
      }

      return responseSuccess(res, 'Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error en delete categoría:', error);
      
      if (error.message.includes('productos asociados')) {
        return responseError(res, 'No se puede eliminar la categoría porque tiene productos asociados', 400);
      }
      
      return responseError(res, 'Error al eliminar categoría', 500);
    }
  }

  // Obtener categorías para dropdown/select
  static async getForSelect(req, res) {
    try {
      const categorias = await CategoriaRepository.getForSelect();
      return responseSuccess(res, 'Categorías obtenidas exitosamente', categorias);
    } catch (error) {
      console.error('Error en getForSelect categorías:', error);
      return responseError(res, 'Error al obtener categorías', 500);
    }
  }

  // Buscar categorías
  static async search(req, res) {
    try {
      const { termino } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;

      if (!termino || termino.trim().length < 2) {
        return responseError(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const result = await CategoriaRepository.findAll(page, limit, termino.trim());

      return responseSuccess(res, 'Búsqueda completada exitosamente', {
        categorias: result.categorias,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error en search categorías:', error);
      return responseError(res, 'Error al buscar categorías', 500);
    }
  }

  // Obtener estadísticas de una categoría
  static async getStats(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de categoría inválido', 400);
      }

      const categoria = await CategoriaRepository.findById(id);
      if (!categoria) {
        return responseError(res, 'Categoría no encontrada', 404);
      }

      const stats = await CategoriaRepository.getStats(id);

      return responseSuccess(res, 'Estadísticas obtenidas exitosamente', stats);
    } catch (error) {
      console.error('Error en getStats categoría:', error);
      return responseError(res, 'Error al obtener estadísticas', 500);
    }
  }
}

module.exports = CategoriaController;