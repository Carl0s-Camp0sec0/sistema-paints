// backend/src/repositories/clienteRepository.js - VERSIÓN BÁSICA FUNCIONAL

const { executeQuery } = require('../config/database');

class ClienteRepository {

  // Obtener todos los clientes con paginación
  static async findAll(page = 1, limit = 10, search = '', estado = '', promociones = '') {
    try {
      const offset = (page - 1) * limit;
      
      // Por ahora, datos demo hasta que tengas la tabla completa
      const clientesDemo = [
        {
          id_cliente: 1,
          nombres: 'Juan Carlos',
          apellidos: 'García López',
          nit: '12345678-9',
          telefono: '2234-5678',
          email: 'juan@example.com',
          direccion: 'Zona 10, Ciudad de Guatemala',
          fecha_registro: new Date(),
          estado: 'Activo'
        },
        {
          id_cliente: 2,
          nombres: 'María Elena',
          apellidos: 'Rodríguez Paz',
          nit: 'CF',
          telefono: '5555-1234',
          email: 'maria@example.com',
          direccion: 'Zona 1, Ciudad de Guatemala',
          fecha_registro: new Date(),
          estado: 'Activo'
        }
      ];

      // Filtrar por búsqueda si se proporciona
      let clientesFiltrados = clientesDemo;
      if (search) {
        const searchLower = search.toLowerCase();
        clientesFiltrados = clientesDemo.filter(cliente => 
          cliente.nombres.toLowerCase().includes(searchLower) ||
          cliente.apellidos.toLowerCase().includes(searchLower) ||
          cliente.nit.toLowerCase().includes(searchLower) ||
          cliente.email.toLowerCase().includes(searchLower)
        );
      }

      // Paginación
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);

      return {
        data: clientesPaginados,
        total: clientesFiltrados.length,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      console.error('Error en findAll clientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  static async findById(id) {
    try {
      // Demo data
      const clientesDemo = [
        {
          id_cliente: 1,
          nombres: 'Juan Carlos',
          apellidos: 'García López',
          nit: '12345678-9',
          telefono: '2234-5678',
          email: 'juan@example.com',
          direccion: 'Zona 10, Ciudad de Guatemala',
          fecha_registro: new Date(),
          estado: 'Activo'
        }
      ];

      return clientesDemo.find(cliente => cliente.id_cliente == id) || null;
    } catch (error) {
      console.error('Error en findById cliente:', error);
      throw error;
    }
  }

  // Crear cliente
  static async create(clienteData) {
    try {
      // Por ahora, simulamos la creación
      const newCliente = {
        id_cliente: Math.floor(Math.random() * 1000) + 100,
        nombres: clienteData.nombres,
        apellidos: clienteData.apellidos,
        nit: clienteData.nit || 'CF',
        telefono: clienteData.telefono || null,
        email: clienteData.email || null,
        direccion: clienteData.direccion || null,
        fecha_registro: new Date(),
        estado: 'Activo'
      };

      return newCliente;
    } catch (error) {
      console.error('Error en create cliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  static async update(id, clienteData) {
    try {
      // Por ahora, simulamos la actualización
      const updatedCliente = {
        id_cliente: id,
        nombres: clienteData.nombres || 'Cliente',
        apellidos: clienteData.apellidos || 'Actualizado',
        nit: clienteData.nit || 'CF',
        telefono: clienteData.telefono || null,
        email: clienteData.email || null,
        direccion: clienteData.direccion || null,
        fecha_registro: new Date(),
        estado: 'Activo'
      };

      return updatedCliente;
    } catch (error) {
      console.error('Error en update cliente:', error);
      throw error;
    }
  }

  // Eliminar cliente (soft delete)
  static async delete(id) {
    try {
      // Por ahora, simulamos la eliminación
      return true;
    } catch (error) {
      console.error('Error en delete cliente:', error);
      throw error;
    }
  }

  // Verificar si existe cliente por NIT
  static async existsByNit(nit, excludeId = null) {
    try {
      // Por ahora, simulamos que no existe
      return false;
    } catch (error) {
      console.error('Error en existsByNit cliente:', error);
      throw error;
    }
  }

  // Buscar clientes
  static async search(termino) {
    try {
      const clientesDemo = [
        {
          id_cliente: 1,
          nombres: 'Juan Carlos',
          apellidos: 'García López',
          nit: '12345678-9',
          telefono: '2234-5678',
          email: 'juan@example.com'
        },
        {
          id_cliente: 2,
          nombres: 'María Elena',
          apellidos: 'Rodríguez Paz',
          nit: 'CF',
          telefono: '5555-1234',
          email: 'maria@example.com'
        }
      ];

      const searchLower = termino.toLowerCase();
      return clientesDemo.filter(cliente => 
        cliente.nombres.toLowerCase().includes(searchLower) ||
        cliente.apellidos.toLowerCase().includes(searchLower) ||
        cliente.nit.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error en search clientes:', error);
      throw error;
    }
  }

  // Obtener clientes para select
  static async getForSelect() {
    try {
      return [
        {
          id_cliente: 1,
          nombres: 'Juan Carlos',
          apellidos: 'García López',
          nit: '12345678-9'
        },
        {
          id_cliente: 2,
          nombres: 'María Elena',
          apellidos: 'Rodríguez Paz',
          nit: 'CF'
        }
      ];
    } catch (error) {
      console.error('Error en getForSelect clientes:', error);
      throw error;
    }
  }
}

module.exports = ClienteRepository;