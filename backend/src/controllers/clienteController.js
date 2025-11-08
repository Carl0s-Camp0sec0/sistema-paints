// backend/src/controllers/clienteController.js

const ClienteService = require('../services/clienteService');
const { responseSuccess, responseError } = require('../utils/responses');

class ClienteController {
  // Obtener todos los clientes con paginación y filtros
  static async obtenerClientes(req, res) {
    try {
      const {
        page = 1,
        limit = 15,
        search = '',
        estado = '',
        acepta_promociones = ''
      } = req.query;

      const filters = {
        search,
        estado: estado !== '' ? parseInt(estado) : null,
        acepta_promociones: acepta_promociones !== '' ? parseInt(acepta_promociones) : null
      };

      const result = await ClienteService.obtenerClientes(page, limit, filters);
      
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
      
      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      const cliente = await ClienteService.obtenerClientePorId(parseInt(id));
      
      if (!cliente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      return responseSuccess(res, 'Cliente obtenido exitosamente', cliente);
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Buscar clientes para autocomplete
  static async buscarClientes(req, res) {
    try {
      const { termino } = req.params;
      
      if (!termino || termino.length < 2) {
        return responseError(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const clientes = await ClienteService.buscarClientes(termino);
      
      return responseSuccess(res, 'Búsqueda completada', clientes);
    } catch (error) {
      console.error('Error en buscarClientes:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Crear nuevo cliente
  static async crearCliente(req, res) {
    try {
      const clienteData = req.body;
      
      // Validación básica
      if (!clienteData.nombres || !clienteData.apellidos) {
        return responseError(res, 'Nombres y apellidos son obligatorios', 400);
      }

      // Validar email si se proporciona
      if (clienteData.email && !ClienteController.isValidEmail(clienteData.email)) {
        return responseError(res, 'Formato de email inválido', 400);
      }

      const nuevoCliente = await ClienteService.crearCliente({
        ...clienteData,
        fecha_registro: new Date(),
        estado: clienteData.estado !== undefined ? clienteData.estado : 1,
        acepta_promociones: clienteData.acepta_promociones || false
      });

      return responseSuccess(res, 'Cliente creado exitosamente', nuevoCliente, 201);
    } catch (error) {
      console.error('Error en crearCliente:', error);
      
      if (error.message.includes('email_UNIQUE')) {
        return responseError(res, 'Ya existe un cliente con ese email', 409);
      }
      
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Actualizar cliente
  static async actualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const clienteData = req.body;
      
      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      // Verificar que el cliente existe
      const clienteExistente = await ClienteService.obtenerClientePorId(parseInt(id));
      if (!clienteExistente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      // Validar email si se proporciona
      if (clienteData.email && !ClienteController.isValidEmail(clienteData.email)) {
        return responseError(res, 'Formato de email inválido', 400);
      }

      const clienteActualizado = await ClienteService.actualizarCliente(parseInt(id), clienteData);
      
      return responseSuccess(res, 'Cliente actualizado exitosamente', clienteActualizado);
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      
      if (error.message.includes('email_UNIQUE')) {
        return responseError(res, 'Ya existe un cliente con ese email', 409);
      }
      
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Eliminar cliente
  static async eliminarCliente(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      // Verificar que el cliente existe
      const clienteExistente = await ClienteService.obtenerClientePorId(parseInt(id));
      if (!clienteExistente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      // Verificar que no tenga facturas asociadas
      const tieneFacturas = await ClienteService.verificarFacturasAsociadas(parseInt(id));
      if (tieneFacturas) {
        return responseError(res, 'No se puede eliminar el cliente porque tiene facturas asociadas', 409);
      }

      await ClienteService.eliminarCliente(parseInt(id));
      
      return responseSuccess(res, 'Cliente eliminado exitosamente', null);
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener historial de facturas del cliente
  static async obtenerFacturasCliente(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      // Verificar que el cliente existe
      const clienteExistente = await ClienteService.obtenerClientePorId(parseInt(id));
      if (!clienteExistente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      const facturas = await ClienteService.obtenerFacturasCliente(parseInt(id), page, limit);
      
      return responseSuccess(res, 'Facturas del cliente obtenidas exitosamente', facturas);
    } catch (error) {
      console.error('Error en obtenerFacturasCliente:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Utilidad para validar email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = ClienteController;