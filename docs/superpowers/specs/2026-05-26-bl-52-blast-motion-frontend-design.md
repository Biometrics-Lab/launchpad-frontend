# BL-52 Blast Motion Frontend — Design Spec

## Overview

Frontend cleanup and additions following the BL-52 backend changes: remove deleted Integration and RepMetricSource entities, update DataSource to drop `integrationId`, add `dataSourceId` to RepMetric, add `repNumber` to Rep, and add Start/Stop session controls.

## Deletions

### Files to delete

| File | Reason |
|---|---|
| `src/app/(dashboard)/integrations/page.tsx` | Integration entity removed from backend |
| `src/app/api/integrations/route.ts` | Backend endpoint deleted |
| `src/app/api/integrations/[id]/route.ts` | Backend endpoint deleted |
| `src/app/api/rep-metric-sources/route.ts` | Backend endpoint deleted |
| `src/app/api/rep-metric-sources/[id]/route.ts` | Backend endpoint deleted |
| `src/views/integrations/IntegrationsTable.tsx` | |
| `src/views/integrations/AddIntegrationDrawer.tsx` | |
| `src/views/integrations/EditIntegrationDrawer.tsx` | |
| `src/views/reps/RepMetricSourcesTable.tsx` | |
| `src/views/reps/AddRepMetricSourceDrawer.tsx` | |
| `src/views/reps/EditRepMetricSourceDrawer.tsx` | |
| `src/types/app/integrationTypes.ts` | |

### Nav

Remove `<MenuItem href='/integrations'>Integrations</MenuItem>` from `src/components/layout/vertical/VerticalMenu.tsx`.

## Type Changes

### `src/types/app/dataSourceTypes.ts`

Remove `integrationId`:
```ts
export type DataSourceType = { id: number; metricId: number; name?: string; type: string; content?: string }
```

### `src/types/app/assessmentTypes.ts`

- Remove `RepMetricSourceType`
- Add `dataSourceId?: number | null` to `RepMetricType`
- Add `repNumber?: number` to `RepType`
- Update `SessionType.status` from `'ACTIVE' | 'COMPLETE'` to `'ACTIVE' | 'STOPPED'` (backend lifecycle is `null → ACTIVE → STOPPED`)

## DataSource Forms and Table

Strip `integrationId` and all `integrations` prop references from:

- `src/views/data-sources/DataSourcesTable.tsx` — remove `integrations: IntegrationType[]` prop, Integration column accessor, `integrationMap` memo
- `src/views/data-sources/AddDataSourceDrawer.tsx` — remove `integrations` prop, `integrationId` form field and validation
- `src/views/data-sources/EditDataSourceDrawer.tsx` — same as Add
- `src/views/data-sources/DataSourceEditForm.tsx` — same as Add
- `src/app/(dashboard)/data-sources/page.tsx` — remove `getIntegrations()` fetch and `integrations` from `Promise.all` and table props
- `src/app/(dashboard)/data-sources/[id]/page.tsx` — same removal

## Rep Detail Page

### `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/reps/[repId]/page.tsx`

- Remove `RepMetricSourcesTable` import and usage
- Remove `/repMetricSources` fetch from `Promise.all`
- Remove `repMetricSources` filtering logic
- Remove `DataSourceType` import and `RepMetricSourceType` from type imports

### `src/views/sessions/RepsTable.tsx`

Add read-only `repNumber` column between ID and Start Time. Display as plain text; `repNumber` is never editable.

### `src/views/reps/RepMetricsTable.tsx`

Add `dataSourceId` column — display the numeric value or `—` if null/undefined.

## Session Start/Stop

### New API proxy routes

**`src/app/api/sessions/[id]/start/route.ts`**
```
POST → proxies to POST http://localhost:8080/api/v1/sessions/{id}/start
Returns SessionDto with updated status
```

**`src/app/api/sessions/[id]/stop/route.ts`**
```
POST → proxies to POST http://localhost:8080/api/v1/sessions/{id}/stop
Returns SessionDto with updated status
```

### New client component `src/views/sessions/SessionStartStopButtons.tsx`

Props: `sessionId: number`, `initialStatus: string | null | undefined`

Behavior:
- Local `status` state initialized from `initialStatus`
- Local `loading` boolean state
- **Start button**: rendered only when `status` is `null` or `undefined`. On click: sets `loading=true`, calls `POST /api/sessions/:id/start`, updates `status` from response, calls `router.refresh()`, sets `loading=false`
- **Stop button**: rendered only when `status === 'ACTIVE'`. Same call pattern with `/stop`
- Nothing rendered when `status === 'STOPPED'`
- Buttons disabled while `loading` is true

### `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`

Import `SessionStartStopButtons` (client component). Render it inside the session header card after the status chip:

```tsx
<SessionStartStopButtons sessionId={numericSessionId} initialStatus={session.status} />
```
