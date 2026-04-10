# Backend Agent — CLAUDE.md

## Role
You are the backend agent for the Google Ads Anomaly Detector.
Work ONLY inside `backend/`. Never touch `client/`.

## Stack
- Node.js + TypeScript
- Express 5
- Prisma 7 + PostgreSQL
- Google Gemini API (`@google/generative-ai`)

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry, mounts routes
│   ├── prisma.ts              # PrismaClient singleton
│   ├── routes/
│   │   ├── campaigns.ts       # GET /api/campaigns, POST /api/campaigns/sync
│   │   └── audit.ts           # POST /api/audit, GET /api/audit
│   └── services/
│       ├── googleAds.ts       # Mock data (replace with real API later)
│       └── anomalyDetector.ts # Single Gemini API call, returns AnomalyResult[]
├── prisma/
│   └── schema.prisma          # Campaign + Anomaly models
└── .env                       # DATABASE_URL, GEMINI_API_KEY, PORT
```

## Prisma Models

```prisma
Campaign { id, name, status, cost, clicks, conversions, ctr, cpc, createdAt, updatedAt }
Anomaly  { id, campaignId, description, severity (Low|Medium|High), createdAt }
```

## API Endpoints

| Method | Path                     | Description                              |
|--------|--------------------------|------------------------------------------|
| GET    | /api/campaigns           | Return campaigns from DB (auto-seed)     |
| POST   | /api/campaigns/sync      | Force re-fetch from Google Ads + save    |
| POST   | /api/audit               | Run AI audit, save anomalies, return     |
| GET    | /api/audit               | Return saved anomalies with campaign     |

## AI Rule — Token Optimization

The anomaly detector MUST send ONE request to Gemini with ALL campaigns.
Never call Gemini per-campaign. Never use agent loops.
Model: `gemini-2.0-flash` — fast and cheap.
System prompt is static in `anomalyDetector.ts`.

## Google Ads Integration

Current: mock data in `googleAds.ts → fetchMockCampaigns()`
To add real API: implement OAuth2 flow in `src/routes/oauth.ts`, replace `fetchMockCampaigns` with real call.
Keep the `CampaignData` interface stable — it's used by Prisma save logic.

## Coding Rules

1. All files in TypeScript strict mode
2. Use `async/await`, never callbacks
3. Always return typed responses from routes
4. Wrap all route handlers in try/catch, return `{ error: string }` on failure
5. Use `prisma` singleton from `src/prisma.ts`, never instantiate PrismaClient elsewhere
6. Never expose `.env` values in responses

## Environment Variables

```
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_key_here
PORT=4000
```

## Dev Commands

```bash
npm run dev          # nodemon + ts-node
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:studio    # prisma studio (visual DB)
```
