// backend/src/services/clienteService.js

const { executeQuery, executeTransaction } = require('../config/database');

class ClienteService {

  // Obtener clientes con paginación y filtros
  static async obtenerClientes({ offset = 0, limit = 10, search = '', tipo_cliente = '' }) {
    try {
      let whereConditions = ['c.estado = 1']; // Solo clientes activos
      let params = [];

      // Filtro de búsqueda por nombre, NIT o nombre comercial
      if (search) {
        whereConditions.push(`(
          c.nombre_completo LIKE ? OR 
          c.nit LIKE ? OR 
          c.nombre_comercial LIKE ? OR
          c.email LIKE ?
        )`);
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Filtro por tipo de cliente
      if (tipo_cliente) {
        whereConditions.push('c.tipo_cliente = ?');
        params.push(tipo_cliente);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Consulta principal con paginación
      const sql = `
        SELECT 
          c.id_cliente,
          c.nit,
          c.nombre_completo,
          c.email,
          c.telefono,
          c.direccion,
          c.tipo_cliente,
          c.nombre_comercial,
          c.contacto_principal,
          c.estado,
          c.fecha_registro,
          c.fecha_actualizacion,
          COUNT(f.id_factura) as total_facturas,
          COALESCE(SUM(f.total_factura), 0) as total_compras
        FROM clientes c
        LEFT JOIN facturas f ON c.id_cliente = f.id_cliente AND f.estado = 'Activa'
        ${whereClause}
        GROUP BY c.id_cliente
        ORDER BY c.nombre_completo ASC
        LIMIT ? OFFSET ?
      `;

      // Consulta para el total de registros
      const countSql = `
        SELECT COUNT(DISTINCT c.id_cliente) as total
        FROM clientes c
        ${whereClause}
      `;

      const [clientes, totalResult] = await Promise.all([
        executeQuery(sql, [...params, limit, offset]),
        executeQuery(countSql, params)
      ]);

      const total = totalResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        clientes,
        pagination: {
          total,
          totalPages,
          currentPage,
          limit,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      };

    } catch (error) {
      console.error('Error en obtenerClientes:', error);
      throw new Error('Error al obtener clientes');
    }
  }

  // Obtener cliente por ID
  static async obtenerClientePorId(id_cliente) {
    try {
      const sql = `
        SELECT 
          c.*,
          COUNT(f.id_factura) as total_facturas,
          COALESCE(SUM(f.total_factura), 0) as total_compras,
          MAX(f.fecha_factura) as ultima_compra
        FROM clientes c
        LEFT JOIN facturas f ON c.id_cliente = f.id_cliente AND f.estado = 'Activa'
        WHERE c.id_cliente = ?
        GROUP BY c.id_cliente
      `;

      const resultado = await executeQuery(sql, [id_cliente]);
      return resultado[0] || null;

    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      throw new Error('Error al obtener cliente');
    }
  }

  // Buscar clientes para autocomplete
  static async buscarClientes(termino) {
    try {
      const sql = `
        SELECT 
          id_cliente,
          nit,
          nombre_completo,
          nombre_comercial,
          email,
          telefono,
          tipo_cliente
        FROM clientes 
        WHERE estado = 1 
        AND (
          nombre_completo LIKE ? OR 
          nit LIKE ? OR 
          nombre_comercial LIKE ? OR
          email LIKE ?
        )
        ORDER BY nombre_completo ASC
        LIMIT 10
      `;

      const searchTerm = `%${termino}%`;
      const clientes = await executeQuery(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);

      return clientes;

    } catch (error) {
      console.error('Error en buscarClientes:', error);
      throw new Error('Error al buscar clientes');
    }
  }

  // Crear nuevo cliente
  static async crearCliente(clienteData) {
    try {
      // Verificar si ya existe un cliente con ese NIT
      const existeNit = await executeQuery(
        'SELECT id_cliente FROM clientes WHERE nit = ? AND estado = 1',
        [clienteData.nit]
      );

      if (existeNit.length > 0) {
        throw new Error('Ya existe un cliente con este NIT');
      }

      const sql = `
        INSERT INTO clientes (
          nit, nombre_completo, email, telefono, direccion,
          tipo_cliente, nombre_comercial, contacto_principal,
          estado, fecha_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `;

      const params = [
        clienteData.nit,
        clienteData.nombre_completo,
        clienteData.email,
        clienteData.telefono,
        clienteData.direccion,
        clienteData.tipo_cliente,
        clienteData.nombre_comercial,
        clienteData.contacto_principal
      ];

      const resultado = await executeQuery(sql, params);
      const id_cliente = resultado.insertId;

      // Obtener el cliente recién creado
      return await this.obtenerClientePorId(id_cliente);

    } catch (error) {
      console.error('Error en crearCliente:', error);
      throw error;
    }
  }

  // Actualizar cliente existente
  static async actualizarCliente(id_cliente, clienteData) {
    try {
      // Verificar si ya existe otro cliente con ese NIT
      const existeNit = await executeQuery(
        'SELECT id_cliente FROM clientes WHERE nit = ? AND id_cliente != ? AND estado = 1',
        [clienteData.nit, id_cliente]
      );

      if (existeNit.length > 0) {
        throw new Error('Ya existe otro cliente con este NIT');
      }

      const sql = `
        UPDATE clientes SET
          nit = ?,
          nombre_completo = ?,
          email = ?,
          telefono = ?,
          direccion = ?,
          tipo_cliente = ?,
          nombre_comercial = ?,
          contacto_principal = ?,
          estado = ?,
          fecha_actualizacion = NOW()
        WHERE id_cliente = ?
      `;

      const params = [
        clienteData.nit,
        clienteData.nombre_completo,
        clienteData.email,
        clienteData.telefono,
        clienteData.direccion,
        clienteData.tipo_cliente,
        clienteData.nombre_comercial,
        clienteData.contacto_principal,
        clienteData.estado,
        id_cliente
      ];

      await executeQuery(sql, params);

      // Obtener el cliente actualizado
      return await this.obtenerClientePorId(id_cliente);

    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      throw error;
    }
  }

  // Eliminar cliente (soft delete)
  static async eliminarCliente(id_cliente) {
    try {
      const sql = `
        UPDATE clientes SET
          estado = 0,
          fecha_actualizacion = NOW()
        WHERE id_cliente = ?
      `;

      await executeQuery(sql, [id_cliente]);

    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      throw new Error('Error al eliminar cliente');
    }
  }

  // Verificar si el cliente tiene facturas asociadas
  static async verificarFacturasAsociadas(id_cliente) {
    try {
      const sql = `
        SELECT COUNT(*) as total
        FROM facturas 
        WHERE id_cliente = ? AND estado = 'Activa'
      `;

      const resultado = await executeQuery(sql, [id_cliente]);
      return resultado[0].total > 0;

    } catch (error) {
      console.error('Error en verificarFacturasAsociadas:', error);
      throw new Error('Error al verificar facturas asociadas');
    }
  }

  // Obtener historial de facturas del cliente
  static async obtenerFacturasCliente({ id_cliente, offset = 0, limit = 10, fecha_inicio, fecha_fin }) {
    try {
      let whereConditions = ['f.id_cliente = ?', 'f.estado = ?'];
      let params = [id_cliente, 'Activa'];

      // Filtros de fecha
      if (fecha_inicio) {
        whereConditions.push('f.fecha_factura >= ?');
        params.push(fecha_inicio);
      }
      if (fecha_fin) {
        whereConditions.push('f.fecha_factura <= ?');
        params.push(fecha_fin);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Consulta principal
      const sql = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.serie_factura,
          f.fecha_factura,
          f.subtotal,
          f.impuestos,
          f.total_factura,
          f.observaciones,
          CONCAT(u.nombres, ' ', u.apellidos) as empleado_nombre,
          s.nombre_sucursal
        FROM facturas f
        LEFT JOIN usuarios u ON f.id_empleado = u.id_usuario
        LEFT JOIN sucursales s ON u.id_sucursal = s.id_sucursal
        ${whereClause}
        ORDER BY f.fecha_factura DESC
        LIMIT ? OFFSET ?
      `;

      // Consulta para el total
      const countSql = `
        SELECT COUNT(*) as total
        FROM facturas f
        ${whereClause}
      `;

      const [facturas, totalResult] = await Promise.all([
        executeQuery(sql, [...params, limit, offset]),
        executeQuery(countSql, params)
      ]);

      const total = totalResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        facturas,
        pagination: {
          total,
          totalPages,
          currentPage,
          limit,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      };

    } catch (error) {
      console.error('Error en obtenerFacturasCliente:', error);
      throw new Error('Error al obtener historial de facturas');
    }
  }
}

module.exports = ClienteService;