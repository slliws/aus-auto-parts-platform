const crypto = require('crypto');

const secret1 = crypto.randomBytes(32).toString('hex');
const secret2 = crypto.randomBytes(32).toString('hex');

console.log(secret1);
console.log(secret2);