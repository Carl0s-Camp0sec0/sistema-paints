// backend/src/app.js - VERSIÓN COMPLETA CORREGIDA

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/database');
const { responseError } = require('./utils/responses');

// Importar rutas existentes de Fase 1
const authRoutes = require('./routes/authRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const productoRoutes = require('./routes/productoRoutes');

// CORRECCIÓN: Importar nuevas rutas de Fase 2 con nombres exactos
const facturaRoutes = require('./routes/facturaRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');

const app = express();

// Configuración de CORS
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

// Ruta de health check actualizada
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sistema Paints API funcionando',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    database: 'sistema_paints_final',
    fase: 'Fase 1 y 2 - Completadas',
    features: [
      'Autenticación y usuarios',
      'Gestión de sucursales',
      'Gestión de categorías',
      'Gestión de productos',
      'Sistema de facturación',
      'Medios de pago',
      'Gestión de clientes',
      'Impresión de facturas',
      'Sistema transaccional'
    ]
  });
});

// Rutas de la API - Fase 1 (existentes)
app.use('/api/auth', authRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);

// CORRECCIÓN: Rutas de la API - Fase 2 con nombres exactos
app.use('/api/facturas', facturaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/catalogos', catalogoRoutes);

// Ruta para servir archivos estáticos del frontend
app.use(express.static('public'));

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema Paints API - Fases 1 y 2',
    version: '2.1.0',
    database: 'sistema_paints_final',
    documentation: '/health',
    endpoints: {
      auth: '/api/auth',
      sucursales: '/api/sucursales',
      categorias: '/api/categorias',
      productos: '/api/productos',
      facturas: '/api/facturas',
      clientes: '/api/clientes',
      catalogos: '/api/catalogos'
    },
    frontend: {
      login: 'http://localhost:5500/pages/login.html',
      dashboard: 'http://localhost:5500/pages/dashboard.html',
      sucursales: 'http://localhost:5500/pages/sucursales.html',
      categorias: 'http://localhost:5500/pages/categorias.html',
      productos: 'http://localhost:5500/pages/productos.html',
      facturacion: 'http://localhost:5500/pages/facturacion.html',
      clientes: 'http://localhost:5500/pages/clientes.html'
    }
  });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return responseError(res, 'JSON inválido en el cuerpo de la petición', 400);
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return responseError(res, 'Archivo demasiado grande', 413);
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return responseError(res, 'Ya existe un registro con esos datos', 409);
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return responseError(res, 'Referencia no válida en base de datos', 400);
  }
  
  return responseError(res, 'Error interno del servidor', 500);
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return responseError(res, 'Endpoint de API no encontrado', 404);
  }
  
  return res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'Esta ruta no existe en el servidor',
    suggestion: 'Visita /health para ver el estado de la API'
  });
});

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos sistema_paints_final');
      console.error('💡 Verifica que la base de datos esté creada y configurada correctamente');
      process.exit(1);
    }
    
    console.log('✅ Base de datos sistema_paints_final conectada correctamente');
    console.log('✅ Aplicación inicializada correctamente');
    console.log('📋 Fases 1 y 2 del backend completadas');
    
    return app;
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

module.exports = { app, initializeApp };