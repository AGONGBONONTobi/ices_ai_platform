const http = require('http');

http.get('http://localhost:3001/fr/tool/diagnostic-de-l-experience-client', (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    console.log(res.statusCode);
  });
});
