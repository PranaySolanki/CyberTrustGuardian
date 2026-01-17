const fs = require('fs');
const key = Buffer.from('AIzaSyA4CwrlvwC4QEXQYsLZNqPsH1J4Wtf-ZDM').toString('base64');
fs.writeFileSync('key.txt', key);
