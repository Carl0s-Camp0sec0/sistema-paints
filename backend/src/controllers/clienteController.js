// backend/src/controllers/clienteController.js - VERSIÓN COMPLETA FUNCIONAL

const ClienteService = require('../services/clienteService');
const { responseSuccess, responseError } = require('../utils/responses');

class ClienteController {
  
  // Obtener todos los clientes
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const estado = req.query.estado || '';
      const promociones = req.query.promociones || '';

      if (page < 1 || limit < 1 || limit > 100) {
        return responseError(res, 'Parámetros de paginación inválidos', 400);
      }

      const result = await ClienteService.getAllClientes(page, limit, search, estado, promociones);

      return responseSuccess(res, 'Clientes obtenidos exitosamente', result.clientes, 200, {
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
      console.error('Error en getAll clientes:', error);
      return responseError(res, 'Error al obtener clientes', 500);
    }
  }

  // Obtener cliente por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const cliente = await ClienteService.getClienteById(id);
      
      return responseSuccess(res, 'Cliente obtenido exitosamente', cliente);
    } catch (error) {
      console.error('Error en getById cliente:', error);
      
      if (error.message === 'ID de cliente inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Cliente no encontrado') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al obtener cliente', 500);
    }
  }

  // Crear nuevo cliente
  static async create(req, res) {
    try {
      const clienteData = req.body;
      
      const newCliente = await ClienteService.createCliente(clienteData);
      
      return responseSuccess(res, 'Cliente creado exitosamente', newCliente, 201);
    } catch (error) {
      console.error('Error en create cliente:', error);
      
      if (error.message.includes('obligatorio') || 
          error.message.includes('inválido') ||
          error.message.includes('exceder') ||
          error.message.includes('Ya existe')) {
        return responseError(res, error.message, 400);
      }

      return responseError(res, 'Error al crear cliente', 500);
    }
  }

  // Actualizar cliente
  static async update(req, res) {
    try {
      const { id } = req.params;
      const clienteData = req.body;
      
      const updatedCliente = await ClienteService.updateCliente(id, clienteData);
      
      return responseSuccess(res, 'Cliente actualizado exitosamente', updatedCliente);
    } catch (error) {
      console.error('Error en update cliente:', error);
      
      if (error.message === 'ID de cliente inválido' ||
          error.message === 'No hay datos para actualizar') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Cliente no encontrado') {
        return responseError(res, error.message, 404);
      }
      
      if (error.message.includes('Ya existe')) {
        return responseError(res, error.message, 409);
      }

      return responseError(res, 'Error al actualizar cliente', 500);
    }
  }

  // Eliminar cliente (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      await ClienteService.deleteCliente(id);
      
      return responseSuccess(res, 'Cliente eliminado exitosamente', null);
    } catch (error) {
      console.error('Error en delete cliente:', error);
      
      if (error.message === 'ID de cliente inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Cliente no encontrado') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al eliminar cliente', 500);
    }
  }

  // Buscar clientes por término
  static async search(req, res) {
    try {
      const { termino } = req.params;
      
      if (!termino || termino.trim().length < 2) {
        return responseError(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const clientes = await ClienteService.searchClientes(termino.trim());
      
      return responseSuccess(res, 'Búsqueda de clientes completada', clientes);
    } catch (error) {
      console.error('Error en search clientes:', error);
      return responseError(res, 'Error al buscar clientes', 500);
    }
  }

  // Obtener clientes para select/dropdown
  static async getForSelect(req, res) {
    try {
      const clientes = await ClienteService.getClientesForSelect();
      
      return responseSuccess(res, 'Clientes para select obtenidos', clientes);
    } catch (error) {
      console.error('Error en getForSelect clientes:', error);
      return responseError(res, 'Error al obtener clientes', 500);
    }
  }
}

module.exports = ClienteController;