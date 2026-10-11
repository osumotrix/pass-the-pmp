# Pass The PMP

A PMP exam-prep simulation game set in Lagos. You lead two projects — Kudi (an agile fintech app) and Forte Clinic (a predictive construction build) — in walk-around 3D worlds, talk to stakeholders voiced in Nigerian English, discover 42 PMP concepts, and sit practice exams mapped to the PMI Examination Content Outline.

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
