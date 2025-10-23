// backend/src/routes/catalogos.js

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const FacturaService = require('../services/facturaService');
const ProductoService = require('../services/productoService');
const { responseSuccess, responseError } = require('../utils/responses');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener tipos de pago
router.get('/tipos-pago', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  async (req, res) => {
    try {
      const tiposPago = await FacturaService.obtenerTiposPago();
      return responseSuccess(res, 'Tipos de pago obtenidos', tiposPago);
    } catch (error) {
      console.error('Error al obtener tipos de pago:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
);

// Obtener series de factura
router.get('/series-factura', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  async (req, res) => {
    try {
      const series = await FacturaService.obtenerSeriesFactura();
      return responseSuccess(res, 'Series de factura obtenidas', series);
    } catch (error) {
      console.error('Error al obtener series de factura:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
);

// Obtener productos para facturación
router.get('/productos-facturacion', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  async (req, res) => {
    try {
      const { search = '' } = req.query;
      const productos = await ProductoService.getProductosForSelect();
      
      // Filtrar por búsqueda si se proporciona
      let productosFiltrados = productos;
      if (search.trim()) {
        const searchTerm = search.toLowerCase();
        productosFiltrados = productos.filter(producto => 
          producto.nombre.toLowerCase().includes(searchTerm) ||
          producto.codigo.toLowerCase().includes(searchTerm)
        );
      }
      
      return responseSuccess(res, 'Productos para facturación obtenidos', productosFiltrados);
    } catch (error) {
      console.error('Error al obtener productos para facturación:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
);

// Obtener unidades de medida
router.get('/unidades-medida', 
  authorizeRoles(['Gerente', 'Digitador']), 
  async (req, res) => {
    try {
      const { executeQuery } = require('../config/database');
      const sql = `
        SELECT id_unidad, nombre, abreviatura, descripcion
        FROM unidades_medida
        WHERE estado = TRUE
        ORDER BY nombre
      `;
      
      const unidades = await executeQuery(sql);
      return responseSuccess(res, 'Unidades de medida obtenidas', unidades);
    } catch (error) {
      console.error('Error al obtener unidades de medida:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
);

// Obtener colores
router.get('/colores', 
  authorizeRoles(['Gerente', 'Digitador']), 
  async (req, res) => {
    try {
      const { executeQuery } = require('../config/database');
      const sql = `
        SELECT id_color, nombre, codigo_hex, descripcion
        FROM colores
        WHERE estado = TRUE
        ORDER BY nombre
      `;
      
      const colores = await executeQuery(sql);
      return responseSuccess(res, 'Colores obtenidos', colores);
    } catch (error) {
      console.error('Error al obtener colores:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
);

// Obtener información de la empresa para facturas
router.get('/empresa-info', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  async (req, res) => {
    try {
      const { executeQuery } = require('../config/database');
      
      // Obtener configuraciones del sistema
      const sql = `SELECT clave, valor FROM configuracion_sistema`;
      const configuraciones = await executeQuery(sql);
      
      // Convertir a objeto
      const config = {};
      configuraciones.forEach(item => {
        config[item.clave] = item.valor;
      });
      
      const empresaInfo = {
        nombre_empresa: config.nombre_empresa || 'Cadena de Pinturas PAINTS',
        nit_empresa: config.nit_empresa || '12345678-9',
        direccion_empresa: config.direccion_empresa || 'Ciudad de Guatemala',
        telefono_empresa: config.telefono_empresa || '2234-5678',
        email_empresa: config.email_empresa || 'info@paints.com.gt',
        porcentaje_iva: parseFloat(config.porcentaje_iva) || 12.00,
        moneda_base: config.moneda_base || 'GTQ'
      };
      
      return responseSuccess(res, 'Información de empresa obtenida', empresaInfo);
    } catch (error) {
      console.error('Error al obtener información de empresa:', error);
      return responseError(res, error.message || 'Error interno del servidor', 500);
    }
  }
);

module.exports = router;