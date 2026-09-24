const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '5000', 10);
const DATA_MODE = (process.env.DATA_MODE || 'real').toLowerCase();
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
  // Reverse proxy API calls to the FastAPI backend
  if ((req.url || '').startsWith('/api/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
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
        error: `Bad Gateway: FastAPI backend unreachable on port ${BACKEND_PORT}`,
        data_mode: DATA_MODE,
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

// Native WebSocket reverse proxy to FastAPI backend
server.on('upgrade', (req, socket, head) => {
  if ((req.url || '').startsWith('/ws/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      let rawHeaders = '';
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            rawHeaders += `${key}: ${v}\r\n`;
          }
        } else {
          rawHeaders += `${key}: ${value}\r\n`;
        }
      }
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n${rawHeaders}\r\n`);
      if (proxyHead && proxyHead.length) {
        socket.write(proxyHead);
      }
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on('error', (err) => {
      socket.destroy();
    });

    proxyReq.end();
  } else {
    socket.destroy();
  }
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

    // Force non-cached delivery so dual-mode testing never gets stale files or cross-port cache bleed
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (ext === '.html') {
      let content = data.toString('utf8');
      const isReal = DATA_MODE === 'real';
      const oppositePort = isReal ? 3001 : 3000;

      // Inject synchronous configuration script before </head>
      const configScript = `
  <script>
    window.__SERVER_DATA_MODE__ = "${DATA_MODE}";
    window.__SERVER_PORT__ = ${PORT};
    window.__BACKEND_PORT__ = ${BACKEND_PORT};
    window.__IS_REAL_MODE__ = ${isReal};
    window.__OPPOSITE_PORT__ = ${oppositePort};
  </script>`;
      content = content.replace('</head>', `${configScript}\n</head>`);

      // Add mode class and data attribute to <body>
      content = content.replace('<body ', `<body data-mode="${DATA_MODE}" `);
      content = content.replace('class="', `class="mode-${DATA_MODE} `);

      // Pre-render the prominent top banner in index.html
      const realBannerHtml = `<div id="instance-mode-banner" class="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono font-bold shrink-0 transition-all border-b z-50 bg-emerald-950 text-emerald-100 border-emerald-600 shadow-md">
      <div class="flex items-center gap-3">
        <span id="banner-mode-pill" class="px-3 py-1 rounded text-[11px] flex items-center gap-2 uppercase font-black tracking-wider shadow-sm bg-emerald-500 text-slate-950">
          <span class="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" id="banner-mode-dot"></span>
          <span id="banner-mode-title">INSTANCE 1 — REAL DATA ACTIVE (PORT 3000)</span>
        </span>
        <span id="banner-mode-desc" class="hidden md:inline font-sans text-xs font-medium text-emerald-200">
          Live Feeds: <strong>Open-Meteo High-Res Radar</strong> • <strong>OpenStreetMap Healthcare (8 Facilities)</strong> • <strong>GDACS Alerts</strong>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span id="banner-db-pill" class="hidden lg:inline-block px-2.5 py-0.5 rounded bg-emerald-900 border border-emerald-700 text-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">DB: backend/aegis_real.db</span>
        <a id="banner-switch-link" href="http://localhost:3001" target="_blank" class="px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500">
          <span id="banner-switch-label">Open Simulated Instance (Port 3001)</span> ↗
        </a>
      </div>
    </div>`;

      const simBannerHtml = `<div id="instance-mode-banner" class="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono font-bold shrink-0 transition-all border-b z-50 bg-purple-950 text-purple-100 border-purple-600 shadow-md">
      <div class="flex items-center gap-3">
        <span id="banner-mode-pill" class="px-3 py-1 rounded text-[11px] flex items-center gap-2 uppercase font-black tracking-wider shadow-sm bg-purple-500 text-white">
          <span class="w-2.5 h-2.5 rounded-full bg-white animate-pulse" id="banner-mode-dot"></span>
          <span id="banner-mode-title">INSTANCE 2 — SIMULATION SANDBOX ACTIVE (PORT 3001)</span>
        </span>
        <span id="banner-mode-desc" class="hidden md:inline font-sans text-xs font-medium text-purple-200">
          Baseline Environment: <strong>4 Synthetic Crises (INC-442, INC-889...)</strong> • <strong>3 Relief Hubs</strong> • <strong>Synthetic Surge</strong>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span id="banner-db-pill" class="hidden lg:inline-block px-2.5 py-0.5 rounded bg-purple-900 border border-purple-700 text-purple-200 text-[10px] font-mono font-bold uppercase tracking-wider">DB: backend/aegis_simulated.db</span>
        <a id="banner-switch-link" href="http://localhost:3000" target="_blank" class="px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow bg-purple-800 hover:bg-purple-700 text-white border border-purple-500">
          <span id="banner-switch-label">Open Live Real Data (Port 3000)</span> ↗
        </a>
      </div>
    </div>`;

      // Replace instance-mode-banner if present
      if (content.includes('id="instance-mode-banner"')) {
        content = content.replace(/<div id="instance-mode-banner"[\s\S]*?<\/div>\s*<\/div>/, isReal ? realBannerHtml : simBannerHtml);
      }

      // Pre-set document title
      if (isReal) {
        content = content.replace(/<title>.*?<\/title>/, '<title>🟢 [LIVE REAL DATA - PORT 3000] AapdaSetu - Emergency Mesh</title>');
      } else {
        content = content.replace(/<title>.*?<\/title>/, '<title>🟣 [SIMULATED DATA - PORT 3001] AapdaSetu - Disaster Simulation</title>');
      }

      res.writeHead(200, headers);
      res.end(content);
      return;
    }

    res.writeHead(200, headers);
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`===================================================================`);
  console.log(`🚀 AAPDASETU [${DATA_MODE.toUpperCase()} DATA MODE]`);
  console.log(`   Frontend: http://localhost:${PORT}/`);
  console.log(`   Backend:  http://127.0.0.1:${BACKEND_PORT}/ (API & WebSocket Proxied)`);
  console.log(`===================================================================`);
});
