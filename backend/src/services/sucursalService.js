// backend/src/services/sucursalService.js
const SucursalRepository = require('../repositories/sucursalRepository');

class SucursalService {
  
  // Obtener todas las sucursales con paginación
  static async getAllSucursales(page = 1, limit = 10, search = '') {
    try {
      const result = await SucursalRepository.findAll(page, limit, search);
      return result;
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

      // Verificar si ya existe una sucursal con el mismo nombre
      const exists = await SucursalRepository.existsByName(sucursalData.nombre);
      if (exists) {
        throw new Error('Ya existe una sucursal con este nombre');
      }

      // Validar coordenadas si se proporcionan
      if (sucursalData.latitud || sucursalData.longitud) {
        this.validateCoordinates(sucursalData.latitud, sucursalData.longitud);
      }

      const sucursalId = await SucursalRepository.create(sucursalData);
      return await this.getSucursalById(sucursalId);
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
      await this.getSucursalById(id);

      // Validar datos si se proporcionan
      if (Object.keys(sucursalData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      // Validar nombre único si se está actualizando
      if (sucursalData.nombre) {
        const exists = await SucursalRepository.existsByName(sucursalData.nombre, id);
        if (exists) {
          throw new Error('Ya existe una sucursal con este nombre');
        }
      }

      // Validar coordenadas si se proporcionan
      if (sucursalData.latitud !== undefined || sucursalData.longitud !== undefined) {
        this.validateCoordinates(sucursalData.latitud, sucursalData.longitud);
      }

      const updated = await SucursalRepository.update(id, sucursalData);
      
      if (!updated) {
        throw new Error('No se pudo actualizar la sucursal');
      }

      return await this.getSucursalById(id);
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

      const deleted = await SucursalRepository.delete(id);
      
      if (!deleted) {
        throw new Error('No se pudo eliminar la sucursal');
      }

      return true;
    } catch (error) {
      console.error('Error en deleteSucursal:', error);
      throw error;
    }
  }

  // Obtener sucursales para select
  static async getSucursalesForSelect() {
    try {
      return await SucursalRepository.getForSelect();
    } catch (error) {
      console.error('Error en getSucursalesForSelect:', error);
      throw error;
    }
  }

  // Buscar sucursal más cercana por GPS
  static async findNearestSucursal(lat, lng, limit = 3) {
    try {
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        throw new Error('Coordenadas inválidas');
      }

      this.validateCoordinates(lat, lng);

      return await SucursalRepository.findNearestByCoordinates(lat, lng, limit);
    } catch (error) {
      console.error('Error en findNearestSucursal:', error);
      throw error;
    }
  }

  // Validar datos de sucursal
  static validateSucursalData(data) {
    const requiredFields = ['nombre', 'direccion', 'ciudad', 'departamento'];
    
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        throw new Error(`El campo ${field} es requerido`);
      }
    }

    // Validar longitud de campos
    if (data.nombre.length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres');
    }

    if (data.direccion.length > 200) {
      throw new Error('La dirección no puede exceder 200 caracteres');
    }

    if (data.ciudad.length > 50) {
      throw new Error('La ciudad no puede exceder 50 caracteres');
    }

    if (data.departamento.length > 50) {
      throw new Error('El departamento no puede exceder 50 caracteres');
    }

    if (data.telefono && data.telefono.length > 15) {
      throw new Error('El teléfono no puede exceder 15 caracteres');
    }

    // Validar formato de teléfono si se proporciona
    if (data.telefono && !/^\+?[\d\s\-\(\)]+$/.test(data.telefono)) {
      throw new Error('Formato de teléfono inválido');
    }
  }

  // Validar coordenadas GPS
  static validateCoordinates(lat, lng) {
    if (lat !== null && lng !== null) {
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Las coordenadas deben ser números válidos');
      }

      if (lat < -90 || lat > 90) {
        throw new Error('La latitud debe estar entre -90 y 90 grados');
      }

      if (lng < -180 || lng > 180) {
        throw new Error('La longitud debe estar entre -180 y 180 grados');
      }
    }
  }
}

module.exports = SucursalService;