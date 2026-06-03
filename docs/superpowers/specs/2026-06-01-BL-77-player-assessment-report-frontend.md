# BL-77 — Player Assessment Report Frontend

## Context

BL-76 delivered the backend report execution engine (`GET /api/v1/reports/player-assessment`, `GET/POST/PUT/DELETE /api/v1/report-configs`). This ticket builds the frontend report page that consumes it.

---

## Section 1 — Route & Entry Points

**Route:** `/report` — standalone page under the dashboard shell, accessible from the sidebar menu.

**URL params (all optional — used for deep-linking):**
- `?playerId={id}` — pre-selects the player
- `?assessmentId={id}` — pre-selects the assessment (requires `playerId` to be resolved)

**Entry points:**

| Source | URL |
|---|---|
| Sidebar menu | `/report` |
| Player detail page | `/report?playerId={id}` |
| Assessment detail page | `/report?playerId={id}&assessmentId={id}` |
| Session detail page | `/report?playerId={id}&assessmentId={id}` |

---

## Section 2 — Architecture

**`src/app/(dashboard)/report/page.tsx`** — thin Server Component. Reads `searchParams` for `playerId` and `assessmentId`, passes them as props to `PlayerAssessmentReportView`.

**`src/views/report/PlayerAssessmentReportView.tsx`** — `'use client'`. Owns all state. Fetches players + configs on mount. Renders `ReportToolbar` and panels area.

**`src/views/report/ReportToolbar.tsx`** — receives state + setters as props. Renders all selectors left-to-right.

**`src/views/report/ReportPanel.tsx`** — receives one panel config (`{ type, series }`) + `ReportData`. Dispatches to chart or table sub-component.

**`src/views/report/SaveConfigDialog.tsx`** — MUI Dialog for naming and saving current state as a report config.

**Shared libs (copied from demo-ui):**
- `src/libs/ApexCharts.tsx`
- `src/libs/styles/AppReactApexCharts.tsx`

**New Next.js API proxy routes:**
- `src/app/api/report-configs/route.ts` → `GET /api/v1/report-configs`, `POST /api/v1/report-configs`
- `src/app/api/report-configs/[name]/route.ts` → `PUT`, `DELETE /api/v1/report-configs/{name}`
- `src/app/api/reports/[id]/route.ts` — repurpose existing file: add `GET` handler forwarding to `GET /api/v1/reports/{id}` with full query string. The `[id]` param serves as `reportType` (e.g. `player-assessment`).

**Install:** `apexcharts`, `react-apexcharts`

---

## Section 3 — State (`PlayerAssessmentReportView`)

```ts
playerId:      number | null   // seeded from URL ?playerId
assessmentId:  number | null   // seeded from URL ?assessmentId; cleared on player change
configName:    string          // default: 'Column Chart'
granularity:   'OVERALL' | 'PER_SESSION' | 'PER_REP'  // default: 'OVERALL'
cmFilter:      number[]        // selected conditionalMetricIds; default: []
reportData:    ReportData | null
loading:       boolean
error:         string | null

// loaded once on mount
players:       PlayerType[]
configs:       ReportConfigEntry[]  // presets + saved

// loaded once on mount (all assessments, filtered client-side by playerId)
assessments:   AssessmentType[]
conditionalMetrics: ConditionalMetricType[]
```

---

## Section 4 — Toolbar (left → right)

1. **Player dropdown** — `GET /api/players` on mount. Changing player clears `assessmentId` and `cmFilter`; assessment list is re-filtered client-side.
2. **Assessment dropdown** — `GET /api/assessments` fetched on mount alongside players; filtered client-side by `playerId`. Auto-selects if exactly one result for the selected player.
3. Divider
4. **Config dropdown** — `GET /api/report-configs?reportType=player-assessment` on mount. Presets listed first, then saved configs.
5. **Granularity toggle** — `Overall | Per Session | Per Rep` button group.
6. **Metrics button** — opens Popover with checklist of ConditionalMetrics filtered by `assessment.conditionId`. Badge shows selected count; empty selection = show all.
7. **Save Config** (right-aligned) — opens `SaveConfigDialog`. Disabled until `assessmentId` is set.

---

## Section 5 — Report Query

Triggered whenever `assessmentId`, `configName`, `granularity`, or `cmFilter` changes (and `assessmentId` is set).

```
GET /api/reports/player-assessment
  ?assessmentId={id}
  &configName={name}
  &granularity={OVERALL|PER_SESSION|PER_REP}
  &conditionalMetricIds={id}&conditionalMetricIds={id}   (repeated, omitted if empty)
```

---

## Section 6 — Panel Rendering

The active config's `panels` array drives what renders. Each panel:

```ts
{ type: 'bar' | 'line' | 'radar' | 'table', series: ('avg'|'min'|'max'|'range')[] }
```

**Chart panels (bar / line / radar):**
- X-axis categories = `columns[].label`
- One ApexCharts series per entry in `panel.series`
- Each series value = the matching field from `ReportCell` for that column (`avg`, `min`, `max`)
- `range` series = ApexCharts `rangeArea` using `[min, max]`
- Cells missing for a column → `null` in that series position (ApexCharts renders as gap)
- Uses `AppReactApexCharts` with MUI palette CSS vars for colours

**Table panel:**
- Rows = `ReportRow` (one row per ConditionalMetric)
- Columns = `ReportColumn` labels
- Cell = `displayValue` from the matching `ReportCell` for `panel.series[0]` (avg/min/max)
- Null cell → "N/A" in muted text
- `count` shown as secondary text under the value (e.g. "× 8 sessions")

---

## Section 7 — Save Config Dialog

Fields:
- **Name** — text, required, unique (409 on submit → inline error "Name already taken")
- Granularity pre-filled from current toolbar state (read-only display, not editable in dialog)

On submit: `POST /api/report-configs` with:
```json
{
  "name": "<entered name>",
  "reportType": "player-assessment",
  "config": {
    "granularity": "<current granularity>",
    "filters": { "conditionalMetricIds": [<current cmFilter>] },
    "panels": [<panels from current active config>]
  }
}
```

On success: new config added to dropdown, auto-selected.

---

## Section 8 — Error Handling & Edge Cases

| Situation | Behaviour |
|---|---|
| Player has no assessments | Assessment dropdown shows "No assessments" disabled option |
| Assessment has no sessions | Empty state card: "No session data recorded yet" |
| PER_SESSION / PER_REP with no data | Same empty state |
| Report fetch fails | Error alert below toolbar: "Failed to load report data" |
| Config fetch fails | Config dropdown shows "Column Chart" as only option |
| Save config 409 | Inline error under name field: "Name already taken" |
| cmFilter results in 0 rows | Empty state: "No data for selected metrics" |
| Assessment auto-selected (only one) | Auto-selects silently; report loads immediately |
| Deep-link with invalid assessmentId | 404 → error alert, selectors remain usable |

**Loading states:**
- Report fetch → `CircularProgress` centered in panels area
- Player / assessment dropdowns → skeleton `MenuItem` while loading
- Save config button → loading state during POST

---

## Section 9 — Navigation Updates

- Add "Player Report" `MenuItem` to `VerticalMenu.tsx` pointing to `/report`
- Add "View Report" link to `/players/{id}` page → `/report?playerId={id}`
- Add "View Report" link to `/assessments/{id}` page → `/report?playerId={assessment.playerId}&assessmentId={id}`
- Add "View Report" link to `/assessments/{id}/sessions/{sessionId}` page → same as assessment link

---

## Section 10 — Types (`src/types/app/reportTypes.ts`)

```ts
export type ReportConfigEntry = {
  id: number | null   // null for presets
  name: string
  reportType: string
  config: ReportConfigJson
  preset: boolean
}

export type ReportConfigJson = {
  granularity: 'OVERALL' | 'PER_SESSION' | 'PER_REP'
  filters: { conditionalMetricIds: number[] }
  panels: ReportPanelConfig[]
}

export type ReportPanelConfig = {
  type: 'bar' | 'line' | 'radar' | 'table'
  series: ('avg' | 'min' | 'max' | 'range')[]
  options?: Record<string, unknown>
}

export type ReportData = {
  columns: ReportColumn[]
  rows: ReportRow[]
}

export type ReportColumn = {
  id: number
  label: string
  type: 'assessment' | 'session' | 'rep'
}

export type ReportRow = {
  conditionalMetricId: number
  name: string
  negated: boolean
  cells: ReportCell[]
}

export type ReportCell = {
  columnId: number
  min: number | null
  max: number | null
  avg: number | null
  count: number
}
```
