// backend/src/routes/categoriaRoutes.js
const express = require('express');
const CategoriaController = require('../controllers/categoriaController');
const { requireAuth, requireGerenteOrDigitador, requireGerente } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Rutas para obtener datos (todos los perfiles pueden ver)
router.get('/', CategoriaController.getAll);
router.get('/select', CategoriaController.getForSelect);
router.get('/stats', CategoriaController.getStats);
router.get('/:id', CategoriaController.getById);

// Rutas para modificar datos (solo Gerente y Digitador)
router.post('/', requireGerenteOrDigitador, CategoriaController.create);
router.put('/:id', requireGerenteOrDigitador, CategoriaController.update);

// Rutas para eliminar (solo Gerente)
router.delete('/:id', requireGerente, CategoriaController.delete);

module.exports = router;