// backend/src/services/clienteService.js

const ClienteRepository = require('../repositories/clienteRepository');

class ClienteService {

  // Obtener clientes con paginación y búsqueda
  static async obtenerClientes(page = 1, limit = 10, search = '', sortBy = 'nombres', sortOrder = 'asc') {
    try {
      const offset = (page - 1) * limit;
      
      const clientes = await ClienteRepository.findAll({
        limit,
        offset,
        search,
        sortBy,
        sortOrder
      });

      const total = await ClienteRepository.count({ search });
      
      return {
        clientes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error en obtenerClientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  static async obtenerClientePorId(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de cliente inválido');
      }

      const cliente = await ClienteRepository.findById(id);
      
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      return cliente;
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      throw error;
    }
  }

  // Crear cliente
  static async crearCliente(clienteData) {
    try {
      // Validaciones
      if (!clienteData.nombres || clienteData.nombres.trim().length === 0) {
        throw new Error('El nombre es obligatorio');
      }

      if (!clienteData.apellidos || clienteData.apellidos.trim().length === 0) {
        throw new Error('Los apellidos son obligatorios');
      }

      if (!clienteData.nit || clienteData.nit.trim().length === 0) {
        throw new Error('El NIT es obligatorio');
      }

      // Validar que el NIT no exista
      const existeNit = await ClienteRepository.existsByNit(clienteData.nit.trim());
      if (existeNit) {
        throw new Error('Ya existe un cliente con este NIT');
      }

      // Validar email si se proporciona
      if (clienteData.email && !this.validarEmail(clienteData.email)) {
        throw new Error('Formato de email inválido');
      }

      // Validar teléfono si se proporciona
      if (clienteData.telefono && !this.validarTelefono(clienteData.telefono)) {
        throw new Error('Formato de teléfono inválido');
      }

      const clienteId = await ClienteRepository.create(clienteData);
      return await this.obtenerClientePorId(clienteId);
    } catch (error) {
      console.error('Error en crearCliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  static async actualizarCliente(id, clienteData) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de cliente inválido');
      }

      // Verificar que el cliente existe
      await this.obtenerClientePorId(id);

      // Validar datos si se proporcionan
      if (Object.keys(clienteData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      // Validar NIT único si se está actualizando
      if (clienteData.nit) {
        const existeNit = await ClienteRepository.existsByNit(clienteData.nit.trim(), id);
        if (existeNit) {
          throw new Error('Ya existe un cliente con este NIT');
        }
      }

      // Validar email si se proporciona
      if (clienteData.email && !this.validarEmail(clienteData.email)) {
        throw new Error('Formato de email inválido');
      }

      // Validar teléfono si se proporciona
      if (clienteData.telefono && !this.validarTelefono(clienteData.telefono)) {
        throw new Error('Formato de teléfono inválido');
      }

      const actualizado = await ClienteRepository.update(id, clienteData);
      
      if (!actualizado) {
        throw new Error('No se pudo actualizar el cliente');
      }

      return await this.obtenerClientePorId(id);
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      throw error;
    }
  }

  // Eliminar cliente (soft delete)
  static async eliminarCliente(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de cliente inválido');
      }

      // Verificar que el cliente existe
      await this.obtenerClientePorId(id);

      // Verificar que no tenga facturas asociadas
      const tieneFacturas = await ClienteRepository.hasFacturas(id);
      if (tieneFacturas) {
        throw new Error('No se puede eliminar el cliente porque tiene facturas asociadas');
      }

      const eliminado = await ClienteRepository.delete(id);
      
      if (!eliminado) {
        throw new Error('No se pudo eliminar el cliente');
      }

      return true;
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      throw error;
    }
  }

  // Buscar por NIT
  static async buscarPorNit(nit) {
    try {
      if (!nit || nit.trim().length === 0) {
        throw new Error('NIT es requerido');
      }

      return await ClienteRepository.findByNit(nit.trim());
    } catch (error) {
      console.error('Error en buscarPorNit:', error);
      throw error;
    }
  }

  // Obtener clientes para select
  static async obtenerClientesParaSelect(search = '') {
    try {
      return await ClienteRepository.getForSelect(search);
    } catch (error) {
      console.error('Error en obtenerClientesParaSelect:', error);
      throw error;
    }
  }

  // Verificar si existe por NIT
  static async existePorNit(nit, excludeId = null) {
    try {
      if (!nit || nit.trim().length === 0) {
        throw new Error('NIT es requerido');
      }

      return await ClienteRepository.existsByNit(nit.trim(), excludeId);
    } catch (error) {
      console.error('Error en existePorNit:', error);
      throw error;
    }
  }

  // Validaciones auxiliares
  static validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validarTelefono(telefono) {
    // Permitir números de Guatemala (8 dígitos) y internacionales
    const telefonoRegex = /^[\+]?[0-9\-\(\)\s]{8,15}$/;
    return telefonoRegex.test(telefono);
  }

  static validarNit(nit) {
    // Validación básica para NIT de Guatemala
    const nitRegex = /^[0-9\-]+$/;
    return nitRegex.test(nit) && nit.length >= 7;
  }
}

module.exports = ClienteService;