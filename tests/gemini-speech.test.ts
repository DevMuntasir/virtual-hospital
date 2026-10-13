import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateGeminiSpeech, SpeechError } from '../server/speech';

test('Gemini TTS uses a dedicated audio model and returns playable PCM WAV', async () => {
  const pcm = Buffer.from([0, 0, 255, 127, 0, 128]);
  const fetchMock: typeof fetch = async (url, init) => {
    assert.match(String(url), /gemini-2.5-flash-preview-tts:generateContent$/);
    assert.equal((init?.headers as Record<string, string>)['x-goog-api-key'], 'test-key');
    const request = JSON.parse(init?.body as string);
    assert.deepEqual(request.generationConfig.responseModalities, ['AUDIO']);
    assert.match(request.contents[0].parts[0].text, /Bangladeshi Bengali/);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [
      { text: 'metadata' }, { inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: pcm.toString('base64') } },
    ] } }] }));
  };
  const wav = Buffer.from(await generateGeminiSpeech('বাংলা', 'bn', { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'text-only-model' }, fetchMock), 'base64');
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 16), 'WAVEfmt ');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(28), 48000);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
});

test('Gemini speech reports missing keys, quota failures and missing audio', async () => {
  const quota: typeof fetch = async () => new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED' } }), { status: 429, headers: { 'Retry-After': '12' } });
  await assert.rejects(generateGeminiSpeech('Hello', 'en', {}, quota), (e: SpeechError) => e.status === 503);
  await assert.rejects(generateGeminiSpeech('Hello', 'en', { GEMINI_API_KEY: 'test' }, quota), (e: SpeechError) => e.status === 429 && e.code === 'RESOURCE_EXHAUSTED' && e.retryAfter === '12');
  await assert.rejects(generateGeminiSpeech('Hello', 'en', { GEMINI_API_KEY: 'test' }, async () => new Response('{}')), (e: SpeechError) => e.code === 'EMPTY_AUDIO');
});
