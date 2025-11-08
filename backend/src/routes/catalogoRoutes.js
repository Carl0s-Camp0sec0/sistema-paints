// backend/src/routes/catalogoRoutes.js - CORREGIDO

const express = require('express');
const router = express.Router();
const FacturaService = require('../services/facturaService');
const { responseSuccess, responseError } = require('../utils/responses');
const { authenticateToken } = require('../middleware/auth'); // CORRECCIÓN: ../middleware (singular)

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/catalogos/tipos-pago
router.get('/tipos-pago', async (req, res) => {
    try {
        const tiposPago = await FacturaService.obtenerTiposPago();
        return responseSuccess(res, 'Tipos de pago obtenidos exitosamente', tiposPago);
    } catch (error) {
        console.error('Error en /tipos-pago:', error);
        return responseError(res, 'Error al obtener tipos de pago', 500);
    }
});

// GET /api/catalogos/series-factura
router.get('/series-factura', async (req, res) => {
    try {
        const series = await FacturaService.obtenerSeriesFactura();
        return responseSuccess(res, 'Series de factura obtenidas exitosamente', series);
    } catch (error) {
        console.error('Error en /series-factura:', error);
        return responseError(res, 'Error al obtener series de factura', 500);
    }
});

// GET /api/catalogos/productos-facturacion
router.get('/productos-facturacion', async (req, res) => {
    try {
        const productos = await FacturaService.obtenerProductosFacturacion();
        return responseSuccess(res, 'Productos para facturación obtenidos exitosamente', productos);
    } catch (error) {
        console.error('Error en /productos-facturacion:', error);
        return responseError(res, 'Error al obtener productos para facturación', 500);
    }
});

module.exports = router;