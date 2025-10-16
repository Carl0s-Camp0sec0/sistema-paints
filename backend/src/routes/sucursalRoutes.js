// backend/src/routes/sucursalRoutes.js
const express = require('express');
const SucursalController = require('../controllers/sucursalController');
const { requireAuth, requireGerenteOrDigitador, requireGerente } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Rutas para obtener datos (todos los perfiles pueden ver)
router.get('/', SucursalController.getAll);
router.get('/select', SucursalController.getForSelect);
router.get('/nearest', SucursalController.findNearest);
router.get('/:id', SucursalController.getById);

// Rutas para modificar datos (solo Gerente y Digitador)
router.post('/', requireGerenteOrDigitador, SucursalController.create);
router.put('/:id', requireGerenteOrDigitador, SucursalController.update);

// Rutas para eliminar (solo Gerente)
router.delete('/:id', requireGerente, SucursalController.delete);

module.exports = router;