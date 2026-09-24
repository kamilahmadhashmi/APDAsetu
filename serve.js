const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Reverse proxy API calls to the FastAPI backend running on port 8000
  if ((req.url || '').startsWith('/api/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Gateway: FastAPI backend unreachable on port 8000',
        detail: err.message
      }));
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  let reqUrl;
  try {
    reqUrl = decodeURI((req.url || '').split('?')[0]);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request: Malformed URI');
    return;
  }
  
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  } else if (reqUrl === '/simulation' || reqUrl === '/simulation/') {
    reqUrl = '/simulation/index.html';
  }

  const safeRoot = path.resolve(ROOT) + path.sep;
  const filePath = path.resolve(path.join(ROOT, reqUrl));

  // Security check: prevent directory traversal
  if (!filePath.startsWith(safeRoot) && filePath !== path.resolve(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      // If direct file not found, try appending index.html if it's a folder
      const possibleIndex = path.join(filePath, 'index.html');
      fs.stat(possibleIndex, (err2, stats2) => {
        if (!err2 && stats2.isFile()) {
          serveFile(possibleIndex, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(`404 Not Found: ${reqUrl}`);
        }
      });
      return;
    }

    if (stats.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      serveFile(indexFile, res);
    } else {
      serveFile(filePath, res);
    }
  });
});

function serveFile(absPath, res) {
  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(absPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    res.writeHead(200, headers);
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`🚀 AapdaSetu Server running at http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/simulation/`);
});
