// backend/src/services/categoriaService.js
const CategoriaRepository = require('../repositories/categoriaRepository');

class CategoriaService {
  
  // Obtener todas las categorías con paginación
  static async getAllCategorias(page = 1, limit = 10, search = '') {
    try {
      const result = await CategoriaRepository.findAll(page, limit, search);
      return result;
    } catch (error) {
      console.error('Error en getAllCategorias:', error);
      throw error;
    }
  }

  // Obtener categoría por ID
  static async getCategoriaById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      const categoria = await CategoriaRepository.findById(id);
      
      if (!categoria) {
        throw new Error('Categoría no encontrada');
      }

      return categoria;
    } catch (error) {
      console.error('Error en getCategoriaById:', error);
      throw error;
    }
  }

  // Crear nueva categoría
  static async createCategoria(categoriaData) {
    try {
      // Validar datos requeridos
      this.validateCategoriaData(categoriaData);

      // Verificar si ya existe una categoría con el mismo nombre
      const exists = await CategoriaRepository.existsByName(categoriaData.nombre);
      if (exists) {
        throw new Error('Ya existe una categoría con este nombre');
      }

      const categoriaId = await CategoriaRepository.create(categoriaData);
      return await this.getCategoriaById(categoriaId);
    } catch (error) {
      console.error('Error en createCategoria:', error);
      throw error;
    }
  }

  // Actualizar categoría
  static async updateCategoria(id, categoriaData) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      // Verificar que la categoría existe
      await this.getCategoriaById(id);

      // Validar datos si se proporcionan
      if (Object.keys(categoriaData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      // Validar nombre único si se está actualizando
      if (categoriaData.nombre) {
        this.validateCategoriaName(categoriaData.nombre);
        
        const exists = await CategoriaRepository.existsByName(categoriaData.nombre, id);
        if (exists) {
          throw new Error('Ya existe una categoría con este nombre');
        }
      }

      // Validar descripción si se proporciona
      if (categoriaData.descripcion !== undefined) {
        this.validateCategoriaDescription(categoriaData.descripcion);
      }

      const updated = await CategoriaRepository.update(id, categoriaData);
      
      if (!updated) {
        throw new Error('No se pudo actualizar la categoría');
      }

      return await this.getCategoriaById(id);
    } catch (error) {
      console.error('Error en updateCategoria:', error);
      throw error;
    }
  }

  // Eliminar categoría (soft delete)
  static async deleteCategoria(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      // Verificar que la categoría existe
      await this.getCategoriaById(id);

      // Verificar si la categoría tiene productos asociados
      const hasProducts = await CategoriaRepository.hasProducts(id);
      if (hasProducts) {
        throw new Error('No se puede eliminar la categoría porque tiene productos asociados');
      }

      const deleted = await CategoriaRepository.delete(id);
      
      if (!deleted) {
        throw new Error('No se pudo eliminar la categoría');
      }

      return true;
    } catch (error) {
      console.error('Error en deleteCategoria:', error);
      throw error;
    }
  }

  // Obtener categorías para select
  static async getCategoriasForSelect() {
    try {
      return await CategoriaRepository.getForSelect();
    } catch (error) {
      console.error('Error en getCategoriasForSelect:', error);
      throw error;
    }
  }

  // Obtener estadísticas de categorías
  static async getCategoriaStats() {
    try {
      return await CategoriaRepository.getStats();
    } catch (error) {
      console.error('Error en getCategoriaStats:', error);
      throw error;
    }
  }

  // Validar datos de categoría
  static validateCategoriaData(data) {
    if (!data.nombre || data.nombre.trim() === '') {
      throw new Error('El nombre de la categoría es requerido');
    }

    this.validateCategoriaName(data.nombre);
    
    if (data.descripcion !== undefined) {
      this.validateCategoriaDescription(data.descripcion);
    }
  }

  // Validar nombre de categoría
  static validateCategoriaName(nombre) {
    if (typeof nombre !== 'string') {
      throw new Error('El nombre debe ser un texto válido');
    }

    const trimmedName = nombre.trim();
    
    if (trimmedName.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (trimmedName.length > 50) {
      throw new Error('El nombre no puede exceder 50 caracteres');
    }

    // Validar que contenga solo letras, números, espacios y algunos caracteres especiales
    if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ\-_]+$/.test(trimmedName)) {
      throw new Error('El nombre contiene caracteres no válidos');
    }
  }

  // Validar descripción de categoría
  static validateCategoriaDescription(descripcion) {
    if (descripcion !== null && descripcion !== undefined) {
      if (typeof descripcion !== 'string') {
        throw new Error('La descripción debe ser un texto válido');
      }

      if (descripcion.trim().length > 200) {
        throw new Error('La descripción no puede exceder 200 caracteres');
      }
    }
  }
}

module.exports = CategoriaService;