// backend/src/routes/productoRoutes.js
const express = require('express');
const ProductoController = require('../controllers/productoController');
const { requireAuth, requireGerenteOrDigitador, requireGerente } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Rutas para obtener datos (todos los perfiles pueden ver)
router.get('/', ProductoController.getAll);
router.get('/select', ProductoController.getForSelect);
router.get('/low-stock', ProductoController.getLowStock);
router.get('/:id', ProductoController.getById);
router.get('/:id/prices', ProductoController.getPriceHistory);
router.get('/:id/stock', ProductoController.getStock);

// Rutas para modificar datos (solo Gerente y Digitador)
router.post('/', requireGerenteOrDigitador, ProductoController.create);
router.put('/:id', requireGerenteOrDigitador, ProductoController.update);
router.post('/:id/prices', requireGerenteOrDigitador, ProductoController.updatePrice);

// Rutas para eliminar (solo Gerente)
router.delete('/:id', requireGerente, ProductoController.delete);

module.exports = router;