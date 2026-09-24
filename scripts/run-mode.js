#!/usr/bin/env node
/**
 * ============================================================================
 * AAPDASETU / AEGIS-MESH DUAL-MODE ORCHESTRATOR LAUNCHER
 * ============================================================================
 * Launches Real Data Mode, Simulated Data Mode, or Both concurrently.
 * 
 * Usage:
 *   node scripts/run-mode.js real
 *   node scripts/run-mode.js simulated
 *   node scripts/run-mode.js both
 * ============================================================================
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// Locate Python executable (.venv or system)
function findPython() {
  const venvPyWin = path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe');
  const venvPyNix = path.join(ROOT_DIR, '.venv', 'bin', 'python');
  if (fs.existsSync(venvPyWin)) return venvPyWin;
  if (fs.existsSync(venvPyNix)) return venvPyNix;
  return 'python';
}

const PYTHON = findPython();
const activeChildren = [];

function killProcesses() {
  console.log('\n🛑 Shutting down AapdaSetu instances gracefully...');
  for (const child of activeChildren) {
    if (!child.killed && child.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${child.pid} /T /F 2>nul`);
        } else {
          process.kill(-child.pid, 'SIGTERM');
        }
      } catch (e) {
        try { child.kill('SIGTERM'); } catch (_) {}
      }
    }
  }
  process.exit(0);
}

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);
process.on('exit', () => {
  for (const child of activeChildren) {
    try { child.kill('SIGTERM'); } catch (_) {}
  }
});

function launchInstance(mode) {
  const isReal = mode === 'real';
  const prefix = isReal ? '\x1b[32m[REAL]\x1b[0m' : '\x1b[35m[SIM]\x1b[0m';
  const port = isReal ? 3000 : 3001;
  const backendPort = isReal ? 5000 : 5001;
  const dbUrl = isReal ? 'sqlite:///backend/aegis_real.db' : 'sqlite:///backend/aegis_simulated.db';

  const env = {
    ...process.env,
    DATA_MODE: isReal ? 'real' : 'simulated',
    PORT: String(port),
    BACKEND_PORT: String(backendPort),
    DATABASE_URL: dbUrl,
    PYTHONPATH: BACKEND_DIR
  };

  console.log(`${prefix} Starting Backend on http://127.0.0.1:${backendPort}...`);
  // Launch FastAPI backend
  const backend = spawn(
    PYTHON,
    ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(backendPort)],
    { cwd: BACKEND_DIR, env, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  backend.stdout.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const l of lines) {
      console.log(`${prefix} [API:${backendPort}] ${l}`);
    }
  });

  backend.stderr.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const l of lines) {
      console.error(`${prefix} [API:${backendPort}] ${l}`);
    }
  });

  activeChildren.push(backend);

  console.log(`${prefix} Starting Frontend Proxy on http://localhost:${port}...`);
  // Launch Node serve.js
  const frontend = spawn(
    'node',
    ['serve.js'],
    { cwd: ROOT_DIR, env, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  frontend.stdout.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const l of lines) {
      console.log(`${prefix} [UI:${port}] ${l}`);
    }
  });

  frontend.stderr.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const l of lines) {
      console.error(`${prefix} [UI:${port}] ${l}`);
    }
  });

  activeChildren.push(frontend);
}

// Main execution
const modeArg = (process.argv[2] || 'both').toLowerCase();

console.log('================================================================================');
console.log('       AAPDASETU / AEGIS-MESH DUAL-MODE DISPATCH ORCHESTRATOR                  ');
console.log('================================================================================');

if (modeArg === 'real') {
  console.log('Starting INSTANCE 1 (REAL DATA MODE) on:');
  console.log('  Frontend: http://localhost:3000');
  console.log('  Backend:  http://127.0.0.1:5000');
  launchInstance('real');
} else if (modeArg === 'simulated') {
  console.log('Starting INSTANCE 2 (SIMULATED DATA MODE) on:');
  console.log('  Frontend: http://localhost:3001');
  console.log('  Backend:  http://127.0.0.1:5001');
  launchInstance('simulated');
} else {
  console.log('Starting BOTH INSTANCES CONCURRENTLY:');
  console.log('  [1] REAL DATA:      http://localhost:3000 (Backend: 5000)');
  console.log('  [2] SIMULATED DATA: http://localhost:3001 (Backend: 5001)');
  launchInstance('real');
  launchInstance('simulated');
}

console.log('================================================================================');
console.log('Press Ctrl+C to terminate all running instances.');
console.log('================================================================================\n');
