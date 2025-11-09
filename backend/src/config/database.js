// backend/src/config/database.js - VERSIÓN CORREGIDA PARA XAMPP/MARIADB
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración específica para XAMPP/MariaDB
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_paints_final',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Reducido para XAMPP
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Configuraciones específicas para MariaDB/XAMPP
  multipleStatements: false,
  namedPlaceholders: false,
  supportBigNumbers: true,
  bigNumberStrings: true
};

// Crear el pool de conexiones
let pool;

try {
  pool = mysql.createPool(poolConfig);
  console.log('✅ Pool de conexiones MySQL/MariaDB creado correctamente');
} catch (error) {
  console.error('❌ Error al crear pool de conexiones:', error);
  process.exit(1);
}

/**
 * Ejecutar consulta con manejo de errores mejorado para XAMPP
 */
async function executeQuery(query, params = []) {
  try {
    console.log('🔍 Ejecutando query:', query.substring(0, 100).replace(/\s+/g, ' ') + '...');
    console.log('📋 Parámetros:', params);

    // Validar parámetros - CORRECCIÓN CRÍTICA para XAMPP
    const validParams = params.map(param => {
      if (param === undefined) {
        console.warn('⚠️ Parámetro undefined detectado, convirtiendo a null');
        return null;
      }
      if (param === '') {
        return null; // Convertir strings vacíos a null para MariaDB
      }
      return param;
    });

    // Ejecutar con validación de parámetros
    if (validParams.length > 0) {
      const [rows] = await pool.execute(query, validParams);
      console.log(`✅ Query ejecutada exitosamente. Registros: ${rows.affectedRows || rows.length}`);
      return rows;
    } else {
      const [rows] = await pool.query(query);
      console.log(`✅ Query sin parámetros ejecutada exitosamente. Registros: ${rows.length}`);
      return rows;
    }
  } catch (error) {
    console.error('❌ Error en executeQuery:', {
      error: error.message,
      code: error.code,
      errno: error.errno,
      query: query.substring(0, 200).replace(/\s+/g, ' ') + '...',
      params: params
    });
    throw error;
  }
}

/**
 * Ejecutar transacción
 */
async function executeTransaction(queries) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('🔄 Iniciando transacción');

    const results = [];
    
    for (const queryObj of queries) {
      console.log('📝 Ejecutando query en transacción:', queryObj.query.substring(0, 100) + '...');
      
      // Validar parámetros en transacción también
      const validParams = (queryObj.params || []).map(param => {
        if (param === undefined) {
          console.warn('⚠️ Parámetro undefined en transacción, convirtiendo a null');
          return null;
        }
        if (param === '') {
          return null;
        }
        return param;
      });
      
      const [result] = await connection.execute(queryObj.query, validParams);
      results.push(result);
    }

    await connection.commit();
    console.log('✅ Transacción completada exitosamente');
    
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en transacción, rollback ejecutado:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Obtener una conexión del pool
 */
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('❌ Error al obtener conexión del pool:', error);
    throw error;
  }
}

/**
 * Probar conexión a la base de datos - CORREGIDO PARA MARIADB
 */
async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    const connection = await pool.getConnection();
    
    // Probar consulta simple sin parámetros
    await connection.query('SELECT 1 as test');
    console.log('✅ Conexión a la base de datos exitosa');
    
    // Verificar que existe la base de datos
    const [databases] = await connection.query(`SHOW DATABASES LIKE '${process.env.DB_NAME || 'sistema_paints_final'}'`);
    
    if (databases.length === 0) {
      console.error(`❌ Base de datos "${process.env.DB_NAME || 'sistema_paints_final'}" no existe`);
      connection.release();
      return false;
    }
    
    // Verificar algunas tablas importantes
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    
    if (tables.length === 0) {
      console.warn('⚠️ No se encontraron tablas en la base de datos');
    }
    
    // Verificar tabla de usuarios específicamente
    try {
      const [users] = await connection.query('SELECT COUNT(*) as total FROM usuarios');
      console.log(`👥 Usuarios en sistema: ${users[0].total}`);
    } catch (userError) {
      console.warn('⚠️ No se pudo verificar tabla de usuarios:', userError.message);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al probar conexión:', {
      message: error.message,
      code: error.code,
      errno: error.errno
    });
    return false;
  }
}

/**
 * Cerrar pool de conexiones
 */
async function closePool() {
  try {
    console.log('🔄 Cerrando pool de conexiones...');
    await pool.end();
    console.log('✅ Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error al cerrar pool:', error);
  }
}

/**
 * Funciones de utilidad para consultas frecuentes - MEJORADAS PARA XAMPP
 */

// Buscar por ID genérico
async function findById(table, id, idColumn = 'id') {
  try {
    const query = `SELECT * FROM ${table} WHERE ${idColumn} = ?`;
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error en findById para tabla ${table}:`, error);
    throw error;
  }
}

// Insertar registro genérico
async function insertRecord(table, data) {
  try {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await executeQuery(query, values);
    
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error(`Error en insertRecord para tabla ${table}:`, error);
    throw error;
  }
}

// Actualizar registro genérico
async function updateRecord(table, id, data, idColumn = 'id') {
  try {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`;
    const result = await executeQuery(query, [...values, id]);
    
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    };
  } catch (error) {
    console.error(`Error en updateRecord para tabla ${table}:`, error);
    throw error;
  }
}

// Eliminar registro genérico
async function deleteRecord(table, id, idColumn = 'id') {
  try {
    const query = `DELETE FROM ${table} WHERE ${idColumn} = ?`;
    const result = await executeQuery(query, [id]);
    
    return {
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error(`Error en deleteRecord para tabla ${table}:`, error);
    throw error;
  }
}

// Contar registros
async function countRecords(table, whereClause = '', params = []) {
  try {
    const query = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const result = await executeQuery(query, params);
    return result[0].total;
  } catch (error) {
    console.error(`Error en countRecords para tabla ${table}:`, error);
    throw error;
  }
}

// Manejo graceful del cierre de la aplicación
process.on('SIGINT', async () => {
  console.log('\n🔄 Recibida señal SIGINT, cerrando pool de conexiones...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Recibida señal SIGTERM, cerrando pool de conexiones...');
  await closePool();
  process.exit(0);
});

module.exports = {
  pool,
  executeQuery,
  executeTransaction,
  getConnection,
  testConnection,
  closePool,
  findById,
  insertRecord,
  updateRecord,
  deleteRecord,
  countRecords
};