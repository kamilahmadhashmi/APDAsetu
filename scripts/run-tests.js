#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const venvPyWin = path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe');
const venvPyNix = path.join(ROOT_DIR, '.venv', 'bin', 'python');
const python = fs.existsSync(venvPyWin) ? venvPyWin : (fs.existsSync(venvPyNix) ? venvPyNix : 'python');

console.log('🧪 Running AapdaSetu Dual-Mode Test Suite with pytest...\n');

const res = spawnSync(
  python,
  ['-m', 'pytest', 'backend/test_backend.py', 'backend/test_providers.py', '-v'],
  { cwd: ROOT_DIR, stdio: 'inherit' }
);

process.exit(res.status || 0);
