// backend/src/routes/facturas.js

const express = require('express');
const router = express.Router();
const FacturaController = require('../controllers/facturaController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener facturas (todos los roles pueden consultar)
router.get('/', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.obtenerFacturas
);

// Obtener factura por ID
router.get('/:id', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.obtenerFacturaPorId
);

// Buscar factura por número
router.get('/numero/:numero_factura', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.buscarPorNumero
);

// Obtener detalle para impresión
router.get('/:id/imprimir', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.obtenerDetalleParaImpresion
);

// Crear nueva factura (Cajero y Digitador pueden crear)
router.post('/', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.crearFactura
);

// Anular factura (solo Gerente puede anular)
router.put('/:id/anular', 
  authorizeRoles(['Gerente']), 
  FacturaController.anularFactura
);

// Obtener próximo número de factura
router.get('/series/:id_serie/proximo-numero', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.obtenerProximoNumero
);

// Validar stock antes de facturar
router.post('/validar-stock', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  FacturaController.validarStock
);

module.exports = router;