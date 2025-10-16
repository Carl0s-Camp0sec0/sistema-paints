// backend/src/config/jwt.js
require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'paints_system_secret_key_2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'sistema-paints',
  audience: 'paints-users'
};

// Configuración de cookies
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
};

module.exports = {
  jwtConfig,
  cookieConfig
};