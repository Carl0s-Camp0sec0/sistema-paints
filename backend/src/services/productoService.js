// backend/src/services/productoService.js - CORREGIDO PARA CONSISTENCIA

const ProductoRepository = require('../repositories/productoRepository');

class ProductoService {
  
  // Obtener todos los productos con paginación
  static async getAllProductos(page = 1, limit = 10, search = '', categoria = '') {
    try {
      const result = await ProductoRepository.findAll(page, limit, search, categoria);
      
      // CORRECCIÓN: Estructura consistente como sucursales
      return {
        productos: result.data || result.productos || result,  // Adaptable a tu estructura
        total: result.total || result.length || 0,
        page: result.page || page,
        limit: result.limit || limit
      };
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

      const newProducto = await ProductoRepository.create(productoData);
      
      // Si se proporciona precio, crearlo
      if (productoData.precio_venta && newProducto.id_producto) {
        await ProductoRepository.createPrice({
          id_producto: newProducto.id_producto,
          precio_venta: productoData.precio_venta,
          precio_compra: productoData.precio_compra || null,
          motivo_cambio: 'Precio inicial'
        });
      }

      return newProducto;
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

      const updatedProducto = await ProductoRepository.update(id, productoData);
      return updatedProducto;
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

      await ProductoRepository.delete(id);
      return true;
    } catch (error) {
      console.error('Error en deleteProducto:', error);
      throw error;
    }
  }

  // Obtener productos para select
  static async getProductosForSelect() {
    try {
      const productos = await ProductoRepository.getForSelect();
      return productos;
    } catch (error) {
      console.error('Error en getProductosForSelect:', error);
      throw error;
    }
  }

  // Obtener productos con stock bajo
  static async getProductsWithLowStock(limite = 10) {
    try {
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          COALESCE(SUM(sb.cantidad_actual), 0) as stock_actual
        FROM productos p
        LEFT JOIN stock_bodega sb ON p.id_producto = sb.id_producto
        WHERE p.estado = TRUE
        GROUP BY p.id_producto, p.codigo, p.nombre
        HAVING stock_actual <= ?
        ORDER BY stock_actual ASC
        LIMIT 50
      `;
      
      const { executeQuery } = require('../config/database');
      const productos = await executeQuery(sql, [limite]);
      return productos;
    } catch (error) {
      console.error('Error en getProductsWithLowStock:', error);
      throw error;
    }
  }

  // Obtener historial de precios
  static async getPriceHistory(id) {
    try {
      const precios = await ProductoRepository.getPriceHistory(id);
      return precios;
    } catch (error) {
      console.error('Error en getPriceHistory:', error);
      throw error;
    }
  }

  // Obtener stock por producto
  static async getStockByProduct(id) {
    try {
      const stock = await ProductoRepository.getStockByProduct(id);
      return stock;
    } catch (error) {
      console.error('Error en getStockByProduct:', error);
      throw error;
    }
  }

  // Actualizar precio
  static async updatePrice(priceData) {
    try {
      const priceId = await ProductoRepository.createPrice(priceData);
      return priceId;
    } catch (error) {
      console.error('Error en updatePrice:', error);
      throw error;
    }
  }

  // Validar datos de producto
  static validateProductoData(data) {
    const errors = [];

    if (!data.codigo || data.codigo.trim().length === 0) {
      errors.push('El código es obligatorio');
    }

    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre es obligatorio');
    }

    if (!data.id_categoria || isNaN(data.id_categoria)) {
      errors.push('La categoría es obligatoria');
    }

    if (data.codigo && data.codigo.trim().length > 20) {
      errors.push('El código no puede exceder 20 caracteres');
    }

    if (data.nombre && data.nombre.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }

    if (data.precio_venta && (isNaN(data.precio_venta) || data.precio_venta <= 0)) {
      errors.push('El precio de venta debe ser un número positivo');
    }

    if (data.porcentaje_descuento && (isNaN(data.porcentaje_descuento) || data.porcentaje_descuento < 0 || data.porcentaje_descuento > 100)) {
      errors.push('El porcentaje de descuento debe estar entre 0 y 100');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

module.exports = ProductoService;