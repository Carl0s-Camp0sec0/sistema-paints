// backend/src/services/clienteService.js

const { executeQuery } = require('../config/database');

class ClienteService {
  // Obtener clientes con paginación y filtros
  static async obtenerClientes(page = 1, limit = 15, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      // Construir WHERE clause dinámico
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      if (filters.search && filters.search.trim()) {
        whereClause += ` AND (
          c.nombres LIKE ? OR 
          c.apellidos LIKE ? OR 
          c.nit LIKE ? OR 
          c.telefono LIKE ? OR 
          c.email LIKE ?
        )`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (filters.estado !== null && filters.estado !== undefined) {
        whereClause += ` AND c.estado = ?`;
        params.push(filters.estado);
      }
      
      if (filters.acepta_promociones !== null && filters.acepta_promociones !== undefined) {
        whereClause += ` AND c.acepta_promociones = ?`;
        params.push(filters.acepta_promociones);
      }

      // Query principal
      const sql = `
        SELECT 
          c.id_cliente,
          c.nombres,
          c.apellidos,
          c.nit,
          c.dpi,
          c.telefono,
          c.email,
          c.direccion,
          c.estado,
          c.acepta_promociones,
          c.fecha_registro,
          COUNT(f.id_factura) as total_facturas,
          COALESCE(SUM(f.total_factura), 0) as total_compras
        FROM clientes c
        LEFT JOIN facturas f ON c.id_cliente = f.id_cliente
        ${whereClause}
        GROUP BY c.id_cliente, c.nombres, c.apellidos, c.nit, c.dpi, 
                 c.telefono, c.email, c.direccion, c.estado, 
                 c.acepta_promociones, c.fecha_registro
        ORDER BY c.fecha_registro DESC
        LIMIT ? OFFSET ?
      `;

      const clientes = await executeQuery(sql, [...params, limit, offset]);

      // Query para contar total
      const countSql = `
        SELECT COUNT(DISTINCT c.id_cliente) as total
        FROM clientes c
        ${whereClause}
      `;

      const [countResult] = await executeQuery(countSql, params);
      const total = countResult.total;

      return {
        clientes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
          limit: parseInt(limit),
          total
        }
      };
    } catch (error) {
      console.error('Error en obtenerClientes:', error);
      throw new Error('Error al obtener clientes');
    }
  }

  // Obtener cliente por ID
  static async obtenerClientePorId(id) {
    try {
      const sql = `
        SELECT 
          c.*,
          COUNT(f.id_factura) as total_facturas,
          COALESCE(SUM(f.total_factura), 0) as total_compras,
          MAX(f.fecha_factura) as ultima_compra
        FROM clientes c
        LEFT JOIN facturas f ON c.id_cliente = f.id_cliente
        WHERE c.id_cliente = ?
        GROUP BY c.id_cliente
      `;

      const [cliente] = await executeQuery(sql, [id]);
      return cliente;
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      throw new Error('Error al obtener cliente');
    }
  }

  // Buscar clientes para autocomplete
  static async buscarClientes(termino) {
    try {
      const searchTerm = `%${termino}%`;
      const sql = `
        SELECT 
          id_cliente,
          nombres,
          apellidos,
          nit,
          telefono,
          email
        FROM clientes
        WHERE estado = 1 
          AND (
            nombres LIKE ? OR 
            apellidos LIKE ? OR 
            nit LIKE ? OR 
            telefono LIKE ? OR 
            email LIKE ?
          )
        ORDER BY 
          CASE 
            WHEN nombres LIKE ? THEN 1
            WHEN apellidos LIKE ? THEN 2
            WHEN nit LIKE ? THEN 3
            ELSE 4
          END,
          nombres ASC
        LIMIT 20
      `;

      const clientes = await executeQuery(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
        `${termino}%`, `${termino}%`, `${termino}%`
      ]);

      return clientes;
    } catch (error) {
      console.error('Error en buscarClientes:', error);
      throw new Error('Error al buscar clientes');
    }
  }

  // Crear nuevo cliente
  static async crearCliente(clienteData) {
    try {
      const sql = `
        INSERT INTO clientes (
          nombres, apellidos, nit, dpi, telefono, email, 
          direccion, estado, acepta_promociones, fecha_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        clienteData.nombres,
        clienteData.apellidos,
        clienteData.nit || null,
        clienteData.dpi || null,
        clienteData.telefono || null,
        clienteData.email || null,
        clienteData.direccion || null,
        clienteData.estado !== undefined ? clienteData.estado : 1,
        clienteData.acepta_promociones || false,
        clienteData.fecha_registro || new Date()
      ];

      const result = await executeQuery(sql, params);
      
      // Obtener el cliente creado
      const clienteCreado = await this.obtenerClientePorId(result.insertId);
      
      return clienteCreado;
    } catch (error) {
      console.error('Error en crearCliente:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) {
          throw new Error('Ya existe un cliente con ese email');
        }
        throw new Error('Ya existe un cliente con esos datos');
      }
      
      throw new Error('Error al crear cliente');
    }
  }

  // Actualizar cliente
  static async actualizarCliente(id, clienteData) {
    try {
      // Construir campos dinámicamente
      const campos = [];
      const params = [];

      if (clienteData.nombres !== undefined) {
        campos.push('nombres = ?');
        params.push(clienteData.nombres);
      }
      
      if (clienteData.apellidos !== undefined) {
        campos.push('apellidos = ?');
        params.push(clienteData.apellidos);
      }
      
      if (clienteData.nit !== undefined) {
        campos.push('nit = ?');
        params.push(clienteData.nit || null);
      }
      
      if (clienteData.dpi !== undefined) {
        campos.push('dpi = ?');
        params.push(clienteData.dpi || null);
      }
      
      if (clienteData.telefono !== undefined) {
        campos.push('telefono = ?');
        params.push(clienteData.telefono || null);
      }
      
      if (clienteData.email !== undefined) {
        campos.push('email = ?');
        params.push(clienteData.email || null);
      }
      
      if (clienteData.direccion !== undefined) {
        campos.push('direccion = ?');
        params.push(clienteData.direccion || null);
      }
      
      if (clienteData.estado !== undefined) {
        campos.push('estado = ?');
        params.push(clienteData.estado);
      }
      
      if (clienteData.acepta_promociones !== undefined) {
        campos.push('acepta_promociones = ?');
        params.push(clienteData.acepta_promociones);
      }

      if (campos.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      const sql = `
        UPDATE clientes 
        SET ${campos.join(', ')}
        WHERE id_cliente = ?
      `;

      params.push(id);

      await executeQuery(sql, params);
      
      // Obtener el cliente actualizado
      const clienteActualizado = await this.obtenerClientePorId(id);
      
      return clienteActualizado;
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) {
          throw new Error('Ya existe un cliente con ese email');
        }
        throw new Error('Ya existe un cliente con esos datos');
      }
      
      throw new Error('Error al actualizar cliente');
    }
  }

  // Eliminar cliente
  static async eliminarCliente(id) {
    try {
      const sql = 'DELETE FROM clientes WHERE id_cliente = ?';
      await executeQuery(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      throw new Error('Error al eliminar cliente');
    }
  }

  // Verificar si tiene facturas asociadas
  static async verificarFacturasAsociadas(id) {
    try {
      const sql = 'SELECT COUNT(*) as total FROM facturas WHERE id_cliente = ?';
      const [result] = await executeQuery(sql, [id]);
      return result.total > 0;
    } catch (error) {
      console.error('Error en verificarFacturasAsociadas:', error);
      throw new Error('Error al verificar facturas asociadas');
    }
  }

  // Obtener historial de facturas del cliente
  static async obtenerFacturasCliente(idCliente, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const sql = `
        SELECT 
          f.id_factura,
          f.numero_factura,
          f.fecha_factura,
          f.subtotal_factura,
          f.descuento_total,
          f.iva_factura,
          f.total_factura,
          f.estado_factura,
          sf.serie,
          s.nombre as sucursal_nombre
        FROM facturas f
        INNER JOIN serie_facturas sf ON f.id_serie_factura = sf.id_serie_factura
        INNER JOIN sucursales s ON sf.id_sucursal = s.id_sucursal
        WHERE f.id_cliente = ?
        ORDER BY f.fecha_factura DESC
        LIMIT ? OFFSET ?
      `;

      const facturas = await executeQuery(sql, [idCliente, limit, offset]);

      // Contar total
      const countSql = 'SELECT COUNT(*) as total FROM facturas WHERE id_cliente = ?';
      const [countResult] = await executeQuery(countSql, [idCliente]);
      const total = countResult.total;

      return {
        facturas,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
          limit: parseInt(limit),
          total
        }
      };
    } catch (error) {
      console.error('Error en obtenerFacturasCliente:', error);
      throw new Error('Error al obtener facturas del cliente');
    }
  }
}

module.exports = ClienteService;