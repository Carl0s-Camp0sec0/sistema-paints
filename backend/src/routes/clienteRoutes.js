// backend/src/routes/clienteRoutes.js - NUEVO ARCHIVO COMPLETO

const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { authenticateToken } = require('../middlewares/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas principales
router.get('/', ClienteController.getAll);
router.get('/:id', ClienteController.getById);
router.post('/', ClienteController.create);
router.put('/:id', ClienteController.update);
router.delete('/:id', ClienteController.delete);

// Rutas de utilidad
router.get('/buscar/:termino', ClienteController.search);
router.get('/select/dropdown', ClienteController.getForSelect);

module.exports = router;