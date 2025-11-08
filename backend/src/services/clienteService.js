// backend/src/services/clienteService.js - VERSIÓN COMPLETA FUNCIONAL

const ClienteRepository = require('../repositories/clienteRepository');

class ClienteService {
  
  // Obtener todos los clientes con paginación y filtros
  static async getAllClientes(page = 1, limit = 10, search = '', estado = '', promociones = '') {
    try {
      const result = await ClienteRepository.findAll(page, limit, search, estado, promociones);
      
      // Estructura consistente
      return {
        clientes: result.data || result.clientes || result,
        total: result.total || result.length || 0,
        page: result.page || page,
        limit: result.limit || limit
      };
    } catch (error) {
      console.error('Error en getAllClientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  static async getClienteById(id) {
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
      console.error('Error en getClienteById:', error);
      throw error;
    }
  }

  // Crear nuevo cliente
  static async createCliente(clienteData) {
    try {
      // Validar datos requeridos
      this.validateClienteData(clienteData);

      // Verificar si ya existe un cliente con el mismo NIT (si se proporciona)
      if (clienteData.nit && clienteData.nit !== 'CF') {
        const exists = await ClienteRepository.existsByNit(clienteData.nit);
        if (exists) {
          throw new Error('Ya existe un cliente con este NIT');
        }
      }

      const newCliente = await ClienteRepository.create(clienteData);
      return newCliente;
    } catch (error) {
      console.error('Error en createCliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  static async updateCliente(id, clienteData) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de cliente inválido');
      }

      // Verificar que el cliente existe
      await this.getClienteById(id);

      // Validar datos si se proporcionan
      if (Object.keys(clienteData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      // Validar NIT único si se está actualizando
      if (clienteData.nit && clienteData.nit !== 'CF') {
        const exists = await ClienteRepository.existsByNit(clienteData.nit, id);
        if (exists) {
          throw new Error('Ya existe un cliente con este NIT');
        }
      }

      const updatedCliente = await ClienteRepository.update(id, clienteData);
      return updatedCliente;
    } catch (error) {
      console.error('Error en updateCliente:', error);
      throw error;
    }
  }

  // Eliminar cliente (soft delete)
  static async deleteCliente(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de cliente inválido');
      }

      // Verificar que el cliente existe
      await this.getClienteById(id);

      await ClienteRepository.delete(id);
      return true;
    } catch (error) {
      console.error('Error en deleteCliente:', error);
      throw error;
    }
  }

  // Buscar clientes por término
  static async searchClientes(termino) {
    try {
      if (!termino || termino.trim().length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
      }

      const clientes = await ClienteRepository.search(termino.trim());
      return clientes;
    } catch (error) {
      console.error('Error en searchClientes:', error);
      throw error;
    }
  }

  // Obtener clientes para select/dropdown
  static async getClientesForSelect() {
    try {
      const clientes = await ClienteRepository.getForSelect();
      return clientes;
    } catch (error) {
      console.error('Error en getClientesForSelect:', error);
      throw error;
    }
  }

  // Validar datos de cliente
  static validateClienteData(data) {
    const errors = [];

    if (!data.nombres || data.nombres.trim().length === 0) {
      errors.push('Los nombres son obligatorios');
    }

    if (!data.apellidos || data.apellidos.trim().length === 0) {
      errors.push('Los apellidos son obligatorios');
    }

    if (data.nombres && data.nombres.trim().length > 100) {
      errors.push('Los nombres no pueden exceder 100 caracteres');
    }

    if (data.apellidos && data.apellidos.trim().length > 100) {
      errors.push('Los apellidos no pueden exceder 100 caracteres');
    }

    if (data.nit && data.nit.trim().length > 20) {
      errors.push('El NIT no puede exceder 20 caracteres');
    }

    if (data.telefono && data.telefono.trim().length > 15) {
      errors.push('El teléfono no puede exceder 15 caracteres');
    }

    if (data.email && data.email.trim().length > 150) {
      errors.push('El email no puede exceder 150 caracteres');
    }

    if (data.direccion && data.direccion.trim().length > 255) {
      errors.push('La dirección no puede exceder 255 caracteres');
    }

    // Validar formato de email si se proporciona
    if (data.email && data.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('El formato del email no es válido');
      }
    }

    // Validar formato de teléfono guatemalteco si se proporciona
    if (data.telefono && data.telefono.trim().length > 0) {
      const phoneRegex = /^[2-9]\d{3}-?\d{4}$/;
      if (!phoneRegex.test(data.telefono.replace(/\s/g, ''))) {
        errors.push('El formato del teléfono no es válido (ejemplo: 2234-5678)');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

module.exports = ClienteService;