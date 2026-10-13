import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { HospitalAPI, ClinicalRequestError } from '../src/services/api';

process.env.VERCEL = '1';
process.env.AI_PROVIDER = 'gemini';
process.env.GEMINI_API_KEY = 'test-key';
const { default: app } = await import('../server');

test('chat quota errors reach the UI as quota errors instead of generic 503 errors', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' } }), { status: 429 });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const response = await realFetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/triage/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'bn', conversation: [{ sender: 'patient', text: 'Test' }], patientInfo: { name: 'Test' } }),
    });
    assert.equal(response.status, 429);
    const body = await response.json();
    assert.equal(body.code, 'AI_RATE_LIMITED');
    assert.match(body.error, /কোটা/);
    globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 429 });
    await assert.rejects(HospitalAPI.sendTriageMessage([], { name: 'Test', age: 30, phone: '01700000000' }, 'bn'), (error: Error) => error instanceof ClinicalRequestError && /কোটা/.test(error.message));
  } finally {
    globalThis.fetch = realFetch;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
