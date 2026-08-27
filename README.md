# Nightstand

A lightweight GIF alarm clock. Set a time, pick a search term like `cute cats` or `Dark Souls You Died`, and get a full-screen GIF plus a soft chime when it hits.

Alarms live in `localStorage`, so a closed tab or refresh does not wipe the night's schedule.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL. The clock ticks from `Date()`, and a `setInterval` loop compares the current `HH:mm` against saved alarms every 1,000ms.

## GIF sources

The alarm modal fetches from the [Giphy Search API](https://developers.giphy.com/docs/api/endpoint#search) when a key is available:

1. Paste a key in the **Giphy API key** panel on the page, or
2. Set `VITE_GIPHY_API_KEY` in a `.env` file (see `.env.example`).

Giphy keys are free from [developers.giphy.com](https://developers.giphy.com/dashboard/). Without a key, Nightstand still rings and falls back to Wikimedia Commons cat GIFs so the wake-up overlay always has something chill to show.

## Build and deploy

```bash
npm run build
```

Static files land in `dist/`. Deploy that folder to Cloudflare Pages:

```bash
npx wrangler pages deploy dist --project-name=dumb-timer
```

Or connect this GitHub repo to [Cloudflare Pages](https://pages.cloudflare.com/) with:

- Build command: `npm run build`
- Output directory: `dist`
