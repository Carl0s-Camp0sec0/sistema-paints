// backend/src/controllers/productoController.js - VERSIÓN COMPLETA CORREGIDA

const ProductoService = require('../services/productoService');
const { responseSuccess, responseError } = require('../utils/responses');

class ProductoController {
  
  // Obtener todos los productos
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const categoria = req.query.categoria || '';

      if (page < 1 || limit < 1 || limit > 100) {
        return responseError(res, 'Parámetros de paginación inválidos', 400);
      }

      const result = await ProductoService.getAllProductos(page, limit, search, categoria);

      // CORRECCIÓN: Estructura de respuesta consistente
      return responseSuccess(res, 'Productos obtenidos exitosamente', result.productos, 200, {
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / limit),
          totalRecords: result.total,
          hasNext: page * limit < result.total,
          hasPrev: page > 1,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error en getAll productos:', error);
      return responseError(res, 'Error al obtener productos', 500);
    }
  }

  // Obtener producto por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const producto = await ProductoService.getProductoById(id);
      
      return responseSuccess(res, 'Producto obtenido exitosamente', producto);
    } catch (error) {
      console.error('Error en getById producto:', error);
      
      if (error.message === 'ID de producto inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Producto no encontrado') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al obtener producto', 500);
    }
  }

  // Crear nuevo producto
  static async create(req, res) {
    try {
      const productoData = req.body;
      
      const newProducto = await ProductoService.createProducto(productoData);
      
      return responseSuccess(res, 'Producto creado exitosamente', newProducto, 201);
    } catch (error) {
      console.error('Error en create producto:', error);
      
      if (error.message.includes('obligatorio') || 
          error.message.includes('inválido') ||
          error.message.includes('exceder') ||
          error.message.includes('Ya existe')) {
        return responseError(res, error.message, 400);
      }

      return responseError(res, 'Error al crear producto', 500);
    }
  }

  // Actualizar producto
  static async update(req, res) {
    try {
      const { id } = req.params;
      const productoData = req.body;
      
      const updatedProducto = await ProductoService.updateProducto(id, productoData);
      
      return responseSuccess(res, 'Producto actualizado exitosamente', updatedProducto);
    } catch (error) {
      console.error('Error en update producto:', error);
      
      if (error.message === 'ID de producto inválido' ||
          error.message === 'No hay datos para actualizar') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Producto no encontrado') {
        return responseError(res, error.message, 404);
      }
      
      if (error.message.includes('Ya existe')) {
        return responseError(res, error.message, 409);
      }

      return responseError(res, 'Error al actualizar producto', 500);
    }
  }

  // Eliminar producto
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      await ProductoService.deleteProducto(id);
      
      return responseSuccess(res, 'Producto eliminado exitosamente', null);
    } catch (error) {
      console.error('Error en delete producto:', error);
      
      if (error.message === 'ID de producto inválido') {
        return responseError(res, error.message, 400);
      }
      
      if (error.message === 'Producto no encontrado') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al eliminar producto', 500);
    }
  }

  // Obtener productos para select
  static async getForSelect(req, res) {
    try {
      const productos = await ProductoService.getProductosForSelect();
      
      return responseSuccess(res, 'Productos para select obtenidos', productos);
    } catch (error) {
      console.error('Error en getForSelect productos:', error);
      return responseError(res, 'Error al obtener productos', 500);
    }
  }

  // Obtener productos con stock bajo
  static async getLowStock(req, res) {
    try {
      const limite = parseInt(req.query.limite) || 10;
      const productos = await ProductoService.getProductsWithLowStock(limite);
      
      return responseSuccess(res, 'Productos con stock bajo obtenidos', productos);
    } catch (error) {
      console.error('Error en getLowStock:', error);
      return responseError(res, 'Error al obtener productos con stock bajo', 500);
    }
  }

  // Obtener historial de precios
  static async getPriceHistory(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return responseError(res, 'ID de producto inválido', 400);
      }
      
      const historial = await ProductoService.getPriceHistory(id);
      
      return responseSuccess(res, 'Historial de precios obtenido', historial);
    } catch (error) {
      console.error('Error en getPriceHistory:', error);
      return responseError(res, 'Error al obtener historial de precios', 500);
    }
  }

  // Obtener stock por producto
  static async getStock(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return responseError(res, 'ID de producto inválido', 400);
      }
      
      const stock = await ProductoService.getStockByProduct(id);
      
      return responseSuccess(res, 'Stock del producto obtenido', stock);
    } catch (error) {
      console.error('Error en getStock:', error);
      return responseError(res, 'Error al obtener stock del producto', 500);
    }
  }

  // Actualizar precio
  static async updatePrice(req, res) {
    try {
      const { id } = req.params;
      const priceData = req.body;
      
      if (!id || isNaN(id)) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      if (!priceData.precio_venta || isNaN(priceData.precio_venta) || priceData.precio_venta <= 0) {
        return responseError(res, 'Precio de venta inválido', 400);
      }

      // Verificar que el producto existe
      await ProductoService.getProductoById(id);

      // Agregar datos necesarios
      priceData.id_producto = parseInt(id);
      priceData.motivo_cambio = priceData.motivo_cambio || 'Actualización de precio';

      const priceId = await ProductoService.updatePrice(priceData);
      
      return responseSuccess(res, 'Precio actualizado exitosamente', { id_historial_precio: priceId });
    } catch (error) {
      console.error('Error en updatePrice:', error);
      
      if (error.message === 'Producto no encontrado') {
        return responseError(res, error.message, 404);
      }

      return responseError(res, 'Error al actualizar precio', 500);
    }
  }
}

module.exports = ProductoController;