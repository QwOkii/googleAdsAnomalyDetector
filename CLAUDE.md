# Google Ads Anomaly Detector — Project Root

## Architecture Overview

```
alitastz/
├── backend/          # Node.js + Express + Prisma + Anthropic
└── client/           # React + Vite + Shopify Polaris
```

## Two Claude Code Agents

### 1. backend-agent
- Scope: `backend/` only
- Responsibilities: Express server, Prisma ORM, Google Ads mock/real data, AI audit endpoint
- Entry: `backend/src/server.ts`
- See: `backend/CLAUDE.md`

### 2. frontend-agent
- Scope: `client/` only
- Responsibilities: Polaris UI components, campaigns table, AI Insights section, Run Audit button
- Entry: `client/src/App.tsx`
- See: `client/CLAUDE.md`

## Data Flow

```
Google Ads API (mock) → POST /api/campaigns/sync → Prisma (Campaign table)
                                                          ↓
                              POST /api/audit → Anthropic API (single batch call)
                                                          ↓
                                              Prisma (Anomaly table) → GET /api/audit
                                                          ↓
                                                    React UI (Polaris)
```

## AI Strategy

**One call, all campaigns.** The audit sends ALL campaigns in a single Anthropic API request.
No per-campaign calls. No streaming. No agent loop.
System prompt is static — defined once in `backend/src/services/anomalyDetector.ts`.

## Dev Setup

```bash
# Backend
cd backend && npm install && npm run db:migrate && npm run dev

# Frontend (separate terminal)
cd client && npm install && npm run dev
```

Backend: http://localhost:4000
Frontend: http://localhost:5173

## Environment Variables

`backend/.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Anthropic API key
- `PORT` — defaults to 4000
