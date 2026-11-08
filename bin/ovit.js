#!/usr/bin/env node

/**
 * OVIT - Open-Source Multi-Agent Orchestrator CLI
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 * Usage: ovit [--port 3800] [--no-open]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { startServer } = require('../src/server');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ⚡ OVIT - Open-Source Multi-Agent Orchestrator
  Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)

  Usage:
    ovit [options]

  Options:
    -p, --port <number>    Set custom port (default: 3800, auto-fallback)
    --no-open              Do not automatically open browser on launch
    -v, --version          Show version number
    -h, --help             Show this help message

  Examples:
    ovit                   Launch ovit dashboard & local agent bridge
    ovit --port 4000       Launch on port 4000
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
  console.log(`ovit v${pkg.version}`);
  process.exit(0);
}

let port = 3800;
const portIdx = args.findIndex(a => a === '--port' || a === '-p');
if (portIdx !== -1 && args[portIdx + 1]) {
  port = parseInt(args[portIdx + 1], 10) || 3800;
}

const autoOpen = !args.includes('--no-open');

startServer({ port, autoOpen });
