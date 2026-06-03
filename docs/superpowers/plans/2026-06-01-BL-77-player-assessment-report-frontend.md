# BL-77 Player Assessment Report — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `/report` page where users select a player and assessment to view a configurable ApexCharts report (bar/line/radar/table panels) driven by named configs, with a granularity toggle, metric filter, and save-config flow.

**Architecture:** A thin Server Component at `src/app/(dashboard)/report/page.tsx` reads optional `?playerId` and `?assessmentId` URL seeds and passes them to a `'use client'` view that owns all state. The toolbar holds five selectors (player → assessment → config → granularity → metrics). Each report query hits `GET /api/reports/player-assessment` with `assessmentId`, `configName`, `granularity`, and `conditionalMetricIds` as query params. Panel rendering is driven by the active config's `panels[]` array; each panel type dispatches to a dedicated ApexCharts chart or MUI table component.

**Spec:** `docs/superpowers/specs/2026-06-01-BL-77-player-assessment-report-frontend.md`

---

## Prerequisites

BL-76 backend must be running with:
- `GET /api/v1/reports/player-assessment?assessmentId=&configName=&granularity=`
- `GET /api/v1/report-configs?reportType=player-assessment`
- `POST /api/v1/report-configs`

---

## File map

**Install:**
- `apexcharts`, `react-apexcharts` — npm packages

**Create:**
- `src/libs/ApexCharts.tsx` — SSR-safe dynamic import of react-apexcharts
- `src/libs/styles/AppReactApexCharts.tsx` — MUI-themed styled wrapper for ApexCharts
- `src/types/app/reportTypes.ts` — replace stub with full domain types
- `src/app/api/report-configs/route.ts` — Next.js proxy: GET + POST `/api/v1/report-configs`
- `src/app/api/report-configs/[name]/route.ts` — proxy: PUT + DELETE `/api/v1/report-configs/{name}`
- `src/app/(dashboard)/report/page.tsx` — server component, reads searchParams
- `src/views/report/PlayerAssessmentReportView.tsx` — `'use client'`, owns all state
- `src/views/report/ReportToolbar.tsx` — all selectors
- `src/views/report/ReportPanel.tsx` — dispatches to chart/table by panel type
- `src/views/report/SaveConfigDialog.tsx` — name + save dialog

**Modify:**
- `src/app/api/reports/[id]/route.ts` — add GET handler forwarding to execution endpoint
- `src/components/layout/vertical/VerticalMenu.tsx` — add "Player Report" menu item
- `src/app/(dashboard)/players/[id]/page.tsx` — add "View Report" link
- `src/app/(dashboard)/assessments/[id]/page.tsx` — add "View Report" link
- `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx` — add "View Report" link

---

## Task 1: Install ApexCharts and add shared libs

**Files:**
- Modify: `package.json`
- Create: `src/libs/ApexCharts.tsx`
- Create: `src/libs/styles/AppReactApexCharts.tsx`

- [ ] **Step 1: Install packages**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend
npm install apexcharts react-apexcharts
```

Expected: packages added to `node_modules`, `package.json` updated with `apexcharts` and `react-apexcharts` in dependencies.

- [ ] **Step 2: Create `src/libs/ApexCharts.tsx`**

```tsx
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export default Chart
```

- [ ] **Step 3: Create `src/libs/styles/AppReactApexCharts.tsx`**

```tsx
'use client'

import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import type { BoxProps } from '@mui/material/Box'
import type { Props } from 'react-apexcharts'

import ReactApexcharts from '@/libs/ApexCharts'

type ApexChartWrapperProps = Props & { boxProps?: BoxProps }

const ApexChartWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  '& .apexcharts-canvas': {
    "& line[stroke='transparent']": { display: 'none' },
    '& .apexcharts-tooltip': {
      boxShadow: 'var(--mui-customShadows-xs)',
      borderColor: 'var(--mui-palette-divider)',
      background: 'var(--mui-palette-background-paper)',
      '& .apexcharts-tooltip-title': {
        fontWeight: 600,
        borderColor: 'var(--mui-palette-divider)',
        background: 'var(--mui-palette-background-paper)'
      },
      '&.apexcharts-theme-light': { color: 'var(--mui-palette-text-primary)' },
      '&.apexcharts-theme-dark': { color: 'var(--mui-palette-common-white)' }
    },
    '& .apexcharts-text, & .apexcharts-tooltip-text, & .apexcharts-legend-text': {
      fontFamily: `${theme.typography.fontFamily} !important`
    }
  }
})) as typeof Box

const AppReactApexCharts = ({ boxProps, ...rest }: ApexChartWrapperProps) => (
  <ApexChartWrapper {...boxProps}>
    <ReactApexcharts {...rest} />
  </ApexChartWrapper>
)

export default AppReactApexCharts
```

- [ ] **Step 4: Verify TypeScript sees the types**

```bash
npm run build 2>&1 | grep -E "error|ApexChart" | head -20
```

Expected: no errors referencing `ApexCharts.tsx` or `AppReactApexCharts.tsx`.

---

## Task 2: Define report domain types

**Files:**
- Modify: `src/types/app/reportTypes.ts`

The existing file has only `type ReportType = { id: number; name: string; extRef?: string }` which is a different entity (report type dictionary). Replace entirely.

- [ ] **Step 1: Replace `src/types/app/reportTypes.ts`**

```ts
export type ReportType = { id: number; name: string; extRef?: string }

export type ReportConfigEntry = {
  id: number | null
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

- [ ] **Step 2: Verify no type errors**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors. The existing `ReportsTable.tsx` uses `ReportType` (the dictionary type) which is still exported.

---

## Task 3: Add Next.js API proxy routes for report-configs and execution

**Files:**
- Create: `src/app/api/report-configs/route.ts`
- Create: `src/app/api/report-configs/[name]/route.ts`
- Modify: `src/app/api/reports/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/report-configs/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' }

export async function GET(req: NextRequest) {
  const reportType = req.nextUrl.searchParams.get('reportType')
  const url = reportType
    ? `${API_BASE}/report-configs?reportType=${encodeURIComponent(reportType)}`
    : `${API_BASE}/report-configs`
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })

  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_BASE}/report-configs`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  })

  return NextResponse.json(await res.json(), { status: res.status })
}
```

- [ ] **Step 2: Create `src/app/api/report-configs/[name]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' }

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const body = await req.json()
  const res = await fetch(`${API_BASE}/report-configs/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body)
  })

  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const res = await fetch(`${API_BASE}/report-configs/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: HEADERS
  })

  return NextResponse.json(await res.json(), { status: res.status })
}
```

- [ ] **Step 3: Add GET handler to `src/app/api/reports/[id]/route.ts`**

Current file only has DELETE. Open it and add GET before DELETE:

```ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const qs = req.nextUrl.search
  const res = await fetch(`${API_BASE}/reports/${id}${qs}`, {
    headers: HEADERS,
    cache: 'no-store'
  })

  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/reports/${id}`, { method: 'DELETE', headers: HEADERS })

  return NextResponse.json(await res.json(), { status: res.status })
}
```

- [ ] **Step 4: Verify compilation**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors.

---

## Task 4: Build `ReportPanel` — chart and table renderers

**Files:**
- Create: `src/views/report/ReportPanel.tsx`

This component receives one panel config + the full `ReportData` and renders either an ApexCharts chart or an MUI table. It is a pure rendering component with no state or fetching.

- [ ] **Step 1: Create `src/views/report/ReportPanel.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { ApexOptions } from 'apexcharts'
import type { ReportData, ReportPanelConfig, ReportCell } from '@/types/app/reportTypes'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Props = {
  panel: ReportPanelConfig
  data: ReportData
}

function cellValue(cell: ReportCell | undefined, key: 'avg' | 'min' | 'max'): number | null {
  if (!cell) return null
  return cell[key] ?? null
}

function buildSeries(data: ReportData, panel: ReportPanelConfig) {
  const seriesKeys = panel.series.filter((s): s is 'avg' | 'min' | 'max' => s !== 'range')

  return seriesKeys.map(key => ({
    name: key.toUpperCase(),
    data: data.rows.flatMap(row =>
      data.columns.map(col => {
        const cell = row.cells.find(c => c.columnId === col.id)
        return cellValue(cell, key)
      })
    )
  }))
}

function buildCategories(data: ReportData): string[] {
  // X-axis: metric name × column label for multi-column, or just metric name for OVERALL
  if (data.columns.length === 1) {
    return data.rows.map(r => r.name)
  }

  return data.rows.flatMap(r => data.columns.map(col => `${r.name} / ${col.label}`))
}

const COLORS = [
  'var(--mui-palette-primary-main)',
  'var(--mui-palette-info-main)',
  'var(--mui-palette-warning-main)',
  'var(--mui-palette-error-main)'
]

function ChartPanel({ panel, data }: Props) {
  const categories = buildCategories(data)
  const series = buildSeries(data, panel)
  const disabledText = 'var(--mui-palette-text-disabled)'

  const options: ApexOptions = {
    chart: { toolbar: { show: false }, animations: { enabled: false } },
    colors: COLORS,
    dataLabels: { enabled: false },
    legend: { show: series.length > 1 },
    grid: {
      strokeDashArray: 8,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: false } }
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: disabledText, fontSize: '12px' }, rotate: -30 }
    },
    yaxis: {
      labels: {
        style: { colors: disabledText, fontSize: '12px' },
        formatter: (v: number) => v == null ? 'N/A' : String(Math.round(v * 10) / 10)
      }
    },
    tooltip: { theme: 'light' },
    ...(panel.type === 'bar' && {
      plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } }
    }),
    ...(panel.type === 'line' && {
      stroke: { curve: 'smooth', width: 2 }
    }),
    ...(panel.type === 'radar' && {
      plotOptions: { radar: { polygons: { strokeColors: 'var(--mui-palette-divider)' } } }
    }),
    ...(panel.options ?? {})
  }

  const apexType = panel.type as 'bar' | 'line' | 'radar'

  return (
    <AppReactApexCharts
      type={apexType}
      width='100%'
      height={300}
      series={series}
      options={options}
    />
  )
}

function TablePanel({ panel, data }: Props) {
  const valueKey = (panel.series[0] ?? 'avg') as 'avg' | 'min' | 'max'

  return (
    <div className='overflow-x-auto'>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--mui-palette-divider)', background: 'var(--mui-palette-action-hover)' }}>
              Metric
            </th>
            {data.columns.map(col => (
              <th key={col.id} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--mui-palette-divider)', background: 'var(--mui-palette-action-hover)' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map(row => (
            <tr key={row.conditionalMetricId}>
              <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--mui-palette-divider)' }}>
                {row.name}
              </td>
              {data.columns.map(col => {
                const cell = row.cells.find(c => c.columnId === col.id)
                const val = cell ? cellValue(cell, valueKey) : null

                return (
                  <td key={col.id} style={{ padding: '6px 12px', textAlign: 'center', borderBottom: '1px solid var(--mui-palette-divider)' }}>
                    {val == null ? (
                      <Typography variant='caption' color='text.disabled'>N/A</Typography>
                    ) : (
                      <span>{Math.round(val * 10) / 10}</span>
                    )}
                    {cell && cell.count > 1 && (
                      <Typography variant='caption' color='text.secondary' display='block'>
                        ×{cell.count}
                      </Typography>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ReportPanel = ({ panel, data }: Props) => (
  <Card>
    <CardContent>
      {panel.type === 'table' ? (
        <TablePanel panel={panel} data={data} />
      ) : (
        <ChartPanel panel={panel} data={data} />
      )}
    </CardContent>
  </Card>
)

export default ReportPanel
```

- [ ] **Step 2: Verify compilation**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors.

---

## Task 5: Build `SaveConfigDialog`

**Files:**
- Create: `src/views/report/SaveConfigDialog.tsx`

- [ ] **Step 1: Create `src/views/report/SaveConfigDialog.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import type { ReportConfigEntry, ReportConfigJson } from '@/types/app/reportTypes'

type Props = {
  open: boolean
  config: ReportConfigJson
  onClose: () => void
  onSaved: (entry: ReportConfigEntry) => void
}

const SaveConfigDialog = ({ open, config, onClose, onSaved }: Props) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    setName('')
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/report-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), reportType: 'player-assessment', config })
      })

      const data = await res.json()

      if (res.status === 409) {
        setError('Name already taken')
        return
      }

      if (!res.ok) {
        setError('Failed to save config')
        return
      }

      onSaved(data as ReportConfigEntry)
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Save Config</DialogTitle>
      <DialogContent className='flex flex-col gap-4 !pt-4'>
        <TextField
          label='Name'
          value={name}
          onChange={e => setName(e.target.value)}
          error={!!error}
          helperText={error ?? ' '}
          fullWidth
          size='small'
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <TextField
          label='Granularity'
          value={config.granularity}
          fullWidth
          size='small'
          InputProps={{ readOnly: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SaveConfigDialog
```

- [ ] **Step 2: Verify compilation**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors.

---

## Task 6: Build `ReportToolbar`

**Files:**
- Create: `src/views/report/ReportToolbar.tsx`

The toolbar holds all selectors. It receives state and setters from the parent view.

- [ ] **Step 1: Create `src/views/report/ReportToolbar.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'

import type { PlayerType } from '@/types/app/playersTypes'
import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { ReportConfigEntry } from '@/types/app/reportTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'

type Granularity = 'OVERALL' | 'PER_SESSION' | 'PER_REP'

type Props = {
  players: PlayerType[]
  assessments: AssessmentType[]
  configs: ReportConfigEntry[]
  conditionalMetrics: ConditionalMetricType[]
  playerId: number | null
  assessmentId: number | null
  configName: string
  granularity: Granularity
  cmFilter: number[]
  onPlayerChange: (id: number | null) => void
  onAssessmentChange: (id: number | null) => void
  onConfigChange: (name: string) => void
  onGranularityChange: (g: Granularity) => void
  onCmFilterChange: (ids: number[]) => void
  onSaveConfig: () => void
}

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'OVERALL', label: 'Overall' },
  { value: 'PER_SESSION', label: 'Per Session' },
  { value: 'PER_REP', label: 'Per Rep' }
]

const ReportToolbar = ({
  players, assessments, configs, conditionalMetrics,
  playerId, assessmentId, configName, granularity, cmFilter,
  onPlayerChange, onAssessmentChange, onConfigChange, onGranularityChange, onCmFilterChange, onSaveConfig
}: Props) => {
  const [metricsAnchor, setMetricsAnchor] = useState<HTMLElement | null>(null)

  const playerAssessments = assessments.filter(a => a.playerId === playerId)

  const toggleMetric = (id: number) => {
    if (cmFilter.length === 0) {
      // currently showing all — unchecking one means "show all except this"
      onCmFilterChange(conditionalMetrics.map(cm => cm.id).filter(x => x !== id))
    } else {
      const next = cmFilter.includes(id) ? cmFilter.filter(x => x !== id) : [...cmFilter, id]
      // if all are selected, collapse back to "show all" (empty array)
      onCmFilterChange(next.length === conditionalMetrics.length ? [] : next)
    }
  }

  return (
    <div className='flex items-center gap-3 flex-wrap p-3' style={{ background: 'var(--mui-palette-action-hover)', borderBottom: '1px solid var(--mui-palette-divider)' }}>
      {/* Player */}
      <FormControl size='small' sx={{ minWidth: 180 }}>
        <InputLabel>Player</InputLabel>
        <Select
          label='Player'
          value={playerId ?? ''}
          onChange={e => onPlayerChange(e.target.value ? Number(e.target.value) : null)}
        >
          <MenuItem value=''><em>Select player…</em></MenuItem>
          {players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Assessment */}
      <FormControl size='small' sx={{ minWidth: 220 }} disabled={!playerId}>
        <InputLabel>Assessment</InputLabel>
        <Select
          label='Assessment'
          value={assessmentId ?? ''}
          onChange={e => onAssessmentChange(e.target.value ? Number(e.target.value) : null)}
        >
          <MenuItem value=''><em>Select assessment…</em></MenuItem>
          {playerAssessments.map(a => (
            <MenuItem key={a.id} value={a.id}>#{a.id} {a.sport} — {a.date}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <div style={{ width: 1, height: 32, background: 'var(--mui-palette-divider)' }} />

      {/* Config */}
      <FormControl size='small' sx={{ minWidth: 200 }} disabled={!assessmentId}>
        <InputLabel>Config</InputLabel>
        <Select
          label='Config'
          value={configName}
          onChange={e => onConfigChange(e.target.value)}
        >
          {configs.map(c => (
            <MenuItem key={c.name} value={c.name}>
              {c.name}{c.preset ? ' (preset)' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Granularity */}
      <ButtonGroup size='small' disabled={!assessmentId}>
        {GRANULARITIES.map(g => (
          <Button
            key={g.value}
            variant={granularity === g.value ? 'contained' : 'outlined'}
            onClick={() => onGranularityChange(g.value)}
          >
            {g.label}
          </Button>
        ))}
      </ButtonGroup>

      {/* Metrics filter */}
      <Badge badgeContent={cmFilter.length || null} color='primary'>
        <Button
          size='small'
          variant='outlined'
          startIcon={<i className='ri-settings-3-line' />}
          onClick={e => setMetricsAnchor(e.currentTarget)}
          disabled={!assessmentId || conditionalMetrics.length === 0}
        >
          Metrics
        </Button>
      </Badge>

      <Popover
        open={!!metricsAnchor}
        anchorEl={metricsAnchor}
        onClose={() => setMetricsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <div className='p-3 flex flex-col gap-1' style={{ minWidth: 200, maxHeight: 300, overflowY: 'auto' }}>
          <Typography variant='caption' color='text.secondary' className='uppercase tracking-wide mb-1'>
            Filter Metrics
          </Typography>
          {conditionalMetrics.map(cm => (
            <FormControlLabel
              key={cm.id}
              control={
                <Checkbox
                  size='small'
                  checked={cmFilter.length === 0 || cmFilter.includes(cm.id)}
                  onChange={() => toggleMetric(cm.id)}
                />
              }
              label={<Typography variant='body2'>{cm.name}</Typography>}
            />
          ))}
        </div>
      </Popover>

      {/* Save Config */}
      <Button
        size='small'
        variant='contained'
        startIcon={<i className='ri-save-line' />}
        onClick={onSaveConfig}
        disabled={!assessmentId}
        sx={{ marginLeft: 'auto' }}
      >
        Save Config
      </Button>
    </div>
  )
}

export default ReportToolbar
```

- [ ] **Step 2: Verify compilation**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors.

---

## Task 7: Build `PlayerAssessmentReportView`

**Files:**
- Create: `src/views/report/PlayerAssessmentReportView.tsx`

This is the main client component that owns all state, fetches data, and composes toolbar + panels.

- [ ] **Step 1: Check the AssessmentType shape to confirm `playerId` and `date` fields**

Open `src/types/app/assessmentTypes.ts` and confirm `AssessmentType` has `playerId: number` and `date: string`. If missing, add them. Current known fields: `id`, `playerId`, `templateId`, `conditionId`, `sport`, `date`.

- [ ] **Step 2: Check ConditionalMetricType shape**

Open `src/types/app/conditionTypes.ts` and confirm `ConditionalMetricType` has `id`, `name`, `conditionId`. If the type file doesn't exist or has different fields, note the actual field names and adjust the import in `ReportToolbar.tsx` accordingly.

- [ ] **Step 3: Create `src/views/report/PlayerAssessmentReportView.tsx`**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import ReportToolbar from './ReportToolbar'
import ReportPanel from './ReportPanel'
import SaveConfigDialog from './SaveConfigDialog'

import type { PlayerType } from '@/types/app/playersTypes'
import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { ReportConfigEntry, ReportConfigJson, ReportData } from '@/types/app/reportTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'

type Granularity = 'OVERALL' | 'PER_SESSION' | 'PER_REP'

const DEFAULT_CONFIG_NAME = 'Column Chart'

type Props = {
  initialPlayerId: number | null
  initialAssessmentId: number | null
}

const PlayerAssessmentReportView = ({ initialPlayerId, initialAssessmentId }: Props) => {
  const [players, setPlayers] = useState<PlayerType[]>([])
  const [assessments, setAssessments] = useState<AssessmentType[]>([])
  const [configs, setConfigs] = useState<ReportConfigEntry[]>([])
  const [conditionalMetrics, setConditionalMetrics] = useState<ConditionalMetricType[]>([])

  const [playerId, setPlayerId] = useState<number | null>(initialPlayerId)
  const [assessmentId, setAssessmentId] = useState<number | null>(initialAssessmentId)
  const [configName, setConfigName] = useState(DEFAULT_CONFIG_NAME)
  const [granularity, setGranularity] = useState<Granularity>('OVERALL')
  const [cmFilter, setCmFilter] = useState<number[]>([])

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Load players, assessments, and configs on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/players').then(r => r.json()),
      fetch('/api/assessments').then(r => r.json()),
      fetch('/api/report-configs?reportType=player-assessment').then(r => r.json())
    ]).then(([p, a, c]) => {
      setPlayers(p)
      setAssessments(a)
      setConfigs(c)
    }).catch(() => {
      setConfigs([])
    })
  }, [])

  // Auto-select assessment when player has exactly one
  useEffect(() => {
    if (!playerId) return
    const playerAssessments = assessments.filter(a => a.playerId === playerId)
    if (playerAssessments.length === 1) {
      setAssessmentId(playerAssessments[0].id)
    }
  }, [playerId, assessments])

  // Load conditionalMetrics when assessment selected
  useEffect(() => {
    if (!assessmentId) return
    const assessment = assessments.find(a => a.id === assessmentId)
    if (!assessment) return

    fetch('/api/conditional-metrics').then(r => r.json()).then((all: ConditionalMetricType[]) => {
      const filtered = assessment.conditionId
        ? all.filter(cm => cm.conditionId === assessment.conditionId)
        : all
      setConditionalMetrics(filtered)
    }).catch(() => setConditionalMetrics([]))
  }, [assessmentId, assessments])

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!assessmentId) return
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      assessmentId: String(assessmentId),
      configName,
      granularity
    })
    cmFilter.forEach(id => params.append('conditionalMetricIds', String(id)))

    try {
      const res = await fetch(`/api/reports/player-assessment?${params}`)
      if (!res.ok) {
        setError('Failed to load report data')
        return
      }
      setReportData(await res.json())
    } catch {
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, configName, granularity, cmFilter])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handlePlayerChange = (id: number | null) => {
    setPlayerId(id)
    setAssessmentId(null)
    setCmFilter([])
    setReportData(null)
  }

  const activeConfig = configs.find(c => c.name === configName)
  const activeConfigJson: ReportConfigJson = activeConfig?.config ?? {
    granularity: 'OVERALL',
    filters: { conditionalMetricIds: [] },
    panels: [{ type: 'bar', series: ['avg', 'min', 'max'] }]
  }

  const saveableConfig: ReportConfigJson = {
    ...activeConfigJson,
    granularity,
    filters: { conditionalMetricIds: cmFilter }
  }

  return (
    <div className='flex flex-col'>
      <ReportToolbar
        players={players}
        assessments={assessments}
        configs={configs}
        conditionalMetrics={conditionalMetrics}
        playerId={playerId}
        assessmentId={assessmentId}
        configName={configName}
        granularity={granularity}
        cmFilter={cmFilter}
        onPlayerChange={handlePlayerChange}
        onAssessmentChange={setAssessmentId}
        onConfigChange={setConfigName}
        onGranularityChange={setGranularity}
        onCmFilterChange={setCmFilter}
        onSaveConfig={() => setSaveDialogOpen(true)}
      />

      <div className='flex flex-col gap-4 p-4'>
        {error && <Alert severity='error'>{error}</Alert>}

        {!assessmentId && (
          <Card>
            <CardContent className='flex items-center justify-center' style={{ minHeight: 200 }}>
              <Typography color='text.secondary'>
                Select a player and assessment to load the report
              </Typography>
            </CardContent>
          </Card>
        )}

        {assessmentId && loading && (
          <div className='flex items-center justify-center' style={{ minHeight: 200 }}>
            <CircularProgress />
          </div>
        )}

        {assessmentId && !loading && reportData && reportData.rows.length === 0 && (
          <Card>
            <CardContent className='flex items-center justify-center' style={{ minHeight: 200 }}>
              <Typography color='text.secondary'>No session data recorded for this assessment yet</Typography>
            </CardContent>
          </Card>
        )}

        {assessmentId && !loading && reportData && reportData.rows.length > 0 &&
          activeConfigJson.panels.map((panel, i) => (
            <ReportPanel key={i} panel={panel} data={reportData} />
          ))
        }
      </div>

      <SaveConfigDialog
        open={saveDialogOpen}
        config={saveableConfig}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={entry => {
          setConfigs(prev => [...prev, entry])
          setConfigName(entry.name)
        }}
      />
    </div>
  )
}

export default PlayerAssessmentReportView
```

- [ ] **Step 4: Verify compilation**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Fix any type errors before continuing. Common issue: `conditionId` may not be on `AssessmentType` — check and add if missing.

---

## Task 8: Build the report page server component

**Files:**
- Create: `src/app/(dashboard)/report/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/report/page.tsx`**

```tsx
import PlayerAssessmentReportView from '@views/report/PlayerAssessmentReportView'

type Props = { searchParams: Promise<{ playerId?: string; assessmentId?: string }> }

const ReportPage = async ({ searchParams }: Props) => {
  const { playerId, assessmentId } = await searchParams

  return (
    <PlayerAssessmentReportView
      initialPlayerId={playerId ? Number(playerId) : null}
      initialAssessmentId={assessmentId ? Number(assessmentId) : null}
    />
  )
}

export default ReportPage
```

- [ ] **Step 2: Run dev server and open `/report`**

```bash
npm run dev
```

Open http://localhost:3000/report. Expected: page loads with toolbar showing "Select player…" dropdown. No console errors.

---

## Task 9: Add "Player Report" to sidebar navigation

**Files:**
- Modify: `src/components/layout/vertical/VerticalMenu.tsx`

- [ ] **Step 1: Read the current VerticalMenu to find the Players MenuItem**

Open `src/components/layout/vertical/VerticalMenu.tsx` and find the `<MenuItem>` for Players. Add a new `<MenuItem>` for "Player Report" after it (or in the Reports section if one exists).

- [ ] **Step 2: Add the menu item**

Find the Players `<MenuItem>` block and add after it:

```tsx
<MenuItem
  href='/report'
  icon={<i className='ri-bar-chart-2-line' />}
  exactMatch={false}
>
  Player Report
</MenuItem>
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000. Expected: "Player Report" appears in the sidebar. Clicking it navigates to `/report`.

---

## Task 10: Add "View Report" links to player, assessment, and session pages

**Files:**
- Modify: `src/app/(dashboard)/players/[id]/page.tsx`
- Modify: `src/app/(dashboard)/assessments/[id]/page.tsx`
- Modify: `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`

- [ ] **Step 1: Add "View Report" link to player detail page**

In `src/app/(dashboard)/players/[id]/page.tsx`, the page renders `PlayerReportView`. Add a `Link` to the report page in the player detail card. After the player info card in `PlayerReportView.tsx`, OR directly in the page, add:

In `src/app/(dashboard)/players/[id]/page.tsx`, after `return <PlayerReportView ...`, wrap in a fragment and add a link — or modify `PlayerReportView.tsx` to accept `playerId` and show a link. The simplest approach: add a "View Report" button to the server component JSX at the top of the returned fragment:

Replace the return in `src/app/(dashboard)/players/[id]/page.tsx`:

```tsx
return (
  <>
    <div className='flex justify-end mb-2'>
      <Link href={`/report?playerId=${id}`}>
        <Button variant='outlined' size='small' startIcon={<i className='ri-bar-chart-2-line' />}>
          View Report
        </Button>
      </Link>
    </div>
    <PlayerReportView player={player} teamName={teamName} metrics={metrics} />
  </>
)
```

Add the necessary imports at the top:
```tsx
import Link from 'next/link'
import Button from '@mui/material/Button'
```

- [ ] **Step 2: Add "View Report" link to assessment detail page**

In `src/app/(dashboard)/assessments/[id]/page.tsx`, after the assessment header Card, add:

```tsx
<div className='flex justify-end'>
  <Link href={`/report?playerId=${assessment.playerId}&assessmentId=${id}`}>
    <Button variant='outlined' size='small' startIcon={<i className='ri-bar-chart-2-line' />}>
      View Report
    </Button>
  </Link>
</div>
```

Add `import Link from 'next/link'` and `import Button from '@mui/material/Button'` if not already imported.

- [ ] **Step 3: Add "View Report" link to session detail page**

In `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`, read the existing page to find what assessment data is available. The session object has `assessmentId`. Find the player ID from the assessment.

Open the file and check what data is fetched. Add a "View Report" button that links to `/report?playerId={playerId}&assessmentId={session.assessmentId}`. Since `playerId` may need a separate fetch, and the session page may not currently load the assessment, keep it simple: link with just `assessmentId` if `playerId` is not readily available, or add a small fetch for the assessment.

If the session page already fetches the assessment:
```tsx
<Link href={`/report?playerId=${assessment.playerId}&assessmentId=${session.assessmentId}`}>
  <Button variant='outlined' size='small' startIcon={<i className='ri-bar-chart-2-line' />}>
    View Report
  </Button>
</Link>
```

If not, add a fetch for the assessment in the parallel `Promise.all` block and use `assessment.playerId`.

- [ ] **Step 4: Verify links in browser**

- Open a player detail page → "View Report" button visible, clicking navigates to `/report?playerId={id}` with player pre-selected
- Open an assessment detail page → "View Report" button visible, clicking navigates to `/report?playerId={x}&assessmentId={y}` with both pre-selected and report loading

---

## Task 11: Final verification

- [ ] **Step 1: Run lint**

```bash
npm run lint 2>&1 | grep -E "error|warning" | head -30
```

Fix any errors. Warnings are OK.

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: successful build, no type errors.

- [ ] **Step 3: Manual smoke test**

1. Open http://localhost:3000/report — blank state, player dropdown loads ✓
2. Select a player with multiple assessments — assessment dropdown populates ✓
3. Select an assessment — "Column Chart" config loads, bar + table panels render ✓
4. Switch granularity to "Per Session" — report re-fetches ✓
5. Open Metrics filter, deselect one metric — report re-fetches with filter ✓
6. Save Config with a name — new config appears in dropdown, auto-selected ✓
7. Navigate to a player page → click "View Report" — arrives at `/report?playerId=X`, player pre-selected ✓
8. Navigate to an assessment page → click "View Report" — arrives with both pre-selected, report loads ✓
9. Try saving with a duplicate name — inline error "Name already taken" ✓
