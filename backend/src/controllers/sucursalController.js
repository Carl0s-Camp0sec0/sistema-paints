// backend/src/controllers/sucursalController.js - VERSIÓN COMPLETA CORREGIDA

const SucursalService = require('../services/sucursalService');
const { responseSuccess, responseError } = require('../utils/responses');

class SucursalController {
  
  // Obtener todas las sucursales
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      if (page < 1 || limit < 1 || limit > 100) {
        return responseError(res, 'Parámetros de paginación inválidos', 400);
      }

      const result = await SucursalService.getAllSucursales(page, limit, search);

      // CORRECCIÓN: Estructura de respuesta consistente
      return responseSuccess(res, 'Sucursales obtenidas exitosamente', result.sucursales, 200, {
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / limit),
          totalRecords: result.total,
          hasNext: page * limit < result.total,
          hasPrev: page > 1,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error en getAll sucursales:', error);
      return responseError(res, 'Error al obtener sucursales', 500);
    }
  }

  // Obtener sucursal por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const sucursal = await SucursalService.getSucursalById(id);
      
      return responseSuccess(res, 'Sucursal obtenida exitosamente', sucursal);
    } catch (error) {
      console.error('Error en getById sucursal:', error);
      
      if (error.message === 'ID de sucursal inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Sucursal no encontrada') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al obtener sucursal', 500);
    }
  }

  // Crear nueva sucursal
  static async create(req, res) {
    try {
      const sucursalData = req.body;
      
      const newSucursal = await SucursalService.createSucursal(sucursalData);
      
      return responseSuccess(res, 'Sucursal creada exitosamente', newSucursal, 201);
    } catch (error) {
      console.error('Error en create sucursal:', error);
      
      if (error.message.includes('obligatorio') || 
          error.message.includes('inválido') ||
          error.message.includes('exceder') ||
          error.message.includes('Ya existe')) {
        return responseError(res, error.message, 400);
      }

      return responseError(res, 'Error al crear sucursal', 500);
    }
  }

  // Actualizar sucursal
  static async update(req, res) {
    try {
      const { id } = req.params;
      const sucursalData = req.body;
      
      const updatedSucursal = await SucursalService.updateSucursal(id, sucursalData);
      
      return responseSuccess(res, 'Sucursal actualizada exitosamente', updatedSucursal);
    } catch (error) {
      console.error('Error en update sucursal:', error);
      
      if (error.message === 'ID de sucursal inválido' ||
          error.message === 'No hay datos para actualizar') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Sucursal no encontrada') {
        return responseError(res, error.message, 404);
      }
      
      if (error.message.includes('Ya existe')) {
        return responseError(res, error.message, 409);
      }

      return responseError(res, 'Error al actualizar sucursal', 500);
    }
  }

  // Eliminar sucursal
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      await SucursalService.deleteSucursal(id);
      
      return responseSuccess(res, 'Sucursal eliminada exitosamente', null);
    } catch (error) {
      console.error('Error en delete sucursal:', error);
      
      if (error.message === 'ID de sucursal inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Sucursal no encontrada') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al eliminar sucursal', 500);
    }
  }

  // Buscar sucursal más cercana
  static async findNearest(req, res) {
    try {
      const { lat, lng } = req.query;
      const limit = parseInt(req.query.limit) || 5;

      const sucursales = await SucursalService.findNearestSucursal(parseFloat(lat), parseFloat(lng), limit);
      
      return responseSuccess(res, 'Sucursales cercanas encontradas', sucursales);
    } catch (error) {
      console.error('Error en findNearest:', error);
      
      if (error.message === 'Coordenadas inválidas') {
        return responseError(res, error.message, 400);
      }

      return responseError(res, 'Error al buscar sucursales cercanas', 500);
    }
  }

  // Obtener sucursales para select
  static async getForSelect(req, res) {
    try {
      const sucursales = await SucursalService.getSucursalesForSelect();
      
      return responseSuccess(res, 'Sucursales para select obtenidas', sucursales);
    } catch (error) {
      console.error('Error en getForSelect:', error);
      return responseError(res, 'Error al obtener sucursales', 500);
    }
  }
}

module.exports = SucursalController;