# Frontend Agent — CLAUDE.md

## Role
You are the frontend agent for the Google Ads Anomaly Detector.
Work ONLY inside `client/`. Never touch `backend/`.

## Stack
- React 19 + TypeScript
- Vite 8
- Shopify Polaris 13 (UI components)
- Axios (API calls)

## Project Structure

```
client/
├── src/
│   ├── App.tsx                   # Root: AppProvider, Page, layout, state
│   ├── api.ts                    # All backend calls (getCampaigns, runAudit, getAnomalies)
│   ├── main.tsx                  # React DOM entry
│   └── components/
│       ├── CampaignsTable.tsx    # Polaris DataTable with all campaign metrics
│       └── AnomaliesSection.tsx  # AI Insights cards, severity badges, High=red border
└── index.html
```

## Component Responsibilities

### App.tsx
- State: `campaigns`, `anomalies`, `loadingCampaigns`, `auditing`, `error`, `auditMessage`
- On mount: call `getCampaigns()` + `getAnomalies()`
- "Run Audit" button calls `runAudit()` → updates `anomalies` state
- Shows `Banner` (critical) if any High severity anomalies exist
- Wraps everything in Polaris `AppProvider` with `enTranslations`

### CampaignsTable.tsx
- Props: `campaigns: Campaign[]`, `loading: boolean`
- Uses Polaris `DataTable`
- Columns: Campaign | Status | Cost | Clicks | Conversions | CTR | CPC
- Status uses Polaris `Badge`: ENABLED=success, PAUSED=warning

### AnomaliesSection.tsx
- Props: `anomalies: Anomaly[]`
- Shows empty state if no anomalies
- `AnomalyCard`: shows campaign name + description + severity badge
- High severity card: red border (`#d72c0d`) + light red background (`#fff4f4`)
- Sorts: High first, then Medium, then Low

## API Contract (from `api.ts`)

```typescript
Campaign { id, name, status, cost, clicks, conversions, ctr, cpc, createdAt }
Anomaly  { id, campaignId, description, severity: "Low"|"Medium"|"High", campaign: Campaign }
AuditResult { analyzed: number, anomaliesFound: number, anomalies: Anomaly[] }
```

Backend base URL: `http://localhost:4000/api`

## Polaris Usage Rules

1. Always import from `@shopify/polaris`
2. Always wrap app in `<AppProvider i18n={enTranslations}>`
3. Import CSS: `import "@shopify/polaris/build/esm/styles.css"` (in App.tsx only)
4. Use `BlockStack` for vertical layout, `InlineStack` for horizontal
5. Use `Card` as the primary container for sections
6. Use `Banner` for status messages (tone: success | critical | warning)
7. Use `Badge` for severity and status indicators
8. Never use raw HTML for layout — always Polaris components

## Coding Rules

1. TypeScript strict — no `any`
2. Functional components only, hooks for state
3. Never put API calls directly in components — use `api.ts`
4. Handle loading and error states visibly
5. No inline styles except for anomaly card severity coloring

## Dev Command

```bash
npm run dev    # Vite dev server → http://localhost:5173
```
