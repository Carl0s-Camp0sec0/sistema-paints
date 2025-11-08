// backend/src/routes/categoriaRoutes.js
const express = require('express');
const CategoriaController = require('../controllers/categoriaController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // CAMBIADO: nombres actualizados

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para obtener datos (todos los perfiles pueden ver)
router.get('/', CategoriaController.getAll);
router.get('/select', CategoriaController.getForSelect);
router.get('/stats', CategoriaController.getStats);
router.get('/:id', CategoriaController.getById);

// Rutas para modificar datos (solo Gerente y Digitador)
router.post('/', authorizeRoles(['Gerente', 'Digitador']), CategoriaController.create);
router.put('/:id', authorizeRoles(['Gerente', 'Digitador']), CategoriaController.update);

// Rutas para eliminar (solo Gerente)
router.delete('/:id', authorizeRoles(['Gerente']), CategoriaController.delete);

module.exports = router;