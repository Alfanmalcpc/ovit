const http = require('http');
const { startServer } = require('../src/server');

async function runVerification() {
  console.log('🧪 Starting OVIT Automated Verification Suite...\n');

  // 1. Start server with autoOpen: false
  const { server, port } = await startServer({ port: 3800, autoOpen: false });
  console.log(`✓ Server launched successfully on port ${port}`);

  function fetchUrl(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  try {
    // 2. Test static HTML serving
    const htmlRes = await fetchUrl('/');
    if (htmlRes.status === 200 && htmlRes.data.includes('OVIT')) {
      console.log('✓ GET / (Static HTML): 200 OK');
    } else {
      throw new Error(`Failed GET /: ${htmlRes.status}`);
    }

    // 3. Test static CSS & JS
    const cssRes = await fetchUrl('/css/style.css');
    const jsRes = await fetchUrl('/js/app.js');
    if (cssRes.status === 200 && jsRes.status === 200) {
      console.log('✓ GET /css/style.css and /js/app.js: 200 OK');
    } else {
      throw new Error('Static asset fetch failed');
    }

    // 4. Test vendor files
    const threeRes = await fetchUrl('/vendor/three.min.js');
    if (threeRes.status === 200 && threeRes.data.length > 100000) {
      console.log(`✓ GET /vendor/three.min.js: 200 OK (${threeRes.data.length} bytes, 100% Offline)`);
    } else {
      throw new Error('Vendor three.min.js missing');
    }

    // 5. Test API /api/status
    const statusRes = await fetchUrl('/api/status');
    const statusJson = JSON.parse(statusRes.data);
    if (statusRes.status === 200 && statusJson.status === 'online') {
      console.log(`✓ GET /api/status: 200 OK (Agents registered: ${statusJson.agentsCount})`);
    } else {
      throw new Error('Status API check failed');
    }

    // 6. Test API /api/agents
    const agentsRes = await fetchUrl('/api/agents');
    const agentsJson = JSON.parse(agentsRes.data);
    if (Array.isArray(agentsJson) && agentsJson.length >= 3) {
      console.log(`✓ GET /api/agents: 200 OK (${agentsJson.map(a => a.name).join(', ')})`);
    } else {
      throw new Error('Agents list check failed');
    }

    // 7. Test API /api/execute
    const execRes = await fetchUrl('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test automated integration pipeline', targetAgent: 'all', mode: 'parallel' })
    });
    const execJson = JSON.parse(execRes.data);
    if (execRes.status === 200 && execJson.success) {
      console.log('✓ POST /api/execute: 200 OK (Multi-agent pipeline started)');
    } else {
      throw new Error('Execute API check failed');
    }

    console.log('\n🎉 ALL 7 TESTS PASSED WITH ZERO ERRORS! 100% VERIFIED.');
  } finally {
    server.close();
  }
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
