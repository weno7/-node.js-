const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/code') {
    let body = '';

    // body 데이터를 chunk 단위로 수집(조각조각 전달될 수 있으니깐)
    req.on('data', chunk => {
      body += chunk;
    });

    // body 수집 완료 → 파일 저장 → 실행
    req.on('end', () => {
      const { code } = JSON.parse(body);

      // code 필드가 없으면 에러 응답을 반환
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No code provided' }));
        return;
      }

      // fs 모듈로 temp.py 저장
      fs.writeFile('temp.py', code, (writeErr) => {
        if (writeErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write file' }));
          return;
        }

        // child_process로 파이썬 실행
        exec('python temp.py', (error, stdout, stderr) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            stdout,
            stderr,
            error: error ? error.message : null,
          }));
        });
      });
    });

  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => {
  console.log('서버 실행 중');
});
