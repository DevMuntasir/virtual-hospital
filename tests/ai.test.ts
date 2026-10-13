import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { createAIAdapter } from '../server/ai';

const request = {
  instructions: 'Return JSON.',
  messages: [
    { role: 'user' as const, text: 'First symptom' },
    { role: 'assistant' as const, text: 'How long?' },
    { role: 'user' as const, text: 'Two days', image: 'data:image/png;base64,YWJj' },
  ],
};

function openaiResponse(text = '{"reply":"Hello"}', status = 'completed') {
  return Response.json({ status, output: [
    { type: 'reasoning' },
    { type: 'message', content: [{ type: 'output_text', text }] },
  ] });
}

test('configuration defaults, normalization, overrides and missing selected key', async () => {
  assert.equal(createAIAdapter({}).provider, 'gemini');
  assert.equal(createAIAdapter({}).configured, false);
  assert.throws(() => createAIAdapter({ AI_PROVIDER: 'typo' }), /AI_PROVIDER/);
  const adapter = createAIAdapter({ AI_PROVIDER: ' OpenAI ', OPENAI_MODEL: 'custom-model', GEMINI_API_KEY: 'unused' });
  assert.equal(adapter.model, 'custom-model');
  assert.equal(adapter.configured, false);
  await assert.rejects(adapter.generateJson(request), /OPENAI_API_KEY/);
});

test('OpenAI preserves history, images and instructions without a Gemini key', async () => {
  const fetchMock = mock.fn(async (url: any, options: any) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'test-model');
    assert.equal(body.store, false);
    assert.match(body.instructions, /Return JSON/);
    assert.deepEqual(body.input.map((m: any) => m.role), ['user', 'assistant', 'user']);
    assert.equal(body.input[1].content, 'How long?');
    assert.equal(body.input[2].content[1].image_url, request.messages[2].image);
    assert.equal(body.text.format.type, 'json_object');
    assert.equal('temperature' in body, false);
    return openaiResponse();
  });
  const adapter = createAIAdapter({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model' }, fetchMock);
  assert.deepEqual(await adapter.generateJson(request), { reply: 'Hello' });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('Gemini maps assistant history, MIME type, JSON mode and model', async () => {
  const stub = mock.method(globalThis, 'fetch', async (url: any, options: any) => {
    assert.match(String(url), /custom-gemini:generateContent/);
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.equal(body.generationConfig.temperature, 0.2);
    assert.equal(body.systemInstruction.parts[0].text, request.instructions);
    assert.deepEqual(body.contents.map((m: any) => m.role), ['user', 'model', 'user']);
    assert.deepEqual(body.contents[2].parts[1].inlineData, { mimeType: 'image/png', data: 'YWJj' });
    return Response.json({ candidates: [{ content: { role: 'model', parts: [{ text: '{"reply":"Gemini"}' }] }, finishReason: 'STOP' }] });
  });
  try {
    const adapter = createAIAdapter({ GEMINI_API_KEY: 'test', GEMINI_MODEL: 'custom-gemini' });
    assert.deepEqual(await adapter.generateJson({ ...request, temperature: 0.2 }), { reply: 'Gemini' });
  } finally { stub.mock.restore(); }
});

test('upstream errors, refusals, incomplete and invalid JSON responses reject', async () => {
  for (const response of [
    new Response('private upstream body', { status: 429 }),
    openaiResponse('{}', 'incomplete'),
    openaiResponse('not json'),
    openaiResponse('{}'),
    openaiResponse('[]'),
    openaiResponse('null'),
    Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] }),
  ]) {
    const adapter = createAIAdapter({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test' }, async () => response);
    await assert.rejects(adapter.generateJson(request));
  }
});

test('raw base64 uses JPEG for backwards compatibility', async () => {
  const adapter = createAIAdapter({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test' }, async (_url, options) => {
    const body = JSON.parse(options!.body as string);
    assert.equal(body.input[0].content[1].image_url, 'data:image/jpeg;base64,YWJj');
    return openaiResponse();
  });
  await adapter.generateJson({ instructions: 'JSON', messages: [{ role: 'user', text: 'Report', image: 'YWJj' }] });
});
