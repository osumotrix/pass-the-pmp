# Pass The PMP

A PMP exam-prep simulation game set in Lagos. You lead three projects — Kudi (an agile fintech app), Forte Clinic (a predictive construction build) and Land Registry (a hybrid digitisation and change programme) — in walk-around 3D worlds, talk to stakeholders voiced in Nigerian English, discover 51 PMP concepts, and sit practice exams mapped to the PMI Examination Content Outline.

## Layout

- `public/` — the deployable site: `index.html` (single-file game) and `voices/` (331 voice clips).
- `src/` — the game's source modules and `build.py`, which bundles them into one HTML file.

## Build

```bash
cd src
python3 build.py          # reads ../public/voices, writes ../public/index.html
```

## Run locally

Serve `public/` with any static server, for example `npx serve public`. Progress saves to the browser's local storage.

## Deploy

Hosted on Cloudflare Pages: build command none, output directory `public`.

## Credits

3D rendering uses three.js r128 (loaded from cdnjs). Voices recorded with ElevenLabs v4 via Higgsfield.

## Analytics

- **Traffic**: Cloudflare Web Analytics (cookieless) on the Pages project.
- **Gameplay**: `src/track.js` sends anonymous events (random visitor id, event name, project, a number) to the Pages Function `functions/api/e.js`, which writes them to the D1 database `passpmp-metrics` (binding `DB` in `wrangler.toml`). No names or answers are collected. Tracking only runs on the hosted domain (passpmp.wesimai.com); each event records the host it came from. The old address pass-the-pmp.pages.dev redirects there (`functions/_middleware.js`).

## Lagos Life (Vatar Games)

Inside a Vatar world's game player the game loads Vatar's SDK (`src/vatar.js`), takes the player's name from Lagos Life, submits each player's best project score to the leaderboard, pauses sound and the mock-exam clock on pause, and sells one product, `exam_hall_pro` (unlimited mini mocks, 20-question sets, weak-area drills). Outside Vatar nothing changes and everything stays free.

Server side (Pages Functions, `lib/vatar.js`):

- `POST /api/vatar/me` — verifies the session, returns whether the player owns Exam Hall Pro (re-checks refunds).
- `POST /api/vatar/claim` — verifies the session and the purchase with Vatar, checks it belongs to that player, records it once in D1 (`vatar_purchases`) and marks it delivered.
- `POST /api/vatar/webhook` — Vatar's `purchase.paid`, HMAC-checked with `VATAR_WEBHOOK_SECRET`, then re-read from the API before granting.

Environment variables (Cloudflare Pages → Settings → Variables and Secrets, as encrypted secrets): `VATAR_SECRET`, `VATAR_WEBHOOK_SECRET`. Never commit them. Swap in the live values after Vatar approves the game.
