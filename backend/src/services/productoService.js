// backend/src/services/productoService.js
const ProductoRepository = require('../repositories/productoRepository');

class ProductoService {
  
  // Obtener todos los productos con paginación
  static async getAllProductos(page = 1, limit = 10, search = '', categoria = '') {
    try {
      const result = await ProductoRepository.findAll(page, limit, search, categoria);
      return result;
    } catch (error) {
      console.error('Error en getAllProductos:', error);
      throw error;
    }
  }

  // Obtener producto por ID
  static async getProductoById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de producto inválido');
      }

      const producto = await ProductoRepository.findById(id);
      
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      return producto;
    } catch (error) {
      console.error('Error en getProductoById:', error);
      throw error;
    }
  }

  // Crear nuevo producto
  static async createProducto(productoData) {
    try {
      // Validar datos requeridos
      this.validateProductoData(productoData);

      // Verificar si ya existe un producto con el mismo código
      const exists = await ProductoRepository.existsByCode(productoData.codigo);
      if (exists) {
        throw new Error('Ya existe un producto con este código');
      }

      const productoId = await ProductoRepository.create(productoData);
      
      // Si se proporciona precio, crearlo
      if (productoData.precio_venta) {
        await ProductoRepository.createPrice({
          id_producto: productoId,
          precio_venta: productoData.precio_venta,
          precio_compra: productoData.precio_compra || null,
          motivo_cambio: 'Precio inicial',
          id_empleado_modifico: productoData.id_empleado_modifico || null
        });
      }

      return await this.getProductoById(productoId);
    } catch (error) {
      console.error('Error en createProducto:', error);
      throw error;
    }
  }

  // Actualizar producto
  static async updateProducto(id, productoData) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de producto inválido');
      }

      // Verificar que el producto existe
      await this.getProductoById(id);

      // Validar datos si se proporcionan
      if (Object.keys(productoData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      // Validar código único si se está actualizando
      if (productoData.codigo) {
        const exists = await ProductoRepository.existsByCode(productoData.codigo, id);
        if (exists) {
          throw new Error('Ya existe un producto con este código');
        }
      }

      const updated = await ProductoRepository.update(id, productoData);
      
      if (!updated) {
        throw new Error('No se pudo actualizar el producto');
      }

      return await this.getProductoById(id);
    } catch (error) {
      console.error('Error en updateProducto:', error);
      throw error;
    }
  }

  // Eliminar producto (soft delete)
  static async deleteProducto(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de producto inválido');
      }

      // Verificar que el producto existe
      await this.getProductoById(id);

      const deleted = await ProductoRepository.delete(id);
      
      if (!deleted) {
        throw new Error('No se pudo eliminar el producto');
      }

      return true;
    } catch (error) {
      console.error('Error en deleteProducto:', error);
      throw error;
    }
  }

  // Obtener productos para select
  static async getProductosForSelect() {
    try {
      return await ProductoRepository.getForSelect();
    } catch (error) {
      console.error('Error en getProductosForSelect:', error);
      throw error;
    }
  }

  // Obtener productos con stock bajo
  static async getProductsWithLowStock() {
    try {
      return await ProductoRepository.getProductsWithLowStock();
    } catch (error) {
      console.error('Error en getProductsWithLowStock:', error);
      throw error;
    }
  }

  // Obtener historial de precios
  static async getPriceHistory(productId) {
    try {
      if (!productId || isNaN(productId)) {
        throw new Error('ID de producto inválido');
      }

      return await ProductoRepository.getPriceHistory(productId);
    } catch (error) {
      console.error('Error en getPriceHistory:', error);
      throw error;
    }
  }

  // Actualizar precio
  static async updatePrice(productId, priceData) {
    try {
      if (!productId || isNaN(productId)) {
        throw new Error('ID de producto inválido');
      }

      // Verificar que el producto existe
      await this.getProductoById(productId);

      // Validar datos del precio
      if (!priceData.precio_venta || priceData.precio_venta <= 0) {
        throw new Error('El precio de venta es requerido y debe ser mayor a 0');
      }

      const priceId = await ProductoRepository.createPrice({
        id_producto: productId,
        ...priceData
      });

      return { id: priceId };
    } catch (error) {
      console.error('Error en updatePrice:', error);
      throw error;
    }
  }

  // Obtener stock del producto
  static async getProductStock(productId) {
    try {
      if (!productId || isNaN(productId)) {
        throw new Error('ID de producto inválido');
      }

      return await ProductoRepository.getStockByProduct(productId);
    } catch (error) {
      console.error('Error en getProductStock:', error);
      throw error;
    }
  }

  // Validar datos de producto
  static validateProductoData(data) {
    const requiredFields = ['codigo', 'nombre', 'id_categoria', 'id_unidad'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`El campo ${field} es requerido`);
      }
    }

    // Validar longitud de campos
    if (data.codigo.length > 20) {
      throw new Error('El código no puede exceder 20 caracteres');
    }

    if (data.nombre.length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres');
    }

    // Validar valores numéricos
    if (data.porcentaje_descuento !== undefined) {
      const descuento = parseFloat(data.porcentaje_descuento);
      if (isNaN(descuento) || descuento < 0 || descuento > 100) {
        throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
      }
    }

    if (data.stock_minimo !== undefined) {
      const stock = parseInt(data.stock_minimo);
      if (isNaN(stock) || stock < 0) {
        throw new Error('El stock mínimo debe ser un número mayor o igual a 0');
      }
    }

    if (data.tiempo_duracion_anos !== undefined && data.tiempo_duracion_anos !== null) {
      const anos = parseInt(data.tiempo_duracion_anos);
      if (isNaN(anos) || anos < 0) {
        throw new Error('El tiempo de duración debe ser un número mayor o igual a 0');
      }
    }

    if (data.extension_cobertura_m2 !== undefined && data.extension_cobertura_m2 !== null) {
      const cobertura = parseFloat(data.extension_cobertura_m2);
      if (isNaN(cobertura) || cobertura < 0) {
        throw new Error('La extensión de cobertura debe ser un número mayor o igual a 0');
      }
    }
  }
}

module.exports = ProductoService;