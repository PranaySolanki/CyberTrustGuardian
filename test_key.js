const https = require('https');

const apiKey = 'AIzaSyA4CwrlvwC4QEXQYsLZNqPsH1J4Wtf-ZDM';
const url = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`;

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('StatusCode:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(JSON.stringify({}));
req.end();
