<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9c765819-ef60-48d3-8222-dc8a911d1481

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env`, then set `AI_PROVIDER` and the selected provider’s API key
3. Run the app:
   `npm run dev`
# virtual-hospital

## Deploy to Vercel

Import this repository into Vercel. The included `vercel.json` configures the Vite frontend and routes `/api/*` to the Express function. Keep the project root as the root directory and use the default `npm install` and `npm run build` commands.

Add `AI_PROVIDER`, the selected provider’s model variable and API key in the Vercel project's Environment Variables for Production and Preview, then redeploy. Add `OPENAI_API_KEY` as well if you want OpenAI voice features. Both keys stay on the server; do not add a `VITE_` prefix. See [.env.example](.env.example) for the local variable names.

OpenAI GPT-Live (`gpt-live-1`) streams the patient's input transcript into editable text before the patient submits it. The Live session is instructed to listen without replying; OpenAI speech (`gpt-4o-mini-tts`) reads the app's AI replies in a warm voice. The spoken voice is AI-generated. Clinical chat, draft prescriptions, and report analysis use the provider selected by `AI_PROVIDER`. Voice features remain independent of that selection. Microphone access requires HTTPS or localhost. If OpenAI voice is unavailable, patients can type their answer and read the reply.

If OpenAI returns a temporary transcription error, supported browsers switch to their built-in speech recognition; otherwise the patient can type. If speech synthesis reaches an OpenAI rate, credit, or spend limit, the UI uses the device voice and shows why. Check the server log for the OpenAI `requestId` and `code` when investigating repeated failures. Restart the local `npm run dev` server after changing `server.ts`; it does not restart automatically.

Tokens and prescriptions currently live in memory. On Vercel, that data can disappear when a function instance restarts and is not shared across instances. Connect a persistent database before relying on those records in production.

## Switch AI providers

Clinical requests use the server-only adapter in `server/ai.ts`. To use Gemini:

```dotenv
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.8-flash
GEMINI_API_KEY=your-gemini-api-key
```

To use OpenAI:

```dotenv
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=your-openai-api-key
```

Keep both keys/model settings in `.env` to switch by changing only `AI_PROVIDER`.
Restart `npm run dev` / `npm start` after changing `.env`; on Vercel, redeploy.
Choose a model supporting JSON output and image input for report uploads.
If `AI_PROVIDER` is omitted, Gemini remains the default. An unsupported provider
value fails at startup. A missing selected key or failed generation returns HTTP 503 with
`AI_UNAVAILABLE`; the UI displays a connection/response error. No scripted clinical
questions, answers, prescriptions or report results are generated as fallbacks. OpenAI-only clinical operation does not need a Gemini key.

OpenAI transcription and speech still use `OPENAI_API_KEY` independently; switching
the clinical provider does not switch voice providers. Without this key, the
existing browser voice/typed-input fallbacks remain available.

The adapters follow the [OpenAI Responses API documentation](https://developers.openai.com/api/docs/guides/text)
and the [Google GenAI API reference](https://ai.google.dev/api/generate-content).
