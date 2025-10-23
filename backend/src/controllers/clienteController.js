// backend/src/controllers/clienteController.js

const ClienteService = require('../services/clienteService');
const { responseSuccess, responseError } = require('../utils/responses');

class ClienteController {

  // Obtener todos los clientes con paginación
  static async obtenerClientes(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sortBy = 'nombres',
        sortOrder = 'asc' 
      } = req.query;

      const result = await ClienteService.obtenerClientes(
        parseInt(page), 
        parseInt(limit), 
        search.trim(),
        sortBy,
        sortOrder
      );

      return responseSuccess(res, 'Clientes obtenidos exitosamente', result);
    } catch (error) {
      console.error('Error en obtenerClientes:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener cliente por ID
  static async obtenerClientePorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

  // Actualizar cliente
  static async actualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const clienteData = req.body;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      const cliente = await ClienteService.actualizarCliente(parseInt(id), clienteData);

      return responseSuccess(res, 'Cliente actualizado exitosamente', cliente);
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      if (error.message === 'Cliente no encontrado') {
        return responseError(res, error.message, 404);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Eliminar cliente (soft delete)
  static async eliminarCliente(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      await ClienteService.eliminarCliente(parseInt(id));

      return responseSuccess(res, 'Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      if (error.message === 'Cliente no encontrado') {
        return responseError(res, error.message, 404);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Buscar clientes por NIT
  static async buscarPorNit(req, res) {
    try {
      const { nit } = req.params;

      if (!nit) {
        return responseError(res, 'NIT es requerido', 400);
      }

      const cliente = await ClienteService.buscarPorNit(nit.trim());

      if (!cliente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      return responseSuccess(res, 'Cliente encontrado', cliente);
    } catch (error) {
      console.error('Error en buscarPorNit:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener clientes para select/dropdown
  static async obtenerClientesParaSelect(req, res) {
    try {
      const { search = '' } = req.query;
      
      const clientes = await ClienteService.obtenerClientesParaSelect(search.trim());

      return responseSuccess(res, 'Clientes obtenidos para select', clientes);
    } catch (error) {
      console.error('Error en obtenerClientesParaSelect:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Validar NIT único
  static async validarNit(req, res) {
    try {
      const { nit } = req.params;
      const { excludeId } = req.query;

      if (!nit) {
        return responseError(res, 'NIT es requerido', 400);
      }

      const existe = await ClienteService.existePorNit(nit.trim(), excludeId);

      return responseSuccess(res, 'Validación de NIT completada', { 
        nit: nit.trim(),
        existe 
      });
    } catch (error) {
      console.error('Error en validarNit:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
}

module.exports = ClienteController; ClienteService.obtenerClientePorId(parseInt(id));

      return responseSuccess(res, 'Cliente obtenido exitosamente', cliente);
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      if (error.message === 'Cliente no encontrado') {
        return responseError(res, error.message, 404);
      }
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Crear cliente
  static async crearCliente(req, res) {
    try {
      const { nombres, apellidos, nit, telefono, email, direccion } = req.body;

      // Validaciones básicas
      if (!nombres || nombres.trim().length === 0) {
        return responseError(res, 'El nombre es obligatorio', 400);
      }

      if (!apellidos || apellidos.trim().length === 0) {
        return responseError(res, 'Los apellidos son obligatorios', 400);
      }

      if (!nit || nit.trim().length === 0) {
        return responseError(res, 'El NIT es obligatorio', 400);
      }

      const clienteData = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        nit: nit.trim(),
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim() : null,
        direccion: direccion ? direccion.trim() : null
      };

      const cliente = await ClienteService.crearCliente(clienteData);

      return responseSuccess(res, 'Cliente creado exitosamente', cliente, 201);
    } catch (error) {
      console.error('Error en crearCliente:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Actualizar cliente
  static async actualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const clienteData = req.body;

      if (!id || isNaN(id)) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      const cliente = await