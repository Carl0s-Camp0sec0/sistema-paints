// backend/src/services/sucursalService.js - CORREGIDO PARA TU CÓDIGO

const SucursalRepository = require('../repositories/sucursalRepository');

class SucursalService {
  
  // Obtener todas las sucursales con paginación
  static async getAllSucursales(page = 1, limit = 10, search = '') {
    try {
      const result = await SucursalRepository.findAll(page, limit, search);
      
      // CORRECCIÓN: Tu repositorio devuelve { data, total, page, limit }
      // pero el controller espera { sucursales, total }
      return {
        sucursales: result.data,  // ← Cambiado de result.data a result.sucursales
        total: result.total,
        page: result.page,
        limit: result.limit
      };
    } catch (error) {
      console.error('Error en getAllSucursales:', error);
      throw error;
    }
  }

  // Obtener sucursal por ID
  static async getSucursalById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de sucursal inválido');
      }

      const sucursal = await SucursalRepository.findById(id);
      
      if (!sucursal) {
        throw new Error('Sucursal no encontrada');
      }

      return sucursal;
    } catch (error) {
      console.error('Error en getSucursalById:', error);
      throw error;
    }
  }

  // Crear nueva sucursal
  static async createSucursal(sucursalData) {
    try {
      // Validar datos requeridos
      this.validateSucursalData(sucursalData);

      // Validar coordenadas si se proporcionan
      if (sucursalData.latitud || sucursalData.longitud) {
        this.validateCoordinates(sucursalData.latitud, sucursalData.longitud);
      }

      const newSucursal = await SucursalRepository.create(sucursalData);
      return newSucursal;
    } catch (error) {
      console.error('Error en createSucursal:', error);
      throw error;
    }
  }

  // Actualizar sucursal
  static async updateSucursal(id, sucursalData) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de sucursal inválido');
      }

      // Verificar que la sucursal existe
      const existingSucursal = await this.getSucursalById(id);
      if (!existingSucursal) {
        throw new Error('Sucursal no encontrada');
      }

      // Validar datos si se proporcionan
      if (Object.keys(sucursalData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      if (sucursalData.latitud || sucursalData.longitud) {
        this.validateCoordinates(sucursalData.latitud, sucursalData.longitud);
      }

      const updatedSucursal = await SucursalRepository.update(id, sucursalData);
      return updatedSucursal;
    } catch (error) {
      console.error('Error en updateSucursal:', error);
      throw error;
    }
  }

  // Eliminar sucursal (soft delete)
  static async deleteSucursal(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de sucursal inválido');
      }

      // Verificar que la sucursal existe
      await this.getSucursalById(id);

      await SucursalRepository.delete(id);
      return true;
    } catch (error) {
      console.error('Error en deleteSucursal:', error);
      throw error;
    }
  }

  // Encontrar sucursal más cercana
  static async findNearestSucursal(lat, lng, limit = 5) {
    try {
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        throw new Error('Coordenadas inválidas');
      }

      const sucursales = await SucursalRepository.findNearest(lat, lng, limit);
      return sucursales;
    } catch (error) {
      console.error('Error en findNearestSucursal:', error);
      throw error;
    }
  }

  // Obtener sucursales para select
  static async getSucursalesForSelect() {
    try {
      const sucursales = await SucursalRepository.getForSelect();
      return sucursales;
    } catch (error) {
      console.error('Error en getSucursalesForSelect:', error);
      throw error;
    }
  }

  // Validar datos de sucursal
  static validateSucursalData(data) {
    const errors = [];

    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre es obligatorio');
    }

    if (!data.direccion || data.direccion.trim().length === 0) {
      errors.push('La dirección es obligatoria');
    }

    if (!data.departamento || data.departamento.trim().length === 0) {
      errors.push('El departamento es obligatorio');
    }

    if (data.nombre && data.nombre.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }

    if (data.direccion && data.direccion.trim().length > 200) {
      errors.push('La dirección no puede exceder 200 caracteres');
    }

    if (data.departamento && data.departamento.trim().length > 50) {
      errors.push('El departamento no puede exceder 50 caracteres');
    }

    if (data.telefono && data.telefono.trim().length > 15) {
      errors.push('El teléfono no puede exceder 15 caracteres');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  // Validar coordenadas GPS
  static validateCoordinates(lat, lng) {
    if (lat && (isNaN(lat) || lat < -90 || lat > 90)) {
      throw new Error('Latitud inválida (debe estar entre -90 y 90)');
    }

    if (lng && (isNaN(lng) || lng < -180 || lng > 180)) {
      throw new Error('Longitud inválida (debe estar entre -180 y 180)');
    }

    // Si se proporciona una coordenada, debe proporcionarse la otra
    if ((lat && !lng) || (!lat && lng)) {
      throw new Error('Debe proporcionar tanto latitud como longitud');
    }
  }
}

module.exports = SucursalService;