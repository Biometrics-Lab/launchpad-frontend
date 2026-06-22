# BL-56 Active Session UI — Design Spec

## Overview

A dedicated page that opens when a session is started. Staff sees live rep data as it arrives via WebSocket — metrics, video, and a rep history list. The page is only reachable while a session is ACTIVE.

---

## Route

```
/assessments/[id]/sessions/[sessionId]/active
```

Navigated to automatically after Start Session succeeds, or directly if the session is already ACTIVE ("Go Live").

---

## Entry Flow

`SessionStartStopButtons` (on session detail page) is modified:

- Status `null` → "Start Session" button → `POST /api/sessions/{id}/start` → on success, `router.push(.../active)`
- Status `ACTIVE` → "Go Live" button → `router.push(.../active)` (no API call)
- Status `COMPLETE` → hidden (existing behaviour, unchanged)

---

## Page Data (server component — `page.tsx`)

Fetches in sequence then parallel:

1. `GET /api/v1/sessions/{sessionId}` → `session` (gets `assessmentId`, `status`)
2. Guard: if `session.status !== 'ACTIVE'` → `redirect` to session detail page
3. In parallel:
   - `GET /api/v1/assessments/{assessmentId}` → `assessment` (gets `playerId`, `templateId`, `conditionId`)
4. In parallel (once assessment loaded):
   - `GET /api/v1/players/{playerId}` → player name
   - `GET /api/v1/assessmentTemplates/{templateId}` → template name
   - `GET /api/v1/conditions/{conditionId}` → condition name (skipped if `conditionId` is null)
   - `GET /api/v1/assessmentMetrics` → filter client-side by `assessmentId` → list of `conditionalMetricId`s
   - `GET /api/v1/conditionalMetrics` → resolve names for those IDs

All fetched data passed as props to `ActiveSessionView`.

---

## File Structure

```
src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/active/
  page.tsx

src/views/sessions/active/
  ActiveSessionView.tsx         — main client component, owns all state
  RepListPanel.tsx              — left column
  VideoPanel.tsx                — center column
  MetricsPanel.tsx              — right column
  useSessionWebSocket.ts        — STOMP hook
  useResourcePoller.ts          — resource polling hook

src/app/api/sessions/[id]/reps/
  route.ts                      — proxy: GET /api/v1/sessions/{id}/reps

src/app/api/reps/[id]/resources/
  route.ts                      — proxy: GET /api/v1/reps/{id}/resources

src/views/sessions/
  SessionStartStopButtons.tsx   — modified (entry flow)
```

---

## New Types (added to `assessmentTypes.ts`)

```typescript
export type RepBroadcastDto = {
  id: number
  sessionId: number
  repNumber?: number
  startTime: string
  metrics: RepMetricBroadcastData[]
  resources: RepResourceBroadcastData[]
}

export type RepMetricBroadcastData = {
  conditionalMetricId: number
  name: string
  value?: number
}

export type RepResourceBroadcastData = {
  id: number
  type: string
  url: string
  status: UrlStatus  // 'PENDING' | 'READY' | 'FAILED'
}
```

---

## State (`ActiveSessionView`)

```typescript
reps: RepBroadcastDto[]           // grows as WebSocket delivers; initialized from REST on mount
currentRepId: number | null       // which rep is displayed; auto-jumps to newest on each WS event
selectedVideoType: string | null  // persists across reps; null = auto-pick first VIDEO resource
```

---

## WebSocket Hook (`useSessionWebSocket`)

- Connects STOMP via SockJS to `http://localhost:8080/ws`
- Subscribes to `/topic/session/{sessionId}/reps`
- On each message: parses `RepBroadcastDto`, calls `onRep(rep)` callback
- Auto-reconnect handled natively by `@stomp/stompjs`
- On unmount: unsubscribe + deactivate client

Connection failure → caller receives `connected: false` → view shows warning banner.

Packages to install: `@stomp/stompjs`, `sockjs-client`, `@types/sockjs-client`

---

## Resource Polling Hook (`useResourcePoller`)

```
useResourcePoller(repId: number, initialResources: RepResourceBroadcastData[])
  → resources: RepResourceBroadcastData[]
```

- Polls `GET /api/reps/{repId}/resources` every 3 seconds
- Response is `RepResourceType[]` (field `urlStatus`) — hook maps `urlStatus → status` before returning `RepResourceBroadcastData[]`
- Stops when all resources are `READY` or `FAILED`, or on unmount
- Replaces the full resource list on each poll response
- Only runs while current rep has at least one `PENDING` resource

---

## Layout

3-column grid using MUI `Grid2`:

```
Header card (full width)
────────────────────────────────────────
Left 3/12  │  Center 6/12  │  Right 3/12
Rep List   │  Video        │  Metrics
```

### Header Card

```
John Smith  ·  Hitting from T  ·  Standard Hitting     ● ACTIVE   [■ Stop Session]
Session #12  ·  Assessment #5
```

- Player name, condition name, template name on first line
- Session ID + Assessment ID on second line
- `Chip variant='tonal' color='success'` for ACTIVE badge
- Stop button: `Button variant='contained' color='error'`
  - On click: `POST /api/sessions/{id}/stop` → `router.push(.../sessions/{sessionId})`
  - Disabled + spinner while in-flight
  - Error shown inline below button on failure

### Left — Rep List Panel (`RepListPanel`)

- MUI `Card` with `CardHeader` showing "Reps · {count}"
- Scrollable list; auto-scrolls to bottom on new rep
- Each row: rep number, first metric value as a hint
- Current rep row: `Chip variant='tonal' color='primary'` label + highlighted background
- Clicking a row: sets `currentRepId` (overridden on next WebSocket rep)
- Empty state (no reps yet): `CircularProgress` + "Waiting for first rep…"

### Center — Video Panel (`VideoPanel`)

- MUI `Card`
- States:
  - `PENDING`: centered `CircularProgress` + "Processing video…" caption
  - `READY`: `<video autoPlay muted loop style={{ width: '100%' }} src={url} />`
  - `FAILED` or no video resource: grey placeholder + `ri-video-off-line` icon + label
- Source switcher (only if rep has >1 VIDEO-type resource): MUI `ToggleButtonGroup` above the video, one button per resource type label
  - Selection stored in `selectedVideoType`; persists across reps
  - If `selectedVideoType` not found in current rep → fall back to first VIDEO resource

Video resource detection: resource whose `type` contains `"VIDEO"` (case-insensitive).

### Right — Metrics Panel (`MetricsPanel`)

- MUI `Card`
- Metric cards built from `expectedMetrics` (passed from page.tsx) — always stable set
- Before first rep / missing value: display `—` (never `0`)
- Each card: `CustomAvatar variant='rounded' skin='light' color={color}` + big value `Typography` + metric name
- Colors cycle by index: `primary → success → warning → error → secondary`
- No summary section

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| WebSocket disconnect | `Alert severity='warning'` banner: "Live connection lost — reps may be delayed" |
| Stop API failure | Inline error below Stop button; button re-enables |
| Video FAILED | Placeholder with "Video unavailable", no retry |
| Session not ACTIVE on page load | Redirect to session detail |
| Metric value missing in rep | Show `—` |
| `conditionId` is null | Skip condition fetch; omit from header |

---

## API Proxy Routes

### `GET /api/sessions/[id]/reps`
Proxies to `GET http://localhost:8080/api/v1/sessions/{id}/reps`
Returns `RepBroadcastDto[]`

### `GET /api/reps/[id]/resources`
Proxies to `GET http://localhost:8080/api/v1/reps/{id}/resources`
Returns `RepResourceBroadcastData[]`
