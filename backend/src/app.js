// backend/src/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/database');
const { responseError } = require('./utils/responses');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const productoRoutes = require('./routes/productoRoutes');

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'http://localhost:5501',    // ← Agregar este puerto
    'http://127.0.0.1:5501'     // ← Agregar este puerto
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Log de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sistema Paints API funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);

// Ruta para servir archivos estáticos del frontend
app.use(express.static('public'));

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  // Error de validación de JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return responseError(res, 'JSON inválido en el cuerpo de la petición', 400);
  }
  
  // Error de límite de tamaño
  if (err.code === 'LIMIT_FILE_SIZE') {
    return responseError(res, 'Archivo demasiado grande', 413);
  }
  
  // Error genérico
  return responseError(res, 'Error interno del servidor', 500);
});

// Middleware para rutas no encontradas (debe ir al final)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return responseError(res, 'Endpoint de API no encontrado', 404);
  }
  
  // Para rutas no API, podrías servir el frontend o retornar 404
  return responseError(res, 'Ruta no encontrada', 404);
});

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    // Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    console.log('✅ Aplicación inicializada correctamente');
    return app;
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

module.exports = { app, initializeApp };