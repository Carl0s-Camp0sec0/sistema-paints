// backend/src/controllers/productoController.js - ADAPTADO A TU BD REAL
const ProductoRepository = require('../repositories/productoRepository');
const { responseSuccess, responseError } = require('../utils/responses');

class ProductoController {
  
  // Obtener todos los productos con filtros
  static async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        categoria, 
        estado = 'Activo', // Cambiado a 'Activo' (con mayúscula) según tu BD
        orderBy = 'nombre',
        orderDir = 'ASC'
      } = req.query;

      const filters = {
        search: search.trim(),
        categoria: categoria ? parseInt(categoria) : null,
        estado,
        orderBy,
        orderDir: orderDir.toUpperCase()
      };

      const pagination = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100)
      };

      const result = await ProductoRepository.findAll(filters, pagination);

      return responseSuccess(res, 'Productos obtenidos exitosamente', {
        productos: result.productos,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error en getAll productos:', error);
      return responseError(res, 'Error al obtener productos', 500);
    }
  }

  // Obtener productos para select (formato simplificado)
  static async getForSelect(req, res) {
    try {
      const { categoria } = req.query;
      
      const filters = {
        estado: 'Activo', // Cambiado a 'Activo'
        categoria: categoria ? parseInt(categoria) : null
      };

      const productos = await ProductoRepository.findForSelect(filters);

      return responseSuccess(res, 'Productos para select obtenidos exitosamente', productos);

    } catch (error) {
      console.error('Error en getForSelect productos:', error);
      return responseError(res, 'Error al obtener productos para select', 500);
    }
  }

  // Obtener productos con stock bajo
  static async getLowStock(req, res) {
    try {
      const productos = await ProductoRepository.findLowStock();

      return responseSuccess(res, 'Productos con stock bajo obtenidos exitosamente', productos);

    } catch (error) {
      console.error('Error en getLowStock productos:', error);
      return responseError(res, 'Error al obtener productos con stock bajo', 500);
    }
  }

  // Obtener un producto por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      const producto = await ProductoRepository.findById(id);

      if (!producto) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      return responseSuccess(res, 'Producto obtenido exitosamente', producto);

    } catch (error) {
      console.error('Error en getById producto:', error);
      return responseError(res, 'Error al obtener producto', 500);
    }
  }

  // Obtener historial de precios de un producto
  static async getPriceHistory(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      // Verificar que el producto existe
      const producto = await ProductoRepository.findById(id);
      if (!producto) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      const historial = await ProductoRepository.getPriceHistory(id);

      return responseSuccess(res, 'Historial de precios obtenido exitosamente', historial);

    } catch (error) {
      console.error('Error en getPriceHistory producto:', error);
      return responseError(res, 'Error al obtener historial de precios', 500);
    }
  }

  // Obtener stock actual de un producto
  static async getStock(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      const stock = await ProductoRepository.getStock(id);

      if (stock === null) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      return responseSuccess(res, 'Stock obtenido exitosamente', { stock });

    } catch (error) {
      console.error('Error en getStock producto:', error);
      return responseError(res, 'Error al obtener stock', 500);
    }
  }

  // Crear nuevo producto
  static async create(req, res) {
    try {
      const {
        codigo,
        nombre,
        descripcion,
        id_categoria,
        precio_venta,
        descuento_porcentaje = 0,
        id_unidad_medida,
        id_color,
        stock_minimo = 5,
        stock_actual = 0,
        duracion_anos,
        cobertura_m2
      } = req.body;

      // Validaciones básicas
      if (!codigo || !nombre || !id_categoria || !id_unidad_medida) {
        return responseError(res, 'Código, nombre, categoría y unidad de medida son requeridos', 400);
      }

      if (precio_venta && (isNaN(parseFloat(precio_venta)) || parseFloat(precio_venta) < 0)) {
        return responseError(res, 'El precio de venta debe ser un número válido mayor o igual a 0', 400);
      }

      // Verificar si ya existe un producto con ese código
      const existsByCode = await ProductoRepository.existsByCode(codigo);
      if (existsByCode) {
        return responseError(res, 'Ya existe un producto con ese código', 409);
      }

      const productoData = {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim(),
        id_categoria: parseInt(id_categoria),
        precio_venta: parseFloat(precio_venta) || 0,
        descuento_porcentaje: parseFloat(descuento_porcentaje) || 0,
        id_unidad_medida: parseInt(id_unidad_medida),
        id_color: id_color ? parseInt(id_color) : null,
        stock_minimo: parseInt(stock_minimo) || 5,
        stock_actual: parseInt(stock_actual) || 0,
        duracion_anos: duracion_anos ? parseInt(duracion_anos) : null,
        cobertura_m2: cobertura_m2 ? parseFloat(cobertura_m2) : null
      };

      const productoId = await ProductoRepository.create(productoData);
      const nuevoProducto = await ProductoRepository.findById(productoId);

      return responseSuccess(res, 'Producto creado exitosamente', nuevoProducto, 201);

    } catch (error) {
      console.error('Error en create producto:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return responseError(res, 'Ya existe un producto con ese código', 409);
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return responseError(res, 'Categoría, unidad de medida o color no válido', 400);
      }
      
      return responseError(res, 'Error al crear producto', 500);
    }
  }

  // Actualizar producto existente
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      // Verificar si el producto existe
      const existingProducto = await ProductoRepository.findById(id);
      if (!existingProducto) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      // Verificar código duplicado si se está actualizando
      if (updateData.codigo) {
        const existsByCode = await ProductoRepository.existsByCode(updateData.codigo, id);
        if (existsByCode) {
          return responseError(res, 'Ya existe un producto con ese código', 409);
        }
      }

      // Validar precio si se proporciona
      if (updateData.precio_venta !== undefined && 
          (isNaN(parseFloat(updateData.precio_venta)) || parseFloat(updateData.precio_venta) < 0)) {
        return responseError(res, 'El precio de venta debe ser un número válido mayor o igual a 0', 400);
      }

      // Limpiar y preparar datos (solo incluir campos que existen en la BD)
      const allowedFields = [
        'codigo', 'nombre', 'descripcion', 'id_categoria', 'precio_venta',
        'descuento_porcentaje', 'id_unidad_medida', 'id_color', 'stock_minimo',
        'stock_actual', 'duracion_anos', 'cobertura_m2', 'estado'
      ];

      const cleanData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined && updateData[key] !== '') {
          cleanData[key] = updateData[key];
        }
      });

      const updated = await ProductoRepository.update(id, cleanData);

      if (!updated) {
        return responseError(res, 'No se pudo actualizar el producto', 400);
      }

      const updatedProducto = await ProductoRepository.findById(id);

      return responseSuccess(res, 'Producto actualizado exitosamente', updatedProducto);

    } catch (error) {
      console.error('Error en update producto:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return responseError(res, 'Ya existe un producto con ese código', 409);
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return responseError(res, 'Categoría, unidad de medida o color no válido', 400);
      }
      
      return responseError(res, 'Error al actualizar producto', 500);
    }
  }

  // Actualizar precio de producto
  static async updatePrice(req, res) {
    try {
      const { id } = req.params;
      const { precio_venta, motivo = 'Actualización de precio' } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      if (!precio_venta || isNaN(parseFloat(precio_venta)) || parseFloat(precio_venta) < 0) {
        return responseError(res, 'Precio de venta válido es requerido', 400);
      }

      // Verificar si el producto existe
      const existingProducto = await ProductoRepository.findById(id);
      if (!existingProducto) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      const precioAnterior = existingProducto.precio_venta;
      const precioNuevo = parseFloat(precio_venta);

      // Actualizar precio
      await ProductoRepository.updatePrice(id, precioNuevo, precioAnterior, motivo);

      const updatedProducto = await ProductoRepository.findById(id);

      return responseSuccess(res, 'Precio actualizado exitosamente', {
        producto: updatedProducto,
        cambio: {
          precio_anterior: precioAnterior,
          precio_nuevo: precioNuevo,
          motivo
        }
      });

    } catch (error) {
      console.error('Error en updatePrice producto:', error);
      return responseError(res, 'Error al actualizar precio', 500);
    }
  }

  // Eliminar producto (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      // Verificar si el producto existe
      const existingProducto = await ProductoRepository.findById(id);
      if (!existingProducto) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      // Verificar si el producto está en uso (facturas)
      const inUse = await ProductoRepository.isInUse(id);
      if (inUse) {
        return responseError(res, 'No se puede eliminar: el producto está siendo utilizado en facturas', 400);
      }

      const deleted = await ProductoRepository.delete(id);

      if (!deleted) {
        return responseError(res, 'No se pudo eliminar el producto', 400);
      }

      return responseSuccess(res, 'Producto eliminado exitosamente');

    } catch (error) {
      console.error('Error en delete producto:', error);
      
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return responseError(res, 'No se puede eliminar: el producto está siendo utilizado', 400);
      }
      
      return responseError(res, 'Error al eliminar producto', 500);
    }
  }
}

module.exports = ProductoController;