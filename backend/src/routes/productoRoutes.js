// backend/src/routes/productoRoutes.js - VERSIÓN CORREGIDA
const express = require('express');
const ProductoController = require('../controllers/productoController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para obtener datos (todos los perfiles pueden ver)
router.get('/', ProductoController.getAll);
router.get('/select', ProductoController.getForSelect);
router.get('/low-stock', ProductoController.getLowStock);
router.get('/:id', ProductoController.getById);
router.get('/:id/prices', ProductoController.getPriceHistory);
router.get('/:id/stock', ProductoController.getStock);

// Rutas para modificar datos (solo Gerente y Digitador)
router.post('/', authorizeRoles(['Gerente', 'Digitador']), ProductoController.create);
router.put('/:id', authorizeRoles(['Gerente', 'Digitador']), ProductoController.update);
router.post('/:id/prices', authorizeRoles(['Gerente', 'Digitador']), ProductoController.updatePrice);

// Rutas para eliminar (solo Gerente)
router.delete('/:id', authorizeRoles(['Gerente']), ProductoController.delete);

module.exports = router;