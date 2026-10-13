import { GoogleGenAI } from '@google/genai';

export type AIMessage = {
  role: 'user' | 'assistant';
  text: string;
  image?: string;
};

export type AIRequest = {
  instructions: string;
  messages: AIMessage[];
  temperature?: number;
};

export interface AIAdapter {
  provider: 'gemini' | 'openai';
  model: string;
  configured: boolean;
  generateJson(request: AIRequest): Promise<Record<string, any>>;
}

function parseObject(text: string) {
  const value = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length) {
    throw new Error('AI returned an empty or invalid JSON object');
  }
  return value as Record<string, any>;
}

function parseImage(image: string) {
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(image);
  if (image.startsWith('data:') && !match) throw new Error('Invalid image data URL');
  return { mimeType: match?.[1] || 'image/jpeg', data: match?.[2] || image };
}

/** Server-only provider factory. Only the selected provider needs a key. */
export function createAIAdapter(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = globalThis.fetch,
): AIAdapter {
  const provider = env.AI_PROVIDER?.trim().toLowerCase() || 'gemini';
  if (provider !== 'gemini' && provider !== 'openai') {
    throw new Error('AI_PROVIDER must be gemini or openai');
  }
  const apiKey = (provider === 'gemini' ? env.GEMINI_API_KEY : env.OPENAI_API_KEY)?.trim() || '';
  const model = (provider === 'gemini' ? env.GEMINI_MODEL : env.OPENAI_MODEL)?.trim()
    || (provider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4.1-mini');
  // Do not construct a Gemini client in OpenAI-only installations or without a key.
  const gemini = provider === 'gemini' && apiKey
    ? new GoogleGenAI({ apiKey, httpOptions: { timeout: 60_000 } })
    : undefined;

  return {
    provider,
    model,
    configured: Boolean(apiKey),
    async generateJson({ instructions, messages, temperature }) {
      if (!apiKey) throw new Error(`${provider.toUpperCase()}_API_KEY is not configured`);
      if (gemini) {
        const response = await gemini.models.generateContent({
          model,
          contents: messages.map(message => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [
              { text: message.text },
              ...(message.image ? [{ inlineData: parseImage(message.image) }] : []),
            ],
          })),
          config: {
            systemInstruction: instructions,
            responseMimeType: 'application/json',
            ...(temperature === undefined ? {} : { temperature }),
          },
        });
        return parseObject(response.text || '');
      }

      const response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          model,
          store: false,
          instructions: `${instructions}\nReturn a JSON object.`,
          input: messages.map(message => {
            if (message.role === 'assistant') return { role: 'assistant', content: message.text };
            const image = message.image ? parseImage(message.image) : undefined;
            return {
              role: 'user',
              content: [
                { type: 'input_text', text: message.text },
                ...(image ? [{
                  type: 'input_image',
                  image_url: `data:${image.mimeType};base64,${image.data}`,
                  detail: 'auto',
                }] : []),
              ],
            };
          }),
          text: { format: { type: 'json_object' } },
          // Leave temperature at the provider default: some reasoning models reject it.
        }),
      });
      if (!response.ok) {
        // Do not log upstream bodies, which may contain patient data or credentials.
        throw new Error(`OpenAI request failed (${response.status}); request ID: ${response.headers.get('x-request-id') || 'unknown'}`);
      }
      const result = await response.json();
      if (result.status !== 'completed') throw new Error('OpenAI response did not complete');
      const text = (result.output || [])
        .filter((item: any) => item.type === 'message')
        .flatMap((item: any) => item.content || [])
        .filter((part: any) => part.type === 'output_text')
        .map((part: any) => part.text)
        .join('');
      return parseObject(text);
    },
  };
}
