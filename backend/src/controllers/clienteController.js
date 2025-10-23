// backend/src/controllers/clienteController.js

const ClienteService = require('../services/clienteService');
const { responseSuccess, responseError } = require('../utils/responses');

class ClienteController {

  // Obtener todos los clientes con paginación y búsqueda
  static async obtenerClientes(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        tipo_cliente = '' 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await ClienteService.obtenerClientes({
        offset: parseInt(offset),
        limit: parseInt(limit),
        search: search.trim(),
        tipo_cliente: tipo_cliente.trim()
      });

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

  // Buscar clientes (para autocomplete)
  static async buscarClientes(req, res) {
    try {
      const { termino } = req.params;

      if (!termino || termino.trim().length < 2) {
        return responseError(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const clientes = await ClienteService.buscarClientes(termino.trim());

      return responseSuccess(res, 'Búsqueda completada', clientes);
    } catch (error) {
      console.error('Error en buscarClientes:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Crear nuevo cliente
  static async crearCliente(req, res) {
    try {
      const {
        nit,
        nombre_completo,
        email,
        telefono,
        direccion,
        tipo_cliente = 'Individual',
        nombre_comercial,
        contacto_principal
      } = req.body;

      // Validaciones básicas
      if (!nit || !nombre_completo) {
        return responseError(res, 'NIT y nombre completo son requeridos', 400);
      }

      // Validar formato de email si se proporciona
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        return responseError(res, 'Formato de email inválido', 400);
      }

      const clienteData = {
        nit: nit.trim(),
        nombre_completo: nombre_completo.trim(),
        email: email ? email.trim() : null,
        telefono: telefono ? telefono.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        tipo_cliente: tipo_cliente.trim(),
        nombre_comercial: nombre_comercial ? nombre_comercial.trim() : null,
        contacto_principal: contacto_principal ? contacto_principal.trim() : null
      };

      const cliente = await ClienteService.crearCliente(clienteData);

      return responseSuccess(res, 'Cliente creado exitosamente', cliente, 201);
    } catch (error) {
      console.error('Error en crearCliente:', error);
      
      if (error.message.includes('NIT ya existe')) {
        return responseError(res, 'Ya existe un cliente con este NIT', 409);
      }
      
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Actualizar cliente existente
  static async actualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const {
        nit,
        nombre_completo,
        email,
        telefono,
        direccion,
        tipo_cliente,
        nombre_comercial,
        contacto_principal,
        estado
      } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      // Verificar que el cliente existe
      const clienteExistente = await ClienteService.obtenerClientePorId(parseInt(id));
      if (!clienteExistente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      // Validar formato de email si se proporciona
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        return responseError(res, 'Formato de email inválido', 400);
      }

      const clienteData = {
        nit: nit ? nit.trim() : clienteExistente.nit,
        nombre_completo: nombre_completo ? nombre_completo.trim() : clienteExistente.nombre_completo,
        email: email ? email.trim() : clienteExistente.email,
        telefono: telefono ? telefono.trim() : clienteExistente.telefono,
        direccion: direccion ? direccion.trim() : clienteExistente.direccion,
        tipo_cliente: tipo_cliente ? tipo_cliente.trim() : clienteExistente.tipo_cliente,
        nombre_comercial: nombre_comercial ? nombre_comercial.trim() : clienteExistente.nombre_comercial,
        contacto_principal: contacto_principal ? contacto_principal.trim() : clienteExistente.contacto_principal,
        estado: estado !== undefined ? estado : clienteExistente.estado
      };

      const cliente = await ClienteService.actualizarCliente(parseInt(id), clienteData);

      return responseSuccess(res, 'Cliente actualizado exitosamente', cliente);
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      
      if (error.message.includes('NIT ya existe')) {
        return responseError(res, 'Ya existe otro cliente con este NIT', 409);
      }
      
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Eliminar cliente (soft delete)
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

      // Verificar si el cliente tiene facturas asociadas
      const tieneFacturas = await ClienteService.verificarFacturasAsociadas(parseInt(id));
      if (tieneFacturas) {
        return responseError(res, 'No se puede eliminar el cliente porque tiene facturas asociadas', 409);
      }

      await ClienteService.eliminarCliente(parseInt(id));

      return responseSuccess(res, 'Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }

  // Obtener historial de facturas del cliente
  static async obtenerFacturasCliente(req, res) {
    try {
      const { id } = req.params;
      const { 
        page = 1, 
        limit = 10,
        fecha_inicio,
        fecha_fin 
      } = req.query;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de cliente inválido', 400);
      }

      // Verificar que el cliente existe
      const clienteExistente = await ClienteService.obtenerClientePorId(parseInt(id));
      if (!clienteExistente) {
        return responseError(res, 'Cliente no encontrado', 404);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await ClienteService.obtenerFacturasCliente({
        id_cliente: parseInt(id),
        offset: parseInt(offset),
        limit: parseInt(limit),
        fecha_inicio,
        fecha_fin
      });

      return responseSuccess(res, 'Historial de facturas obtenido exitosamente', result);
    } catch (error) {
      console.error('Error en obtenerFacturasCliente:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
}

module.exports = ClienteController;