const crypto = require('crypto');

// Datos actuales de la BD
const password = 'admin123';
const salt = 'salt123';
const hashBD = '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090';

// Función igual que en el código
function generateHash(password, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
}

const calculatedHash = generateHash(password, salt);

console.log('Password:', password);
console.log('Salt:', salt);
console.log('Hash en BD:  ', hashBD);
console.log('Hash calculado:', calculatedHash);
console.log('¿Coinciden?', calculatedHash === hashBD ? 'SÍ' : 'NO');

// Generar hash correcto
console.log('\nSQL para corregir:');
console.log(`UPDATE usuarios SET password_hash = '${calculatedHash}' WHERE username = 'admin';`);