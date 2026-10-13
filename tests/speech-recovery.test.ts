import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HospitalAPI } from '../src/services/api';

test('voice retries after account credits are restored without reloading the page', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return calls === 1
      ? new Response(JSON.stringify({ code: 'credit_balance_exhausted' }), { status: 429 })
      : new Response(JSON.stringify({ audioBase64: 'dGVzdA==' }), { status: 200 });
  };
  try {
    assert.deepEqual(await HospitalAPI.getTTSAudio('Hello', 'en'), { audioBase64: null, issue: 'account' });
    assert.deepEqual(await HospitalAPI.getTTSAudio('Hello', 'en'), { audioBase64: 'dGVzdA==' });
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
