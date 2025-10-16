// backend/src/controllers/productoController.js
const ProductoService = require('../services/productoService');
const { responseSuccess, responseError, responsePaginated } = require('../utils/responses');

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

      return responsePaginated(
        res, 
        'Productos obtenidos exitosamente',
        result.productos,
        {
          page,
          limit,
          total: result.total
        }
      );
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
      
      if (error.message.includes('requerido') || 
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

      return responseError(res, 'Error al actualizar producto', 500);
    }
  }

  // Eliminar producto
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      await ProductoService.deleteProducto(id);
      
      return responseSuccess(res, 'Producto eliminado exitosamente');
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
      const productos = await ProductoService.getProductsWithLowStock();
      
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
      
      const history = await ProductoService.getPriceHistory(id);
      
      return responseSuccess(res, 'Historial de precios obtenido', history);
    } catch (error) {
      console.error('Error en getPriceHistory:', error);
      return responseError(res, 'Error al obtener historial de precios', 500);
    }
  }

  // Actualizar precio
  static async updatePrice(req, res) {
    try {
      const { id } = req.params;
      const priceData = {
        ...req.body,
        id_empleado_modifico: req.user.id_empleado
      };
      
      const result = await ProductoService.updatePrice(id, priceData);
      
      return responseSuccess(res, 'Precio actualizado exitosamente', result);
    } catch (error) {
      console.error('Error en updatePrice:', error);
      return responseError(res, 'Error al actualizar precio', 500);
    }
  }

  // Obtener stock del producto
  static async getStock(req, res) {
    try {
      const { id } = req.params;
      
      const stock = await ProductoService.getProductStock(id);
      
      return responseSuccess(res, 'Stock del producto obtenido', stock);
    } catch (error) {
      console.error('Error en getStock:', error);
      return responseError(res, 'Error al obtener stock del producto', 500);
    }
  }
}

module.exports = ProductoController;