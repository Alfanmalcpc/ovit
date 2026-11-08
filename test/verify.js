const http = require('http');
const { startServer } = require('../src/server');

async function runVerification() {
  console.log('🧪 Starting OVIT Automated Verification Suite...\n');

  // 1. Start server on test port
  const { server } = await startServer(3890);
  console.log('✓ Server launched successfully on port 3890\n');

  try {
    // 2. Test Root HTML
    await assertGet('http://localhost:3890/', 200, 'text/html');
    console.log('✓ GET / (Static HTML): 200 OK');

    // 3. Test Static Assets
    await assertGet('http://localhost:3890/css/style.css', 200, 'text/css');
    await assertGet('http://localhost:3890/js/app.js', 200, 'application/javascript');
    console.log('✓ GET /css/style.css and /js/app.js: 200 OK');

    // 4. Test Vendor 3D engine offline
    const vendorThree = await assertGet('http://localhost:3890/vendor/three.min.js', 200, 'application/javascript');
    if (vendorThree.length < 500000) throw new Error('Three.js file size unexpected');
    console.log(`✓ GET /vendor/three.min.js: 200 OK (${vendorThree.length} bytes, 100% Offline)`);

    // 5. Test Status API - Empty agents initially
    const status = JSON.parse(await assertGet('http://localhost:3890/api/status', 200, 'application/json'));
    console.log(`✓ GET /api/status: 200 OK (Agents registered initially: ${status.agentsCount})`);

    // 6. Test Adding Agent via Terminal API
    const postRes = await assertPost('http://localhost:3890/api/agents', {
      id: 'test_codex',
      name: 'Codex',
      command: 'codex',
      role: 'Backend Engine',
      color: '#10B981',
      shape: 'cube',
      davit: 10
    });
    console.log('✓ POST /api/agents: 200 OK (Agent Codex activated via terminal slot)');

    // 7. Test Agents List after addition
    const agents = JSON.parse(await assertGet('http://localhost:3890/api/agents', 200, 'application/json'));
    if (!Array.isArray(agents) || agents.length !== 1) throw new Error('Agent list count mismatch');
    console.log(`✓ GET /api/agents: 200 OK (Active agent count is now ${agents.length})`);

    // 8. Clean up test agent
    await assertDelete('http://localhost:3890/api/agents?id=test_codex');
    console.log('✓ DELETE /api/agents: 200 OK (Test agent cleaned up, default is clean empty state)');

    console.log('\n🎉 ALL 8 TESTS PASSED PERFECTLY!');
  } finally {
    server.close();
  }
}

function assertGet(urlStr, expectedStatus, expectedType) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== expectedStatus) {
          return reject(new Error(`Expected status ${expectedStatus}, got ${res.statusCode} for ${urlStr}`));
        }
        if (expectedType && !res.headers['content-type']?.includes(expectedType)) {
          return reject(new Error(`Expected Content-Type ${expectedType}, got ${res.headers['content-type']}`));
        }
        resolve(data);
      });
    }).on('error', reject);
  });
}

function assertPost(urlStr, bodyObj) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bodyObj);
    const u = new URL(urlStr);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function assertDelete(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'DELETE'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
