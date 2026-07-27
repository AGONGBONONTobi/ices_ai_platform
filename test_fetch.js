const http = require('http');

http.get('http://localhost:3000/fr/tool/diagnostic-de-l-experience-client', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(res.statusCode);
    if(res.statusCode === 500) {
      console.log(data.substring(0, 500));
    }
  });
}).on('error', err => console.log(err));
