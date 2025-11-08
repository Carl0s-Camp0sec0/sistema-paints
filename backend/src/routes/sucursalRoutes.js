// backend/src/routes/sucursalRoutes.js
const express = require('express');
const SucursalController = require('../controllers/sucursalController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // CAMBIADO: nombres actualizados

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para obtener datos (todos los perfiles pueden ver)
router.get('/', SucursalController.getAll);
router.get('/select', SucursalController.getForSelect);
router.get('/nearest', SucursalController.findNearest);
router.get('/:id', SucursalController.getById);

// Rutas para modificar datos (solo Gerente y Digitador)
router.post('/', authorizeRoles(['Gerente', 'Digitador']), SucursalController.create);
router.put('/:id', authorizeRoles(['Gerente', 'Digitador']), SucursalController.update);

// Rutas para eliminar (solo Gerente)
router.delete('/:id', authorizeRoles(['Gerente']), SucursalController.delete);

module.exports = router;