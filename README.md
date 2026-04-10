# Google Ads Anomaly Detector

AI-powered anomaly detection for Google Ads campaigns using Google Gemini + Shopify Polaris UI.

## Quick Start

### 1. Backend

```bash
cd backend
npm install
```

Edit `.env` — встав свій `GEMINI_API_KEY` і правильний `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/adsdb"
GEMINI_API_KEY="AIza..."
PORT=4000
```

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # create tables (назви міграцію: init)
npm run dev           # start server → http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev           # → http://localhost:5173
```

---

## How It Works

1. **Campaigns load** — on first visit, backend fetches mock Google Ads data and saves to DB
2. **Run Audit** — sends all campaigns to Gemini in a single API call
3. **AI returns** structured JSON with anomalies and severity (Low / Medium / High)
4. **Anomalies display** — High severity cards highlighted red in the UI

## API Endpoints

```
GET  /api/campaigns        → list campaigns (auto-seeds from Google Ads on first call)
POST /api/campaigns/sync   → force re-sync from Google Ads
POST /api/audit            → run AI anomaly detection, save results
GET  /api/audit            → return saved anomaly results
GET  /health               → { status: "ok" }
```

## Project Structure

```
alitastz/
├── CLAUDE.md                      ← root agent context
├── backend/
│   ├── CLAUDE.md                  ← backend agent rules
│   ├── src/
│   │   ├── server.ts
│   │   ├── prisma.ts
│   │   ├── routes/
│   │   │   ├── campaigns.ts
│   │   │   └── audit.ts
│   │   └── services/
│   │       ├── googleAds.ts       ← mock data (swap for real API here)
│   │       └── anomalyDetector.ts ← system prompt + Gemini call
│   └── prisma/schema.prisma
└── client/
    ├── CLAUDE.md                  ← frontend agent rules
    └── src/
        ├── App.tsx
        ├── api.ts
        └── components/
            ├── CampaignsTable.tsx
            └── AnomaliesSection.tsx
```

## Tech Stack

| Layer    | Tech                               |
|----------|------------------------------------|
| Frontend | React 19, Vite, Shopify Polaris 13 |
| Backend  | Node.js, Express 5, TypeScript     |
| ORM      | Prisma 7 + PostgreSQL              |
| AI       | Google Gemini 2.5 Flash            |
| Ads API  | Google Ads (mock → OAuth2)         |

## Connecting Real Google Ads API

В `backend/src/services/googleAds.ts` замінити `fetchMockCampaigns()` на реальний OAuth2 запит.
Credentials вже є в `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
Повертати той самий тип `CampaignData[]` — решта коду не потребує змін.
