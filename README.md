# KM Travel Planner

Interactive **AI** travel planner powered by **Crazyrouter** (OpenAI-compatible).

## Branding

App name: **KM Travel Planner**  
Logo: `public/km-logo.svg`

## AI (Crazyrouter)

Day recommendations and spot/day fit reviews call Crazyrouter through a Vite server proxy so the API key never ships to the browser.

Required env (see `.env.example`):

- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL` (default `gpt-4o`)

Endpoints:

- `POST /api/ai/recommend-days` — AI day advice when you enter preferences
- `POST /api/ai/suggest-spots` — real named attractions for the destination (not category templates)
- `POST /api/ai/review-plan` — AI review of selected spots vs chosen days

Use `npm run dev` or `npm run preview` so the proxy is available.

## Day choice

After picking a place, AI reviews the destination and suggests:

- **最少天數**
- **最舒服天數**
- **建議最長**

Or type your own length (2–32 days). On the spots/result steps, AI checks whether your selected spots fit those days. City breaks (e.g. Xi’an) stay in a sensible range (~4–9 days recommended); only long-haul routes like Xinjiang / Qinggan can stretch toward 2–3 weeks.

## Best / worst months

Each destination shows **最適合** and **最不建議** months with reasons (not “fine all year”). Custom places get AI season guidance via `/api/ai/season-guide`. Your start-date month is checked against that guide.

## Daily plan table

Result view includes a planning-book style table:

| 日次 | 日期 | 住宿地 | 主要安排 | 節奏／車程 | 住宿方向 | 天氣／降雨 |

Weather uses Open-Meteo (live forecast when near-term; otherwise same-date climate from last year).

## Transport modes

On preferences, choose **包司機 / 自駕 / 大眾運輸**:

- **包司機** — easiest; daily plan focuses on pickup order, not transfers
- **自駕** — driving segments, parking reminders, road-buffer notes
- **大眾運輸** — each day lists how to get between places (walk / metro / transfer feel, time, pass tips)

## Visual journey map (Stage 4)

Every journey gets **two** Stage-4 posters (toggle on the result page):

1. **相片版** — unique real landmark photos per day (no reused wall shots)
2. **插畫海報版** — Gemini-style watercolor scrapbook (painted scene bases + hand-ink landmark silhouettes; never photographs)

Both include 必吃美食 · 必喝飲品 · 旅行小貼士, and each can be **downloaded as PNG**.

Landmark photos for the photo edition resolve via `/api/place-photo` (Wikimedia Commons, proxied). Illustration edition uses assets under `public/poster/`. Use `npm run dev` or `npm run preview` so the proxy is available.

## Planning handbook (青甘 / 新疆)

Preset long trips include handbook sections from real planning books:

- Budget lines with **total + per person** (hotel, driver, flights/car, meals, tickets, misc)
- **酒店建議與價格**, photo/video stops for planner
- **包車與 planner 要求**, Taobao search terms, quote-comparison checklist
- **暫不列入主線**, booking checklist, remarks, itinerary summary
- Qinggan also ships destination reference photos under `public/handbook/`

## Flow

1. Destination  
2. Days + trip conditions + transport mode (AI day review)  
3. Hotel style  
4. Spot picker (AI real spots + fit review)  
5. Generate / regenerate itinerary + daily routes + journey map  

## Develop

```bash
npm install
npm run dev
```
