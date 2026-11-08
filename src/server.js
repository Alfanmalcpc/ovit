const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const url = require('url');
const { exec } = require('child_process');

const orchestrator = require('./orchestrator');
const { getAllAgents, upsertAgent, deleteAgent } = require('./agentRegistry');
const { getLibrary, saveLibrary } = require('./libraryStore');

const PUBLIC_DIR = path.join(__dirname, '../public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Check if a port is open
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(false);
        else resolve(false);
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '127.0.0.1');
  });
}

// Find first available port starting from basePort
async function findAvailablePort(basePort) {
  let port = basePort;
  while (!(await isPortAvailable(port))) {
    port++;
    if (port > basePort + 50) {
      throw new Error(`Tidak menemukan port kosong antara ${basePort} dan ${port}`);
    }
  }
  return port;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  res.end(payload);
}

// SSE Clients pool
const sseClients = new Set();

orchestrator.on('stream', (eventData) => {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
});

function createServerHandler() {
  return async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS Headers
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      return res.end();
    }

    // 1. API: Server-Sent Events (SSE) stream
    if (pathname === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(': connected\n\n');
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // 2. API: Status
    if (pathname === '/api/status' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'online',
        isProcessing: orchestrator.isProcessing,
        currentOperation: orchestrator.currentOperation,
        agentsCount: getAllAgents().length,
        version: '1.0.0'
      });
    }

    // 3. API: Agents CRUD
    if (pathname === '/api/agents' && method === 'GET') {
      return sendJson(res, 200, getAllAgents());
    }

    if (pathname === '/api/agents' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const updated = upsertAgent(body);
        return sendJson(res, 200, { success: true, agents: updated });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }

    if (pathname.startsWith('/api/agents/') && method === 'DELETE') {
      const id = pathname.replace('/api/agents/', '');
      const updated = deleteAgent(id);
      return sendJson(res, 200, { success: true, agents: updated });
    }

    // 4. API: Execute Unified Command
    if (pathname === '/api/execute' && method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!body.prompt || !body.prompt.trim()) {
          return sendJson(res, 400, { error: 'Prompt perintah tidak boleh kosong.' });
        }
        // Run asynchronously
        orchestrator.executeCommand(body);
        return sendJson(res, 200, { success: true, message: 'Operasi dimulai' });
      } catch (e) {
        return sendJson(res, 500, { error: e.message });
      }
    }

    // 5. API: Emergency Stop
    if (pathname === '/api/emergency-stop' && method === 'POST') {
      const result = orchestrator.emergencyStop();
      return sendJson(res, 200, result);
    }

    // 6. API: Library (Templates & History)
    if (pathname === '/api/library' && method === 'GET') {
      return sendJson(res, 200, getLibrary());
    }

    if (pathname === '/api/library' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const lib = getLibrary();
        if (body.template) {
          lib.templates.unshift(body.template);
          saveLibrary(lib);
        }
        return sendJson(res, 200, { success: true, library: lib });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }

    // 7. Static Files Serving
    let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    const filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA routing
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=86400'
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  };
}

async function startServer({ port = 3800, autoOpen = true } = {}) {
  const actualPort = await findAvailablePort(port);
  const server = http.createServer(createServerHandler());

  server.listen(actualPort, '127.0.0.1', () => {
    const localUrl = `http://localhost:${actualPort}`;
    console.log(`
  ╔══════════════════════════════════════════════════════════════════════╗
  ║                                                                      ║
  ║   ⚡  OVIT - OPEN-SOURCE MULTI-AGENT ORCHESTRATOR                    ║
  ║   🚀  Local Engine Ready at: ${localUrl.padEnd(38)}║
  ║                                                                      ║
  ║   • Autor: Mochamad Alfan Candrapratama (@Alfanmalcpc)               ║
  ║   • Stack: Node.js, Three.js 3D Visualizer, SSE Terminal Stream      ║
  ║   • Tekan Ctrl+C untuk menghentikan server                           ║
  ║                                                                      ║
  ╚══════════════════════════════════════════════════════════════════════╝
`);

    if (autoOpen) {
      openBrowser(localUrl);
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[OVIT] Menghentikan server & membersihkan process agen...');
    orchestrator.emergencyStop();
    server.close(() => {
      console.log('[OVIT] Server ditutup dengan aman. Sampai jumpa!');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, port: actualPort };
}

function openBrowser(targetUrl) {
  const platform = process.platform;
  let cmd = '';
  if (platform === 'win32') {
    cmd = `start "" "${targetUrl}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${targetUrl}"`;
  } else {
    cmd = `xdg-open "${targetUrl}"`;
  }
  exec(cmd, (err) => {
    if (err) {
      // Ignored if browser can't be launched automatically
    }
  });
}

module.exports = {
  startServer,
  findAvailablePort,
  createServerHandler
};
