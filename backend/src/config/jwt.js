// backend/src/config/jwt.js - VERSIÓN COMPLETA
require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'paints_system_secret_key_2024_ultra_secure',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'sistema-paints',
  audience: 'paints-users',
  algorithm: 'HS256'
};

// Configuración de cookies
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  path: '/'
};

// Configuración de refresh token
const refreshTokenConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
  path: '/'
};

module.exports = {
  jwtConfig,
  cookieConfig,
  refreshTokenConfig
};