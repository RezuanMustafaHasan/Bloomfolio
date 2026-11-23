import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const python = path.join(root, 'services/market-data/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
if (!existsSync(python)) throw new Error('Run npm run setup before npm run dev.');
const jobs = [
  ['api', 'services/api', 'node', ['server.js']],
  ['admin-api', 'services/admin-api', 'node', ['server.js']],
  ['market-data', 'services/market-data', python, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000']],
  ['web', 'apps/web', 'npm', ['run', 'dev']],
  ['admin', 'apps/admin', 'npm', ['run', 'dev']],
];
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try {
      if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch {}
  }
  process.exitCode = code;
}
for (const [name, folder, command, args] of jobs) {
  const child = spawn(command, args, { cwd: path.join(root, folder), env: process.env, detached: process.platform !== 'win32' });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => process.stdout.write(`[${name}] ${data}`));
  child.on('error', error => { console.error(`[${name}] ${error.message}`); stop(1); });
  child.on('exit', code => { if (!stopping) { console.error(`[${name}] exited (${code}); stopping services.`); stop(code || 1); } });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log('User app: http://localhost:5173 | Admin: http://localhost:5174 | API docs: http://localhost:8000/docs');
