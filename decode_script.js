const fs = require('fs');
const key = Buffer.from('QUl6YVN5QTRDd3JsdndDNFFFWFFZc0xaTnFQc0gxSjRXdGYtWkRN', 'base64').toString();
fs.writeFileSync('temp_key.txt', key);
