const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require(`../${process.env.DEMO_VARIANT || 'after'}/api.cjs`);
async function withApi(run) {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run((path, options) => fetch(base + path, options)); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
const json = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
test('validation: valid request computes price on the server', () => withApi(async request => {
  const response = await request('/api/quotes', json({ sku: 'starter', quantity: 2 }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { sku: 'starter', quantity: 2, totalCents: 3800 });
}));
test('validation: invalid quantities and payload shapes receive 400', () => withApi(async request => {
  for (const quantity of [-1, 0, 101, 1.5, '2', null]) {
    assert.equal((await request('/api/quotes', json({ sku: 'starter', quantity }))).status, 400, `quantity=${quantity}`);
  }
  for (const body of [null, [], {}, { sku: 'starter', quantity: 1, totalCents: 1 }])
    assert.equal((await request('/api/quotes', json(body))).status, 400);
}));
test('validation: unknown sku, malformed JSON and oversized payload stay controlled', () => withApi(async request => {
  assert.equal((await request('/api/quotes', json({ sku: '__proto__', quantity: 1 }))).status, 404);
  assert.equal((await request('/api/quotes', { ...json({}), body: '{"sku":' })).status, 400);
  assert.equal((await request('/api/quotes', json({ sku: 'a'.repeat(20000), quantity: 1 }))).status, 413);
}));
test('tenant: missing identity is rejected; own read and update work', () => withApi(async request => {
  assert.equal((await request('/api/projects/p1')).status, 401);
  assert.equal((await request('/api/projects/p1', { headers: { 'x-demo-user': 'alice' } })).status, 200);
  const response = await request('/api/projects/p1', { ...json({ title: 'Renamed' }), method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-demo-user': 'alice' } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).title, 'Renamed');
}));
test('tenant: another user cannot read or modify the project', () => withApi(async request => {
  const headers = { 'x-demo-user': 'bob', 'content-type': 'application/json' };
  assert.equal((await request('/api/projects/p1', { headers })).status, 404);
  assert.equal((await request('/api/projects/p1', { headers, method: 'PATCH', body: '{"title":"Stolen"}' })).status, 404);
  const ownerRead = await request('/api/projects/p1', { headers: { 'x-demo-user': 'alice' } });
  assert.equal((await ownerRead.json()).title, 'Alpha');
}));
test('tenant: lists include only own projects and unknown ids return 404', () => withApi(async request => {
  const headers = { 'x-demo-user': 'bob' };
  assert.deepEqual((await (await request('/api/projects', { headers })).json()).map(p => p.id), ['p2']);
  assert.equal((await request('/api/projects/missing', { headers })).status, 404);
}));
