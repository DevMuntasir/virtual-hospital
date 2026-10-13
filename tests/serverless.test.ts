import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// tsx resolves extensionless imports that fail in the deployed JavaScript.
// Run the emitted API in plain Node to exercise the serverless startup path.
test('native ESM serverless entrypoint starts and issues tokens without an AI key', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const directory = await mkdtemp(path.join(root, '.serverless-test-'));
  try {
    await mkdir(path.join(directory, 'api'));
    await mkdir(path.join(directory, 'server'));
    await writeFile(path.join(directory, 'package.json'), '{"type":"module"}');
    for (const file of ['api/index.ts', 'server.ts', 'server/ai.ts']) {
      const source = await readFile(path.join(root, file), 'utf8');
      await writeFile(path.join(directory, file.replace(/\.ts$/, '.js')), stripTypeScriptTypes(source));
    }
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import app from './api/index.js';
      const server = app.listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      const base = 'http://127.0.0.1:' + server.address().port;
      try {
        const response = await fetch(base + '/api/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient: { name: 'Test Patient', age: 30, phone: '01700000000' }, paymentMethod: 'bKash' }),
        });
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), /application\\/json/);
        const token = await response.json();
        assert.match(token.tokenNumber, /^EMG-/);
        assert.equal(token.patient.name, 'Test Patient');
        assert.equal(token.status, 'IN_TRIAGE');
        const list = await fetch(base + '/api/tokens');
        assert.equal(list.status, 200);
        assert.ok((await list.json()).some(item => item.id === token.id));
      } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    `], {
      cwd: directory,
      env: { ...process.env, NODE_OPTIONS: '', VERCEL: '1', NODE_ENV: 'production', AI_PROVIDER: 'openai', OPENAI_API_KEY: '', GEMINI_API_KEY: '' },
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
