// backend/src/routes/clientes.js

const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los clientes con paginación
router.get('/', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  ClienteController.obtenerClientes
);

// Obtener cliente por ID
router.get('/:id', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  ClienteController.obtenerClientePorId
);

// Buscar clientes (para autocomplete en facturación)
router.get('/buscar/:termino', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  ClienteController.buscarClientes
);

// Crear nuevo cliente
router.post('/', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  ClienteController.crearCliente
);

// Actualizar cliente
router.put('/:id', 
  authorizeRoles(['Gerente', 'Digitador']), 
  ClienteController.actualizarCliente
);

// Eliminar cliente (solo Gerente)
router.delete('/:id', 
  authorizeRoles(['Gerente']), 
  ClienteController.eliminarCliente
);

// Obtener historial de facturas del cliente
router.get('/:id/facturas', 
  authorizeRoles(['Gerente', 'Cajero', 'Digitador']), 
  ClienteController.obtenerFacturasCliente
);

module.exports = router;