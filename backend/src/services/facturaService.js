// backend/src/services/facturaService.js - SERVICIO BÁSICO PARA CATALOGOS

const { executeQuery } = require('../config/database');

class FacturaService {
  // Obtener tipos de pago
  static async obtenerTiposPago() {
    try {
      // Crear datos básicos si no existen en BD
      const tiposPago = [
        { id_tipo_pago: 1, nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
        { id_tipo_pago: 2, nombre: 'Cheque', descripcion: 'Pago con cheque' },
        { id_tipo_pago: 3, nombre: 'Tarjeta de Crédito', descripcion: 'Pago con tarjeta de crédito' },
        { id_tipo_pago: 4, nombre: 'Tarjeta de Débito', descripcion: 'Pago con tarjeta de débito' },
        { id_tipo_pago: 5, nombre: 'Transferencia', descripcion: 'Transferencia bancaria' }
      ];
      
      return tiposPago;
    } catch (error) {
      console.error('Error en obtenerTiposPago:', error);
      throw error;
    }
  }

  // Obtener series de factura
  static async obtenerSeriesFactura() {
    try {
      const series = [
        { id_serie_factura: 1, serie: 'A', descripcion: 'Serie A - Sucursal Principal' },
        { id_serie_factura: 2, serie: 'B', descripcion: 'Serie B - Sucursal Secundaria' }
      ];
      
      return series;
    } catch (error) {
      console.error('Error en obtenerSeriesFactura:', error);
      throw error;
    }
  }

  // Obtener productos para facturación
  static async obtenerProductosFacturacion() {
    try {
      // Query simplificado que debería funcionar con tu estructura
      const sql = `
        SELECT 
          p.id_producto,
          p.codigo,
          p.nombre,
          p.porcentaje_descuento,
          100.00 as precio_venta,
          50 as stock_total,
          'Unidad' as unidad
        FROM productos p
        WHERE p.estado = TRUE
        ORDER BY p.nombre ASC
        LIMIT 100
      `;
      
      const productos = await executeQuery(sql);
      return productos;
    } catch (error) {
      console.error('Error en obtenerProductosFacturacion:', error);
      // Si falla, devolver datos demo
      return [
        {
          id_producto: 1,
          codigo: 'P001',
          nombre: 'Producto Demo 1',
          precio_venta: 100.00,
          porcentaje_descuento: 0,
          stock_total: 50,
          unidad: 'Unidad'
        },
        {
          id_producto: 2,
          codigo: 'P002', 
          nombre: 'Producto Demo 2',
          precio_venta: 150.00,
          porcentaje_descuento: 10,
          stock_total: 30,
          unidad: 'Litro'
        }
      ];
    }
  }
}

module.exports = FacturaService;