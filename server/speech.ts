export class SpeechError extends Error {
  status: number;
  code: string;
  retryAfter?: string;
  constructor(status: number, code: string, retryAfter?: string) {
    super('Gemini speech generation failed');
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function pcmToWav(pcm: Buffer, sampleRate: number) {
  if (!pcm.length || pcm.length % 2 || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 96000) {
    throw new SpeechError(502, 'INVALID_AUDIO');
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function generateGeminiSpeech(text: string, language: string, env = process.env, fetchImpl = globalThis.fetch) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new SpeechError(503, 'MISSING_API_KEY');
  const model = env.GEMINI_TTS_MODEL?.trim() || 'gemini-2.5-flash-preview-tts';
  const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Read the following text verbatim in a calm, warm ${language === 'en' ? 'English' : 'Bangladeshi Bengali'} voice. Do not add commentary:\n\n${text}` }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: env.GEMINI_TTS_VOICE?.trim() || 'Charon' } } },
      },
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new SpeechError(response.status === 429 ? 429 : 502, body.error?.status || 'SPEECH_UNAVAILABLE', response.headers.get('Retry-After') || undefined);
  }
  const body = await response.json();
  const parts = body.candidates?.[0]?.content?.parts ?? [];
  const audio = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('audio/'))?.inlineData;
  if (!audio?.data) throw new SpeechError(502, 'EMPTY_AUDIO');
  const bytes = Buffer.from(audio.data, 'base64');
  if (audio.mimeType === 'audio/wav' && bytes.toString('ascii', 0, 4) === 'RIFF') return bytes.toString('base64');
  if (!/^audio\/(L16|pcm)(;|$)/i.test(audio.mimeType)) throw new SpeechError(502, 'UNSUPPORTED_AUDIO');
  const sampleRate = Number(/rate=(\d+)/.exec(audio.mimeType)?.[1] || 24000);
  return pcmToWav(bytes, sampleRate).toString('base64');
}
