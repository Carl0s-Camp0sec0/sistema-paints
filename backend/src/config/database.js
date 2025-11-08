// backend/src/config/database.js
const mysql = require('mysql2');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_paints_final', // CAMBIADO: nueva BD
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  multipleStatements: false,
  dateStrings: true
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  ...config,
  connectionLimit: 10,
  queueLimit: 0,
  reconnect: true,
  idleTimeout: 300000,
  acquireTimeout: 60000
});

// Promisificar para usar async/await
const promisePool = pool.promise();

/**
 * Ejecutar query con manejo de errores mejorado
 */
async function executeQuery(query, params = []) {
  try {
    const [rows] = await promisePool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error en executeQuery:', {
      error: error.message,
      query: query.substring(0, 100) + '...',
      params: params
    });
    throw error;
  }
}

/**
 * Ejecutar transacción
 */
async function executeTransaction(queries) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Error en transacción:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Probar conexión
 */
async function testConnection() {
  try {
    const [rows] = await promisePool.execute('SELECT 1 as test');
    console.log('✅ Conexión a base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a base de datos:', error.message);
    return false;
  }
}

/**
 * Cerrar conexiones del pool
 */
function closePool() {
  return new Promise((resolve) => {
    pool.end(() => {
      console.log('Pool de conexiones cerrado');
      resolve();
    });
  });
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('Cerrando pool de conexiones...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Cerrando pool de conexiones...');
  await closePool();
  process.exit(0);
});

module.exports = {
  pool: promisePool,
  executeQuery,
  executeTransaction,
  testConnection,
  closePool
};