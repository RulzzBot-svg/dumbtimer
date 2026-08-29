# Desk (with Nightstand mode)

Office GIF reminders. Set a time, pick a search like `time to leave work` or `lunch time`, and get a GIF ping when it hits. Switch to **Nightstand** when you actually want the dark, late-night alarm vibe.

Alarms live in `localStorage`, so a refresh does not wipe the day's pings.

A Giphy dashboard key (SDK or API — they are the same key) is already wired via `VITE_GIPHY_API_KEY`. Giphy's JS SDK and the REST Search endpoint both use that dashboard key. You do not need a second "simple API key."

## Phone app (native)

This is the version that can ping **when Desk is closed**. It wraps the same UI in a tiny Android/iOS app and lets the phone OS own the alarm.

### Android

1. Install [Android Studio](https://developer.android.com/studio).
2. From this repo:

```bash
npm install
npm run cap:sync
npx cap open android
```

3. In Android Studio: Run on a phone or **Build → Build APK(s)**.
4. Install the APK, allow notifications, set a ping. You can swipe Desk away; the OS still fires the toast. Tap it to open the GIF.

`npm run android:apk` builds a debug APK at `android/app/build/outputs/apk/debug/app-debug.apk` if the Android SDK is installed.

### iPhone

Needs a Mac, Xcode, and an Apple developer account (TestFlight / USB install):

```bash
npm run cap:sync
npx cap open ios
```

The website Add-to-Home-Screen version still works, but **it cannot** fire after you leave the page. Use the native app for that.

Desktop Chrome can stay a website. If you want pings after you **close the tab** (Chrome still running), install **Desk pinger** from the Chrome Web Store:

[chromewebstore.google.com/detail/desk-pinger](https://chromewebstore.google.com/detail/desk-pinger/lenaokmamekcbhkkbipjllpcpomaokkg)

The popup is only identity + how many pings you have. Click it and you’re back on the website. There is no login form in the extension. The tray toast is still a still image; if the tab is closed, a small window plays the GIF.

Chrome itself has to stay open. Quit Chrome and nothing fires — that’s what the phone APK is for.

The published extension only syncs on [dumbtimer.vercel.app](https://dumbtimer.vercel.app), not localhost. To work on the extension itself: `extension/` folder → Chrome → **Extensions** → Developer mode → **Load unpacked**. Update the listing from the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Phone app (website shortcut)

1. Open production (`main` → [dumbtimer.vercel.app](https://dumbtimer.vercel.app)) on your phone.
2. **iPhone:** Safari → Share → **Add to Home Screen**.
3. **Android:** Chrome → **Add to Home screen**.

That shortcut looks like an app but still needs to stay open for pings.

## Accounts and shared templates

Yes — this needs a tiny database. Logins and sharing cannot live only in the browser if you want them on another phone.

There is **no email verification**. Username + password is enough. You can add a profile pic, save a ping as a template, put templates in a **group**, copy a share code, or send a template to someone else’s username. Import **one** code and it joins your list. Import a **pack** (a group code, or several codes) and it becomes a new group. They tap **Use** and it fills the form.

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

The native Android/iOS projects are not deployed by Vercel; they ship as an APK / TestFlight build.

- Framework: **Vite**
- Build command: `npm run build`
- Output: `dist`

If GIF search looks unrelated or empty, add `VITE_GIPHY_API_KEY` in Vercel → Project → Settings → Environment Variables, then Redeploy. The dashboard SDK key is the same key Search uses.

For accounts, also add `DATABASE_URL` (the Neon pooled connection string).
