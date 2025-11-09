const crypto = require('crypto');

const password = 'admin123';
const salt = 'sistema_paints_salt_2024';

// Calcular hash como lo hace tu sistema
const hash1 = crypto.createHash('sha256').update(password + salt).digest('hex');
console.log('🔐 Hash calculado (password + salt):', hash1);

// Probar otras combinaciones
const hash2 = crypto.createHash('sha256').update(salt + password).digest('hex');
console.log('🔐 Hash calculado (salt + password):', hash2);

console.log('\n📋 Hash en BD:', 'eeea7af566eaa1ec19871a5074808e5bd4df3e28644fab20e81ebfc69ca6bb8a');
console.log('📋 Hash que sistema calcula:', 'c3079ed50231747f3904937901f1cd4aa9d9f61f80bf78c3b0ee7d4f53abfbf8');

// Verificar si coincide
if (hash1 === 'eeea7af566eaa1ec19871a5074808e5bd4df3e28644fab20e81ebfc69ca6bb8a') {
    console.log('✅ Coincidencia con método 1');
} else if (hash2 === 'eeea7af566eaa1ec19871a5074808e5bd4df3e28644fab20e81ebfc69ca6bb8a') {
    console.log('✅ Coincidencia con método 2');
} else {
    console.log('❌ Ninguna coincidencia - necesitamos actualizar BD');
}