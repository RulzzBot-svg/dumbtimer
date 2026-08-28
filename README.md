# Desk (with Nightstand mode)

Office GIF reminders. Set a time, pick a search like `time to leave work` or `lunch time`, and get a GIF ping when it hits. Switch to **Nightstand** when you actually want the dark, late-night alarm vibe.

Alarms live in `localStorage`, so a refresh does not wipe the day's pings.

A Giphy dashboard key (SDK or API — they are the same key) is already wired via `VITE_GIPHY_API_KEY`. Giphy's JS SDK and the REST Search endpoint both use that dashboard key. You do not need a second "simple API key."

## Phone app

This is a home-screen web app, not an App Store / Play Store download.

1. Wait until the change is on **production** (`main` → [dumbtimer.vercel.app](https://dumbtimer.vercel.app)).
2. Open that URL **on your phone**.
3. Install it:
   - **iPhone:** Safari only (not Chrome). Share → **Add to Home Screen**.
   - **Android:** Chrome menu → **Add to Home screen** / **Install app**.
4. Open it from the icon. Allow notifications when it asks (first time you save a ping).

Pings still need the app **left open**. Closing it, swiping it away, or locking the phone for a long time will stop the timer. Same idea as leaving the desktop tab open. The toast is a reminder, not a lock-screen alarm.

## Accounts and shared templates

Yes — this needs a tiny database. Logins and sharing cannot live only in the browser if you want them on another phone.

There is **no email verification**. Username + password is enough. You can add a profile pic, save a ping as a template, copy a share code, or send that template to someone else’s username. They tap **Use** and it fills the form.

The database is [Neon](https://neon.tech) Postgres. Create a project, copy the **pooled** connection string, and set:

- `DATABASE_URL` — `postgresql://…@….neon.tech/…?sslmode=require`

Paste that into Vercel → Project → Settings → Environment Variables (Production, Preview, and Development). For `npm run dev` on your machine, put the same value in `.env.local` (that file is gitignored).

Tables are created automatically on first login. You can also paste `db/schema.sql` into the Neon SQL editor if you want to create them yourself.

Without `DATABASE_URL`, the site still works; Log in will say the database is missing.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Vercel production tracks **`main`**. Merging a PR only updates the live site if that PR targets `main`. Preview URLs on other branches do not replace [dumbtimer.vercel.app](https://dumbtimer.vercel.app).

Import this GitHub repo at [vercel.com/new](https://vercel.com/new) if it is not already connected.

- Framework: **Vite**
- Build command: `npm run build`
- Output: `dist`

If GIF search looks unrelated or empty, add `VITE_GIPHY_API_KEY` in Vercel → Project → Settings → Environment Variables, then Redeploy. The dashboard SDK key is the same key Search uses.

For accounts, also add `DATABASE_URL` (the Neon pooled connection string).
