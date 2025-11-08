// backend/src/routes/facturaRoutes.js - CORREGIDO

const express = require('express');
const router = express.Router();
const FacturaController = require('../controllers/facturaController');
const { authenticateToken } = require('../middleware/auth'); // CORRECCIÓN: ../middleware (singular)

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas principales
router.get('/', FacturaController.obtenerFacturas);
router.get('/:id', FacturaController.obtenerFacturaPorId);
router.post('/', FacturaController.crearFactura);
router.put('/:id/anular', FacturaController.anularFactura);

// Rutas de utilidad
router.post('/validar-stock', FacturaController.validarStock);
router.get('/numero/:numero_factura', FacturaController.buscarPorNumero);
router.get('/:id/imprimir', FacturaController.obtenerDetalleParaImpresion);
router.get('/serie/:id_serie/proximo-numero', FacturaController.obtenerProximoNumero);

module.exports = router;