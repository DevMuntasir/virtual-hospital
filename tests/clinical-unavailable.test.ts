import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';

// No real provider traffic or local API keys; exercise the missing-key HTTP path.
process.env.VERCEL = '1';
process.env.AI_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = '';
const { default: app } = await import('../server');

test('missing AI key returns errors without answers or new prescriptions/tokens', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const get = async (path: string) => (await fetch(base + path)).json();
  try {
    const prescriptions = await get('/api/prescriptions');
    const tokens = await get('/api/tokens');
    for (const route of ['chat', 'finalize', 'analyze-report']) {
      const response = await fetch(`${base}/api/triage/${route}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en', conversation: [{ sender: 'patient', text: 'Test' }], patientInfo: { name: 'Test' }, reportText: 'Test report' }),
      });
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.code, 'AI_UNAVAILABLE');
      assert.match(body.error, /AI model is unavailable/);
      assert.deepEqual(Object.keys(body).sort(), ['code', 'error']);
    }
    assert.deepEqual(await get('/api/prescriptions'), prescriptions);
    assert.deepEqual(await get('/api/tokens'), tokens);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
