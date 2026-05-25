# BL-54 Frontend: Player Metrics — Design Spec

**Ticket:** BL-54 — Player metrics aggregation API (frontend task)  
**Date:** 2026-05-25  
**Status:** Approved

---

## Overview

Implement two frontend pages that consume the backend endpoint `GET /api/v1/players/{id}/metrics`:

1. **Player report page** — per-player detail at `/players/[id]`, showing overall and per-assessment metric breakdowns
2. **Dashboard home** — replaces the placeholder `/home` page with a grid of player metric cards

---

## API

**Endpoint:** `GET /api/v1/players/{id}/metrics`  
**Auth:** HTTP Basic (`biolab`/`biolab`)

**Response shape:**
```json
{
  "overall": [
    { "conditionalMetricId": 1, "name": "Exit velocity from T", "negated": false, "minValue": 78.0, "maxValue": 112.0, "avgValue": 96.5 }
  ],
  "assessments": [
    {
      "assessmentId": 3,
      "sport": "Baseball",
      "metrics": [
        { "conditionalMetricId": 1, "name": "Exit velocity from T", "negated": false, "minValue": 80.0, "maxValue": 110.0, "avgValue": 95.0 }
      ]
    }
  ]
}
```

**Rules:**
- `maxValue` = best performance (negate logic handled server-side)
- `minValue` = worst performance
- Null values = no completed session yet — display as `N/A`, never `0`
- Returns 404 if player does not exist

---

## TypeScript Types

**New file:** `src/types/app/playerMetricsTypes.ts`

```ts
export type PlayerMetricEntry = {
  conditionalMetricId: number
  name: string
  negated: boolean
  minValue: number | null
  maxValue: number | null
  avgValue: number | null
}

export type PlayerAssessmentMetrics = {
  assessmentId: number
  sport: string
  metrics: PlayerMetricEntry[]
}

export type PlayerMetricsResponse = {
  overall: PlayerMetricEntry[]
  assessments: PlayerAssessmentMetrics[]
}
```

---

## API Proxy Route

**New file:** `src/app/api/players/[id]/metrics/route.ts`

Proxies `GET /api/v1/players/{id}/metrics` to the Spring Boot backend using the same Basic auth pattern as all other proxy routes. Returns the response as-is with the original status code.

---

## 1. Player Report Page

### Route & files

| File | Role |
|------|------|
| `src/app/(dashboard)/players/[id]/page.tsx` | Server Component — fetches data, passes to view |
| `src/views/players/PlayerReportView.tsx` | Client Component (`'use client'`) — renders accordion UI |

### Data fetching (parallel)

- `GET /api/v1/players/{id}` — player info; 404 → `notFound()`
- `GET /api/v1/players/{id}/metrics` — aggregated metrics; empty response on error
- `GET /api/v1/teams` — to resolve team name

### Layout

1. **Back link** → `/players`
2. **Player header card**: name (h5), team name, grad year, dob (secondary text)
3. **Overall section**: heading "Overall", then a responsive grid of metric cards — each card shows metric name (small), avg value (large, primary color), min/max below in secondary text. Null values display as `N/A`.
4. **Assessments section**: MUI `Accordion` per entry in `assessments[]`
   - Summary: `Assessment #${assessmentId} · ${sport}`
   - Details: same metric card grid as Overall
   - Empty state if `assessments` array is empty: "No assessments recorded yet"

### Navigation change

`src/views/people/PlayersTable.tsx` — the `name` column cell becomes a `<Link href={/players/${id}}>` instead of plain `<Typography>`.

---

## 2. Dashboard Home

### Route & files

| File | Role |
|------|------|
| `src/app/(dashboard)/home/page.tsx` | Server Component — fetches all data, passes to view |
| `src/views/home/DashboardView.tsx` | Presentational component — renders player metric cards grid |

### Data fetching

1. `GET /api/v1/players` — all players
2. `GET /api/v1/teams` — all teams (for name resolution)
3. `GET /api/v1/players/{id}/metrics` for **each** player — via `Promise.all` in parallel

### Layout

- Page title: "Dashboard"
- Responsive grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- **Player card** (MUI `Card`):
  - Header: player name as `<Link href={/players/${id}}>` (primary color), subtitle: team name + grad year
  - Body: for each metric in `overall[]`:
    - Metric name in small uppercase label
    - `min <value>  max <value>  avg <value>` inline, avg in primary color
    - Null values → `N/A`
  - Empty state: "No metrics recorded yet" if `overall` is empty
- Empty state for whole page: "No players found" if players list is empty

---

## Cleanup (in this branch)

- Remove `lastValue?: number` from `AssessmentMetricType` in `src/types/app/assessmentTypes.ts` ✅ (already done)
- Remove "Last" column from `AssessmentMetricsTable.tsx` ✅ (already done)

---

## Out of Scope

- Charts or trend visualizations (future ticket)
- Filtering/sorting metrics on the report page
- Pagination on the dashboard (all players shown)
