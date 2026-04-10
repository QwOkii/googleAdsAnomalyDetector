# Google Ads Anomaly Detector

AI-powered application that connects to Google Ads, analyzes campaign performance, and automatically detects anomalies using Gemini AI.

**Live demo:** https://ads.vkoctak.tech  
**API:** https://ads-api.vkoctak.tech

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Shopify Polaris 13 |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 7 + PostgreSQL |
| AI | Google Gemini 2.5 Flash |
| Auth | Google OAuth2 |
| Deploy | Docker, Portainer, Nginx Proxy Manager |

---

## Functional Requirements Coverage

### ✅ 1. Google Ads Integration
- OAuth2 authorization via Google — users sign in with their Google account
- After login, campaign data is fetched: **Name, Status, Cost, Clicks, Conversions, CTR, CPC**
- Data is saved to PostgreSQL via Prisma ORM
- Mock data built from real `Advertising_dataset_with_character_target.csv` with intentionally injected anomalies for demonstration

### ✅ 2. AI Anomaly Engine
- Single Anthropic/Gemini API call with all campaigns batched together (token-efficient)
- System prompt configured to detect:
  - High spend with zero conversions
  - Unusually high CPC vs account average
  - Very low CTR with high spend
  - Paused campaigns still accumulating cost
- Returns structured JSON: `{ campaignName, description, severity: "Low" | "Medium" | "High" }`

### ✅ 3. Polaris UI
- **Campaigns table** — all metrics: Name, Status, Cost, Clicks, Conversions, CTR, CPC
- **AI Insights section** — anomaly cards sorted by severity
- **High severity** cards highlighted in red (border + background)
- **Run Audit button** — triggers fresh AI analysis
- **Sync Campaigns button** — re-fetches data from Google Ads
- Backend health indicator in the header

---

## Architecture

```
Browser
  └── ads.vkoctak.tech (React + Polaris)
        │
        │ HTTPS (Nginx Proxy Manager)
        ▼
  ads-api.vkoctak.tech (Express API)
        │
        ├── GET  /api/campaigns       → returns campaigns from DB
        ├── POST /api/campaigns/sync  → re-sync from Google Ads
        ├── POST /api/audit           → run Gemini AI analysis
        ├── GET  /api/audit           → return saved anomalies
        ├── GET  /auth/google         → OAuth2 redirect
        ├── GET  /auth/google/callback→ handle callback, set cookie
        ├── GET  /auth/me             → check current session
        └── POST /auth/logout         → clear session
        │
        ├── PostgreSQL (Prisma)
        └── Google Gemini API
```

### AI Token Optimization
One `POST /api/audit` → one `messages.create` with all campaigns → Gemini returns JSON array → saved to DB. No per-campaign calls, no loops.

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- PostgreSQL
- Google OAuth2 credentials
- Gemini API key

### Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/adsdb"
GEMINI_API_KEY="AIza..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:4000/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
PORT=4000
```

```bash
npm run db:generate
npm run db:migrate    # enter migration name: init
npm run dev           # → http://localhost:4000
```

### Frontend
```bash
cd client
npm install
npm run dev           # → http://localhost:5173
```

### Run Tests
```bash
# Backend (Jest)
cd backend && npm test

# Frontend (Vitest)
cd client && npm test
```

---

## Tests

### Backend (Jest + Supertest) — 16 tests
| File | Tests | Coverage |
|------|-------|----------|
| `anomalyDetector.test.ts` | 4 | Gemini mock, JSON parsing, markdown stripping, error handling |
| `campaigns.test.ts` | 5 | GET campaigns, POST sync, DB errors |
| `audit.test.ts` | 7 | POST audit flow, missing API key, AI failure, GET anomalies |

### Frontend (Vitest + Testing Library) — 8 tests
| File | Tests | Coverage |
|------|-------|----------|
| `CampaignsTable.test.tsx` | 4 | Column headers, status badges, empty state |
| `AnomaliesSection.test.tsx` | 4 | Empty state, High severity styling, sort order |
| `api.test.ts` | 3 | HTTP calls to correct endpoints |

---

## Deployment (Docker + Portainer)

The app is deployed on VPS via Docker Compose + Portainer + Nginx Proxy Manager for SSL.

```bash
# docker-compose.yml runs:
# - alitastz-backend  (port 4000, internal)
# - alitastz-frontend (port 80, internal)
# Nginx Proxy Manager handles SSL termination and routing
```

Environment variables are set in Portainer stack configuration.

---

## Connecting Real Google Ads API

Currently uses mock data for demonstration. To connect real Google Ads:

1. Obtain a **Google Ads Developer Token** from [Google Ads API Center](https://ads.google.com/home/tools/manager-accounts)
2. In `backend/src/services/googleAds.ts`, replace `fetchMockCampaigns()` with a real API call
3. Use the OAuth2 tokens already stored in the `User` table (`accessToken`, `refreshToken`)
4. Return the same `CampaignData[]` interface — no other code changes needed

---

## Project Structure

```
alitastz/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express entry point
│   │   ├── prisma.ts              # PrismaClient singleton
│   │   ├── middleware/
│   │   │   └── requireAuth.ts     # Cookie-based auth guard
│   │   ├── routes/
│   │   │   ├── auth.ts            # OAuth2 flow
│   │   │   ├── campaigns.ts       # Campaign CRUD
│   │   │   └── audit.ts           # AI audit endpoints
│   │   └── services/
│   │       ├── googleAds.ts       # Google Ads data (mock → real)
│   │       ├── googleAuth.ts      # OAuth2 token handling
│   │       └── anomalyDetector.ts # Gemini AI system prompt + call
│   └── prisma/
│       └── schema.prisma          # Campaign, Anomaly, User models
└── client/
    └── src/
        ├── App.tsx                # Root component + auth state
        ├── api.ts                 # All backend API calls
        └── components/
            ├── LoginPage.tsx      # Google OAuth2 login screen
            ├── CampaignsTable.tsx # Polaris DataTable
            └── AnomaliesSection.tsx # AI Insights cards
```
