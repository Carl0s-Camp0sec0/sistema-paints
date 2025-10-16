// backend/src/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/login', AuthController.login);

// Rutas protegidas (requieren autenticación)
router.post('/logout', requireAuth, AuthController.logout);
router.get('/profile', requireAuth, AuthController.getProfile);
router.post('/verify-token', requireAuth, AuthController.verifyToken);
router.post('/change-password', requireAuth, AuthController.changePassword);
router.post('/refresh-token', requireAuth, AuthController.refreshToken);

module.exports = router;