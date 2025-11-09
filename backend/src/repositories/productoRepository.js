// backend/src/repositories/productoRepository.js - ADAPTADO A TU BD REAL
const { executeQuery, getConnection } = require('../config/database');

class ProductoRepository {
  
  // Obtener todos los productos con filtros y paginación
  static async findAll(filters = {}, pagination = { page: 1, limit: 10 }) {
    try {
      const { search, categoria, estado, orderBy = 'nombre', orderDir = 'ASC' } = filters;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let baseQuery = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.precio_venta,
          p.descuento_porcentaje,
          p.stock_actual,
          p.stock_minimo,
          p.duracion_anos,
          p.cobertura_m2,
          p.estado,
          p.created_at,
          c.nombre as categoria_nombre,
          um.nombre as unidad_medida_nombre,
          um.abreviatura as unidad_abreviatura,
          col.nombre as color_nombre
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida um ON p.id_unidad_medida = um.id_unidad_medida
        LEFT JOIN colores col ON p.id_color = col.id_color
        WHERE 1=1
      `;

      let countQuery = `
        SELECT COUNT(*) as total
        FROM productos p
        WHERE 1=1
      `;

      const queryParams = [];
      let whereConditions = '';

      // Filtro por estado
      if (estado) {
        whereConditions += ` AND p.estado = ?`;
        queryParams.push(estado);
      }

      // Filtro por categoría
      if (categoria) {
        whereConditions += ` AND p.id_categoria = ?`;
        queryParams.push(categoria);
      }

      // Filtro de búsqueda
      if (search) {
        whereConditions += ` AND (p.codigo LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Agregar condiciones WHERE
      baseQuery += whereConditions;
      countQuery += whereConditions;

      // Ordenamiento
      const allowedOrderBy = ['codigo', 'nombre', 'precio_venta', 'stock_actual', 'created_at'];
      const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'nombre';
      const safeOrderDir = ['ASC', 'DESC'].includes(orderDir) ? orderDir : 'ASC';
      
      baseQuery += ` ORDER BY p.${safeOrderBy} ${safeOrderDir}`;

      // Paginación
      baseQuery += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      // Ejecutar consultas usando executeQuery
      const productos = await executeQuery(baseQuery, queryParams);
      const totalResult = await executeQuery(countQuery, queryParams.slice(0, -2)); // Remover limit y offset para el conteo

      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        productos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Error en ProductoRepository.findAll:', error);
      throw error;
    }
  }

  // Obtener productos para select (formato simplificado)
  static async findForSelect(filters = {}) {
    try {
      const { categoria, estado = 'Activo' } = filters; // Cambiado a 'Activo' (con mayúscula)

      let query = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.precio_venta,
          p.stock_actual
        FROM productos p
        WHERE p.estado = ?
      `;

      const queryParams = [estado];

      if (categoria) {
        query += ` AND p.id_categoria = ?`;
        queryParams.push(categoria);
      }

      query += ` ORDER BY p.nombre ASC`;

      const productos = await executeQuery(query, queryParams);
      return productos;

    } catch (error) {
      console.error('Error en ProductoRepository.findForSelect:', error);
      throw error;
    }
  }

  // Obtener productos con stock bajo
  static async findLowStock() {
    try {
      const query = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.stock_actual,
          p.stock_minimo,
          c.nombre as categoria_nombre
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        WHERE p.estado = 'Activo' 
        AND p.stock_actual <= p.stock_minimo
        ORDER BY (p.stock_actual - p.stock_minimo) ASC, p.nombre ASC
      `;

      const productos = await executeQuery(query);
      return productos;

    } catch (error) {
      console.error('Error en ProductoRepository.findLowStock:', error);
      throw error;
    }
  }

  // Buscar producto por ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          um.nombre as unidad_medida_nombre,
          um.abreviatura as unidad_abreviatura,
          col.nombre as color_nombre
        FROM productos p
        LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida um ON p.id_unidad_medida = um.id_unidad_medida
        LEFT JOIN colores col ON p.id_color = col.id_color
        WHERE p.id_producto = ?
      `;

      const productos = await executeQuery(query, [id]);
      return productos.length > 0 ? productos[0] : null;

    } catch (error) {
      console.error('Error en ProductoRepository.findById:', error);
      throw error;
    }
  }

  // Verificar si existe producto por código
  static async existsByCode(codigo, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM productos WHERE codigo = ?`;
      const params = [codigo];

      if (excludeId) {
        query += ` AND id_producto != ?`;
        params.push(excludeId);
      }

      const result = await executeQuery(query, params);
      return result[0].count > 0;

    } catch (error) {
      console.error('Error en ProductoRepository.existsByCode:', error);
      throw error;
    }
  }

  // Crear nuevo producto
  static async create(productoData) {
    try {
      const query = `
        INSERT INTO productos (
          codigo, nombre, descripcion, id_categoria, precio_venta,
          descuento_porcentaje, id_unidad_medida, id_color, stock_minimo,
          stock_actual, duracion_anos, cobertura_m2, estado, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo', NOW())
      `;

      const params = [
        productoData.codigo,
        productoData.nombre,
        productoData.descripcion,
        productoData.id_categoria,
        productoData.precio_venta,
        productoData.descuento_porcentaje,
        productoData.id_unidad_medida,
        productoData.id_color,
        productoData.stock_minimo,
        productoData.stock_actual,
        productoData.duracion_anos,
        productoData.cobertura_m2
      ];

      const result = await executeQuery(query, params);
      return result.insertId;

    } catch (error) {
      console.error('Error en ProductoRepository.create:', error);
      throw error;
    }
  }

  // Actualizar producto
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Construir dinámicamente la consulta
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        return false;
      }

      // No agregar fecha_actualizacion porque no existe en tu BD
      values.push(id);

      const query = `UPDATE productos SET ${fields.join(', ')} WHERE id_producto = ?`;

      const result = await executeQuery(query, values);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error en ProductoRepository.update:', error);
      throw error;
    }
  }

  // Actualizar precio de producto con historial
  static async updatePrice(id, precioNuevo, precioAnterior, motivo) {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();

      // Actualizar precio en la tabla productos
      await connection.execute(
        `UPDATE productos SET precio_venta = ? WHERE id_producto = ?`,
        [precioNuevo, id]
      );

      // Registrar en historial de precios
      await connection.execute(
        `INSERT INTO historial_precios (
          id_producto, precio_venta, fecha_inicio, 
          motivo_cambio, estado_precio
        ) VALUES (?, ?, NOW(), ?, 'Activo')`,
        [id, precioNuevo, motivo]
      );

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('Error en ProductoRepository.updatePrice:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtener historial de precios
  static async getPriceHistory(id) {
    try {
      const query = `
        SELECT 
          hp.*,
          e.nombres as empleado_nombres,
          e.apellidos as empleado_apellidos
        FROM historial_precios hp
        LEFT JOIN empleados e ON hp.id_empleado_modifico = e.id_empleado
        WHERE hp.id_producto = ?
        ORDER BY hp.fecha_inicio DESC
      `;

      const historial = await executeQuery(query, [id]);
      return historial;

    } catch (error) {
      console.error('Error en ProductoRepository.getPriceHistory:', error);
      return []; // Si no existe la tabla, retornar array vacío
    }
  }

  // Obtener stock actual
  static async getStock(id) {
    try {
      const query = `SELECT stock_actual FROM productos WHERE id_producto = ?`;
      const result = await executeQuery(query, [id]);
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0].stock_actual;

    } catch (error) {
      console.error('Error en ProductoRepository.getStock:', error);
      throw error;
    }
  }

  // Verificar si el producto está en uso
  static async isInUse(id) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM detalle_facturas df
        INNER JOIN facturas f ON df.id_factura = f.id_factura
        WHERE df.id_producto = ? AND f.estado = 'Activa'
      `;

      const result = await executeQuery(query, [id]);
      return result[0].count > 0;

    } catch (error) {
      console.error('Error en ProductoRepository.isInUse:', error);
      // Si las tablas no existen, asumir que no está en uso
      return false;
    }
  }

  // Eliminar producto (soft delete)
  static async delete(id) {
    try {
      const query = `UPDATE productos SET estado = 'Inactivo' WHERE id_producto = ?`;
      const result = await executeQuery(query, [id]);
      
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error en ProductoRepository.delete:', error);
      throw error;
    }
  }

  // Actualizar stock de producto
  static async updateStock(id, nuevoStock, motivo = 'Actualización manual') {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener stock actual
      const [currentStock] = await connection.execute(
        `SELECT stock_actual FROM productos WHERE id_producto = ?`,
        [id]
      );

      if (currentStock.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const stockAnterior = currentStock[0].stock_actual;

      // Actualizar stock
      await connection.execute(
        `UPDATE productos SET stock_actual = ? WHERE id_producto = ?`,
        [nuevoStock, id]
      );

      // Registrar en movimientos de inventario
      await connection.execute(
        `INSERT INTO movimientos_inventario (
          id_producto, tipo_movimiento, cantidad, stock_anterior, 
          stock_nuevo, motivo, fecha_movimiento
        ) VALUES (?, 'Ajuste', ?, ?, ?, ?, NOW())`,
        [id, nuevoStock - stockAnterior, stockAnterior, nuevoStock, motivo]
      );

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('Error en ProductoRepository.updateStock:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ProductoRepository;