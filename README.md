# Drift — AI Behavioral Mirror

AI yang membaca pola hidup digital lo dari screenshot HP. Bukan quote generator. Cermin.

## Architecture

3-stage perception pipeline:
1. **PERCEIVE** — forensic extraction per screenshot (observable facts only)
2. **AGGREGATE** — cross-frame pattern detection (min 3 frames)
3. **SYNTHESIZE** — narrative mirror with frame citations

## Current Status: Vertical Slice (Stage 1)

- Upload screenshot
- Stage 1 perception engine (Gemini 2.5 Flash)
- Micro-acknowledgment per frame (specific, cited)
- Client-side session memory (localStorage + IndexedDB)
- Progressive capture UX

## Tech Stack

- Next.js 15 (App Router, standalone output)
- React 19
- Tailwind CSS v4 (CSS-first config)
- Motion (animation)
- Zod (schema validation)
- Gemini 2.5 Flash (vision API, free tier)

## Setup

```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY
pnpm install
pnpm dev
```

## Deploy (Cloud Run)

```bash
docker build -t drift .
docker run -p 3000:3000 -e GEMINI_API_KEY=xxx drift
```
