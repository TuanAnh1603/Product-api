const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const base = process.env.API_URL || 'http://127.0.0.1:3000';
const pid = `ci-${process.env.GITHUB_RUN_ID || 'local'}-${Date.now()}`;
let created = false;
const request = async (path, options = {}) => fetch(`${base}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });

before(async () => {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { const r = await request('/health'); if (r.ok) { ready = true; break; } } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.equal(ready, true, 'API did not become healthy');
});

after(async () => { if (created) await request(`/api/products/${pid}`, { method: 'DELETE' }); });

test('healthcheck confirms API and MongoDB are ready', async () => {
  const r = await request('/health'); const body = await r.json();
  assert.equal(r.status, 200); assert.equal(body.status, 'UP'); assert.equal(body.database, 'connected');
});

test('CRUD product end-to-end', async () => {
  let r = await request('/api/products', { method: 'POST', body: JSON.stringify({ pid, pname: 'CI Test Product', price: 12500, quantity: 4 }) });
  assert.equal(r.status, 201); let body = await r.json(); assert.equal(body.pid, pid); created = true;
  r = await request('/api/products'); assert.equal(r.status, 200); const list = await r.json(); assert.ok(list.some(p => p.pid === pid));
  r = await request(`/api/products/${pid}`); assert.equal(r.status, 200); body = await r.json(); assert.equal(body.pname, 'CI Test Product');
  r = await request(`/api/products/${pid}`, { method: 'PUT', body: JSON.stringify({ price: 15000, quantity: 7 }) });
  assert.equal(r.status, 200); body = await r.json(); assert.equal(body.price, 15000); assert.equal(body.quantity, 7);
  r = await request(`/api/products/${pid}`, { method: 'DELETE' }); assert.equal(r.status, 200); created = false;
  r = await request(`/api/products/${pid}`); assert.equal(r.status, 404);
});

test('reject invalid product and duplicate pid', async () => {
  let r = await request('/api/products', { method: 'POST', body: JSON.stringify({ pid, pname: 'Bad', price: -1, quantity: 2 }) });
  assert.equal(r.status, 400);
  r = await request('/api/products', { method: 'POST', body: JSON.stringify({ pid, pname: 'Duplicate check', price: 2, quantity: 1 }) });
  assert.equal(r.status, 201); created = true;
  r = await request('/api/products', { method: 'POST', body: JSON.stringify({ pid, pname: 'Duplicate', price: 3, quantity: 1 }) });
  assert.equal(r.status, 409);
});
