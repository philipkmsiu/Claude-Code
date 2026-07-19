# KM Travel Planner

Interactive **AI** travel planner by **KM Building Company**, powered by **Crazyrouter** (OpenAI-compatible).

## Branding

- App / product: **KM Travel Planner**
- Company: **KM Building Company**
- Package: `km-travel-planner`
- Logo (source): `public/branding/CompanyLogo_Only.ai`
- Web logo: `public/km-logo.png` (also `km-logo.svg` / favicon)

## AI (Crazyrouter)

Day recommendations and spot/day fit reviews call Crazyrouter through a Vite server proxy so the API key never ships to the browser.

Required env (see `.env.example`):

- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL` (default `gpt-5.4`)

Endpoints:

- `POST /api/ai/recommend-days` — AI day advice when you enter preferences
- `POST /api/ai/suggest-spots` — real named attractions for the destination
- `POST /api/ai/review-plan` — AI review of selected spots vs chosen days

Use `npm run dev` or `npm run preview` so the proxy is available.

## Day choice

After picking a place, AI reviews the destination and suggests:

- **最少天數**
- **最舒服天數**
- **建議最長**

Or type your own length (2–32 days). City breaks (e.g. Xi’an) stay in a sensible range (~4–9 days recommended); only long-haul routes like Xinjiang / Qinggan can stretch toward 2–3 weeks.

Departure date is always **at least tomorrow** from the planning day.

## Visual journey map (Stage 4)

Every journey gets **two** Stage-4 posters:

1. **相片版** — unique real landmark photos per day
2. **插畫海報版** — Gemini journey-map sample style with hand-painted watercolor day plates (`public/poster/watercolor-*.png`)

Both include 必吃美食 · 必喝飲品 · 旅行小貼士, and each can be **downloaded as PNG**.

## Planning handbook (青甘 / 新疆)

Preset long trips include handbook sections from real planning books (budgets, hotels, checklists, photos).

## Flow

Home → Destination → Preferences → Hotel → Spots → Result (table + Stage 4 poster)

## Develop

```bash
npm install
npm run dev
```

Default port: **5174** (`strictPort: true`).
