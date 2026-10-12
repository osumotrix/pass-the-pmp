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
- **Gameplay**: `src/track.js` sends anonymous events (random visitor id, event name, project, a number) to the Pages Function `functions/api/e.js`, which writes them to the D1 database `passpmp-metrics` (binding `DB` in `wrangler.toml`). No names or answers are collected. Tracking only runs on the hosted domain.
