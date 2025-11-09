// backend/server.js - VERSIÓN CORREGIDA COMPLETA
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const sucursalRoutes = require('./src/routes/sucursalRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const facturaRoutes = require('./src/routes/facturaRoutes');
const catalogoRoutes = require('./src/routes/catalogoRoutes');

// Importar utilidades
const { responseSuccess, responseError } = require('./src/utils/responses');

// Crear aplicación Express
const app = express();

// ===================================================================
// CONFIGURACIÓN CORS MEJORADA
// ===================================================================
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

// ===================================================================
// MIDDLEWARES GLOBALES
// ===================================================================
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Middleware de logging mejorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  
  // Log de headers de autenticación (sin mostrar el token completo)
  if (req.headers.authorization) {
    console.log('🔐 Authorization header present');
  }
  if (req.cookies?.authToken) {
    console.log('🍪 Auth cookie present');
  }
  
  next();
});

// ===================================================================
// RUTAS DE SALUD Y VERIFICACIÓN
// ===================================================================
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    return responseSuccess(res, 'Sistema Paints API funcionando correctamente', {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      database: dbConnected ? 'Conectada' : 'Desconectada',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    });
  } catch (error) {
    return responseError(res, 'Error en verificación de salud', 500);
  }
});

app.get('/', (req, res) => {
  return responseSuccess(res, 'Bienvenido al Sistema Paints API', {
    message: 'API del Sistema de Gestión de Pinturas',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      sucursales: '/api/sucursales',
      categorias: '/api/categorias', 
      productos: '/api/productos',
      clientes: '/api/clientes',
      facturas: '/api/facturas',
      catalogos: '/api/catalogos'
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

// ===================================================================
// RUTAS DE LA API
// ===================================================================
app.use('/api/auth', authRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/catalogos', catalogoRoutes);

// Ruta de documentación básica
app.get('/api/docs', (req, res) => {
  return responseSuccess(res, 'Documentación de la API', {
    baseURL: `${req.protocol}://${req.get('host')}/api`,
    authentication: {
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      profile: 'GET /api/auth/profile'
    },
    modules: {
      sucursales: {
        list: 'GET /api/sucursales',
        create: 'POST /api/sucursales',
        update: 'PUT /api/sucursales/:id',
        delete: 'DELETE /api/sucursales/:id'
      },
      categorias: {
        list: 'GET /api/categorias',
        create: 'POST /api/categorias',
        update: 'PUT /api/categorias/:id',
        delete: 'DELETE /api/categorias/:id'
      },
      productos: {
        list: 'GET /api/productos',
        create: 'POST /api/productos',
        update: 'PUT /api/productos/:id',
        delete: 'DELETE /api/productos/:id'
      },
      clientes: {
        list: 'GET /api/clientes',
        create: 'POST /api/clientes',
        update: 'PUT /api/clientes/:id',
        delete: 'DELETE /api/clientes/:id'
      },
      facturas: {
        list: 'GET /api/facturas',
        create: 'POST /api/facturas',
        details: 'GET /api/facturas/:id',
        cancel: 'PUT /api/facturas/:id/anular'
      }
    }
  });
});

// ===================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===================================================================
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  
  // Error de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return responseError(res, 'JSON inválido en el cuerpo de la petición', 400);
  }
  
  // Error de archivo muy grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return responseError(res, 'Archivo demasiado grande', 413);
  }
  
  // Errores de base de datos
  if (err.code === 'ER_DUP_ENTRY') {
    return responseError(res, 'Ya existe un registro con esos datos', 409);
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return responseError(res, 'Referencia no válida en base de datos', 400);
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return responseError(res, 'No se puede eliminar: registro tiene dependencias', 400);
  }
  
  // Error general
  return responseError(res, 'Error interno del servidor', 500);
});

// ===================================================================
// MIDDLEWARE PARA RUTAS NO ENCONTRADAS
// ===================================================================
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return responseError(res, 'Endpoint de API no encontrado', 404, {
      path: req.path,
      method: req.method,
      suggestion: 'Verifica la documentación en /api/docs'
    });
  }
  
  return res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'Esta ruta no existe en el servidor',
    path: req.path,
    method: req.method,
    suggestion: 'Visita /health para ver el estado de la API o /api/docs para la documentación'
  });
});

// ===================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ===================================================================
async function initializeServer() {
  try {
    console.log('🔄 Inicializando Sistema Paints Backend...');
    
    // Verificar conexión a base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos sistema_paints_final');
      console.error('💡 Asegúrate de:');
      console.error('   1. Tener MySQL ejecutándose');
      console.error('   2. La base de datos "sistema_paints_final" creada');
      console.error('   3. Las credenciales correctas en el .env');
      process.exit(1);
    }
    
    console.log('✅ Conexión a base de datos establecida');
    
    // Configurar puerto
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'localhost';
    
    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log('\n🚀 ======================================');
      console.log('   SISTEMA PAINTS - BACKEND INICIADO');
      console.log('🚀 ======================================');
      console.log(`📡 Servidor corriendo en: http://${HOST}:${PORT}`);
      console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`📚 Documentación: http://${HOST}:${PORT}/api/docs`);
      console.log(`🌐 Base de datos: ${process.env.DB_NAME || 'sistema_paints_final'}`);
      console.log('✅ Todas las fases del backend funcionando correctamente');
      console.log('======================================\n');
    });

  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

// ===================================================================
// MANEJO GRACEFUL DEL CIERRE
// ===================================================================
process.on('SIGINT', async () => {
  console.log('\n🔄 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
  console.error('En promise:', promise);
});

// ===================================================================
// INICIALIZAR SI ES EL ARCHIVO PRINCIPAL
// ===================================================================
if (require.main === module) {
  initializeServer();
}

module.exports = app;