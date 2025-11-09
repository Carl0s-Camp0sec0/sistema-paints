// backend/src/routes/authRoutes.js - VERSIÓN CORREGIDA SIMPLIFICADA

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (sin autenticación)
router.post('/login', AuthController.login);

// Rutas protegidas (requieren autenticación) - SOLO las esenciales
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/verify-token', authenticateToken, AuthController.verifyToken);

module.exports = router;