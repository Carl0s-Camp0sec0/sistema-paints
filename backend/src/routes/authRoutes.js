// backend/src/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth'); // CAMBIADO: nombre actualizado

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/login', AuthController.login);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/verify-token', authenticateToken, AuthController.verifyToken);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.post('/refresh-token', authenticateToken, AuthController.refreshToken);

module.exports = router;