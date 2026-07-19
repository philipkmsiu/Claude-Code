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
- `POST /api/ai/review-plan` — AI review of selected spots vs chosen days

Use `npm run dev` or `npm run preview` so the proxy is available.

## Day choice

After picking a place, AI reviews the destination and suggests:

- **最少天數**
- **最舒服天數**
- **建議最長**

Or type your own length (2–21 days). On the spots/result steps, AI checks whether your selected spots fit those days.

## Flow

1. Destination  
2. Days + trip conditions (AI day review)  
3. Hotel style  
4. Spot picker (AI fit review)  
5. Generate / regenerate itinerary  

## Develop

```bash
npm install
npm run dev
```
