# Desk (with Nightstand mode)

Office GIF reminders. Set a time, pick a search like `time to leave work` or `lunch time`, and get a GIF ping when it hits. Switch to **Nightstand** when you actually want the dark, late-night alarm vibe.

Alarms live in `localStorage`, so a refresh does not wipe the day's pings.

A Giphy dashboard key (SDK or API — they are the same key) is already wired via `VITE_GIPHY_API_KEY`. Giphy's JS SDK and the REST Search endpoint both use that dashboard key. You do not need a second "simple API key."

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Import this GitHub repo at [vercel.com/new](https://vercel.com/new) and deploy **Production from `main`**.

- Framework: **Vite**
- Build command: `npm run build`
- Output: `dist`

If GIF search looks unrelated or empty, add `VITE_GIPHY_API_KEY` in Vercel → Project → Settings → Environment Variables, then Redeploy. The dashboard SDK key is the same key Search uses.

`vercel.json` already sets the Vite framework and an SPA rewrite.
