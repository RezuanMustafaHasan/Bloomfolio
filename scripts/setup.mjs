import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw result.error || new Error(`${command} failed (${result.status})`);
}
for (const folder of ['apps/web', 'apps/admin', 'services/api', 'services/admin-api']) {
  const cwd = path.join(root, folder);
  run('npm', ['ci'], cwd);
  const target = path.join(cwd, '.env');
  if (!existsSync(target)) {
    copyFileSync(path.join(cwd, '.env.example'), target);
    writeFileSync(target, readFileSync(target, 'utf8').replace(/replace-with-[^\n]+/g, () => randomBytes(32).toString('hex')));
  }
}
const service = path.join(root, 'services/market-data');
const python = path.join(service, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
if (!existsSync(python)) run(process.env.PYTHON || 'python3', ['-m', 'venv', '.venv'], service);
run(python, ['-m', 'pip', 'install', '-r', 'requirements.txt'], service);
console.log('\nSetup complete. Start MongoDB, then run npm run dev.');
