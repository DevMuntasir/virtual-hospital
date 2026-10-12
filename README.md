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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# virtual-hospital

## Deploy to Vercel

Import this repository into Vercel. The included `vercel.json` configures the Vite frontend and routes `/api/*` to the Express function. Keep the project root as the root directory and use the default `npm install` and `npm run build` commands.

Add `GEMINI_API_KEY` in the Vercel project's Environment Variables for Production and Preview, then redeploy. The key is used only by the server; do not add a `VITE_` prefix. See [.env.example](.env.example) for the local variable name.

Tokens and prescriptions currently live in memory. On Vercel, that data can disappear when a function instance restarts and is not shared across instances. Connect a persistent database before relying on those records in production.
