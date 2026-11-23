// Read-only smoke checks against the running local stack.
import assert from 'node:assert/strict';
for (const [name, url] of [
  ['user API', 'http://localhost:8080/api/health'],
  ['admin API', 'http://localhost:8081/api/health'],
  ['market-data API', 'http://localhost:8000/api/health'],
  ['user app', 'http://localhost:5173'],
  ['admin app', 'http://localhost:5174'],
]) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200, `${name} is unhealthy`);
  console.log(`PASS ${name}`);
}
for (const query of ['symbol=CITYBANK&months=0', 'symbol=%3Cscript%3E&months=6']) {
  const response = await fetch(`http://localhost:8000/api/history?${query}`);
  assert.equal(response.status, 422);
}
console.log('PASS market-data query validation');
