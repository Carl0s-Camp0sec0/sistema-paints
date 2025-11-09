// backend/src/routes/authRoutes.js - RUTAS DE AUTENTICACIÓN
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout); // Logout puede ser público

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, AuthController.getProfile);
router.get('/verify', AuthController.verifyToken);
router.post('/change-password', authenticateToken, AuthController.changePassword);

// Ruta de health check para auth
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;