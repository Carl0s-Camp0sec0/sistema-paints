// backend/src/controllers/productoController.js - VERSIÓN CORREGIDA COMPLETA
const ProductoRepository = require('../repositories/productoRepository');
const { responseSuccess, responseError } = require('../utils/responses');

class ProductoController {

  // Obtener todos los productos con filtros
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const categoria = req.query.categoria || '';

      const result = await ProductoRepository.findAll(page, limit, search, categoria);

      return responseSuccess(res, 'Productos obtenidos exitosamente', {
        productos: result.productos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
          itemsPerPage: limit
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

  // Crear nuevo producto
  static async create(req, res) {
    try {
      const {
        codigo,
        nombre,
        descripcion,
        id_categoria,
        precio_venta,
        descuento_porcentaje,
        id_unidad_medida,
        id_color,
        stock_minimo,
        stock_actual,
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
        return responseError(res, 'Categoría o unidad de medida no válida', 400);
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

      // Limpiar y preparar datos
      const cleanData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== '') {
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
        return responseError(res, 'Categoría o unidad de medida no válida', 400);
      }
      
      return responseError(res, 'Error al actualizar producto', 500);
    }
  }

  // Eliminar producto (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return responseError(res, 'ID de producto inválido', 400);
      }

      const producto = await ProductoRepository.findById(id);
      if (!producto) {
        return responseError(res, 'Producto no encontrado', 404);
      }

      const deleted = await ProductoRepository.delete(id);

      if (!deleted) {
        return responseError(res, 'No se pudo eliminar el producto', 400);
      }

      return responseSuccess(res, 'Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error en delete producto:', error);
      return responseError(res, 'Error al eliminar producto', 500);
    }
  }

  // Obtener productos para dropdown/select
  static async getForSelect(req, res) {
    try {
      const productos = await ProductoRepository.getForSelect();
      return responseSuccess(res, 'Productos obtenidos exitosamente', productos);
    } catch (error) {
      console.error('Error en getForSelect productos:', error);
      return responseError(res, 'Error al obtener productos', 500);
    }
  }

  // Obtener datos para formularios (categorías, unidades, colores)
  static async getFormData(req, res) {
    try {
      const [categorias, unidadesMedida, colores] = await Promise.all([
        ProductoRepository.getCategorias(),
        ProductoRepository.getUnidadesMedida(),
        ProductoRepository.getColores()
      ]);

      return responseSuccess(res, 'Datos para formularios obtenidos exitosamente', {
        categorias,
        unidadesMedida,
        colores
      });
    } catch (error) {
      console.error('Error en getFormData:', error);
      return responseError(res, 'Error al obtener datos para formularios', 500);
    }
  }

  // Obtener productos con stock bajo
  static async getLowStock(req, res) {
    try {
      const productos = await ProductoRepository.getProductsWithLowStock();
      return responseSuccess(res, 'Productos con stock bajo obtenidos exitosamente', productos);
    } catch (error) {
      console.error('Error en getLowStock:', error);
      return responseError(res, 'Error al obtener productos con stock bajo', 500);
    }
  }

  // Buscar productos
  static async search(req, res) {
    try {
      const { termino } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!termino || termino.trim().length < 2) {
        return responseError(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const result = await ProductoRepository.findAll(page, limit, termino.trim());

      return responseSuccess(res, 'Búsqueda completada exitosamente', {
        productos: result.productos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error en search productos:', error);
      return responseError(res, 'Error al buscar productos', 500);
    }
  }
}

module.exports = ProductoController;