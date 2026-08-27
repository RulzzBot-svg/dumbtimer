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

This is a Vite app. The fastest path if you already have a Vercel account:

1. Import this GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Vite** (auto-detected)
3. Build command: `npm run build`
4. Output directory: `dist`

Or from a laptop that is logged into Vercel:

```bash
npx vercel --prod
```

`vercel.json` already sets the Vite framework and an SPA rewrite.
