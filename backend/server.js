// backend/server.js
require('dotenv').config();
const { initializeApp } = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    console.log('🚀 Iniciando Sistema Paints API...');
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🔧 Entorno:', process.env.NODE_ENV || 'development');
    
    // Inicializar aplicación
    const app = await initializeApp();
    
    // Iniciar servidor
    const server = app.listen(PORT, HOST, () => {
      console.log('');
      console.log('🎉 ¡Servidor iniciado exitosamente!');
      console.log('📍 URL:', `http://${HOST}:${PORT}`);
      console.log('🏥 Health Check:', `http://${HOST}:${PORT}/health`);
      console.log('📚 API Base:', `http://${HOST}:${PORT}/api`);
      console.log('');
      console.log('🔗 Endpoints disponibles:');
      console.log('   • POST /api/auth/login');
      console.log('   • GET  /api/auth/profile');
      console.log('   • GET  /api/sucursales');
      console.log('   • GET  /api/categorias');
      console.log('   • GET  /api/productos');
      console.log('');
      console.log('✨ Sistema listo para recibir peticiones');
    });

    // Manejo de cierre graceful
    const gracefulShutdown = (signal) => {
      console.log(`\n🔄 Recibida señal ${signal}, cerrando servidor...`);
      
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });

      // Forzar cierre después de 30 segundos
      setTimeout(() => {
        console.error('❌ Forzando cierre del servidor');
        process.exit(1);
      }, 30000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();