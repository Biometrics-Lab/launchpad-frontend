# Active Session UI (BL-56) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated Active Session page with live WebSocket rep delivery, video playback, metric cards, and rep history.

**Architecture:** A server component fetches initial data and guards session status, then hands off to a client `ActiveSessionView` that owns all live state. Three panels (rep list / video / metrics) receive state as props and call back to the view. Two custom hooks isolate WebSocket and polling logic.

**Tech Stack:** Next.js 15, MUI v6, `@stomp/stompjs` + `sockjs-client` for STOMP over WebSocket, TypeScript, Tailwind utility classes.

---

## File Map

### Created
- `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/active/page.tsx` — server component: data fetching, status guard, prop assembly
- `src/views/sessions/active/ActiveSessionView.tsx` — client root: all state, composes panels
- `src/views/sessions/active/RepListPanel.tsx` — left column: rep history list
- `src/views/sessions/active/VideoPanel.tsx` — center column: video player + source switcher
- `src/views/sessions/active/MetricsPanel.tsx` — right column: metric cards
- `src/views/sessions/active/useSessionWebSocket.ts` — STOMP connection hook
- `src/views/sessions/active/useResourcePoller.ts` — resource polling hook
- `src/app/api/sessions/[id]/reps/route.ts` — proxy: GET /api/v1/sessions/{id}/reps
- `src/app/api/reps/[id]/resources/route.ts` — proxy: GET /api/v1/reps/{id}/resources

### Modified
- `src/types/app/assessmentTypes.ts` — add `RepBroadcastDto`, `RepMetricBroadcastData`, `RepResourceBroadcastData`
- `src/views/sessions/SessionStartStopButtons.tsx` — add `assessmentId` prop; Start → navigate to /active; ACTIVE → add "Go Live" button
- `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx` — pass `assessmentId` to `SessionStartStopButtons`

---

## Task 1: Install WebSocket packages

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('@stomp/stompjs'); require('sockjs-client'); console.log('OK')"
```

Expected output: `OK`

---

## Task 2: Add new types

**Files:**
- Modify: `src/types/app/assessmentTypes.ts`

- [ ] **Step 1: Append types to `assessmentTypes.ts`**

Add at the end of the file:

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
  status: UrlStatus
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Add API proxy routes

**Files:**
- Create: `src/app/api/sessions/[id]/reps/route.ts`
- Create: `src/app/api/reps/[id]/resources/route.ts`

- [ ] **Step 1: Create `src/app/api/sessions/[id]/reps/route.ts`**

```typescript
import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/sessions/${id}/reps`, { headers: { Authorization: AUTH } })
  const body = await res.json().catch(() => [])
  return NextResponse.json(body, { status: res.status })
}
```

- [ ] **Step 2: Create `src/app/api/reps/[id]/resources/route.ts`**

```typescript
import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/reps/${id}/resources`, { headers: { Authorization: AUTH } })
  const body = await res.json().catch(() => [])
  return NextResponse.json(body, { status: res.status })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Modify SessionStartStopButtons

**Files:**
- Modify: `src/views/sessions/SessionStartStopButtons.tsx`
- Modify: `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`

- [ ] **Step 1: Replace `src/views/sessions/SessionStartStopButtons.tsx`**

```typescript
'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

type Props = {
  sessionId: number
  assessmentId: number
  initialStatus: string | null | undefined
}

const SessionStartStopButtons = ({ sessionId, assessmentId, initialStatus }: Props) => {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' })
      if (res.ok) {
        router.push(`/assessments/${assessmentId}/sessions/${sessionId}/active`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? 'Failed to start session')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? 'Failed to stop session')
      }
    } finally {
      setLoading(false)
    }
  }

  if (status === 'COMPLETE') return null

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex gap-2'>
        {!status && (
          <Button variant='contained' color='success' size='small' disabled={loading} onClick={handleStart}>
            {loading ? 'Starting…' : 'Start Session'}
          </Button>
        )}
        {status === 'ACTIVE' && (
          <>
            <Button
              variant='contained'
              color='primary'
              size='small'
              onClick={() => router.push(`/assessments/${assessmentId}/sessions/${sessionId}/active`)}
            >
              Go Live
            </Button>
            <Button variant='contained' color='error' size='small' disabled={loading} onClick={handleStop}>
              {loading ? 'Stopping…' : 'Stop Session'}
            </Button>
          </>
        )}
      </div>
      {error && <Typography variant='caption' color='error'>{error}</Typography>}
    </div>
  )
}

export default SessionStartStopButtons
```

- [ ] **Step 2: Update session detail page to pass `assessmentId`**

In `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`, find the `SessionStartStopButtons` usage and add `assessmentId`:

Old:
```typescript
<SessionStartStopButtons sessionId={numericSessionId} initialStatus={session.status} />
```

New:
```typescript
<SessionStartStopButtons sessionId={numericSessionId} assessmentId={Number(id)} initialStatus={session.status} />
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 5: useSessionWebSocket hook

**Files:**
- Create: `src/views/sessions/active/useSessionWebSocket.ts`

- [ ] **Step 1: Create hook**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

import type { RepBroadcastDto } from '@/types/app/assessmentTypes'

type Options = {
  sessionId: number
  onRep: (rep: RepBroadcastDto) => void
}

export function useSessionWebSocket({ sessionId, onRep }: Options) {
  const [connected, setConnected] = useState(false)
  const onRepRef = useRef(onRep)
  onRepRef.current = onRep

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/session/${sessionId}/reps`, message => {
          const rep: RepBroadcastDto = JSON.parse(message.body)
          onRepRef.current(rep)
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    })
    client.activate()
    return () => { client.deactivate() }
  }, [sessionId])

  return { connected }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 6: useResourcePoller hook

**Files:**
- Create: `src/views/sessions/active/useResourcePoller.ts`

The polling endpoint returns `RepResourceType` (with field `urlStatus`). This hook maps it to `RepResourceBroadcastData` (with field `status`).

- [ ] **Step 1: Create hook**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

import type { RepResourceBroadcastData, RepResourceType } from '@/types/app/assessmentTypes'

function mapResource(r: RepResourceType): RepResourceBroadcastData {
  return { id: r.id, type: r.type, url: r.url, status: r.urlStatus ?? 'PENDING' }
}

function allDone(resources: RepResourceBroadcastData[]): boolean {
  return resources.every(r => r.status === 'READY' || r.status === 'FAILED')
}

export function useResourcePoller(
  repId: number | null,
  initialResources: RepResourceBroadcastData[]
) {
  const [resources, setResources] = useState<RepResourceBroadcastData[]>(initialResources)
  const resourcesRef = useRef(resources)

  useEffect(() => {
    setResources(initialResources)
    resourcesRef.current = initialResources
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repId])

  useEffect(() => {
    if (repId === null || allDone(resourcesRef.current)) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reps/${repId}/resources`)
        if (!res.ok) return
        const data: RepResourceType[] = await res.json()
        const mapped = data.map(mapResource)
        resourcesRef.current = mapped
        setResources(mapped)
        if (allDone(mapped)) clearInterval(interval)
      } catch { /* network error — keep polling */ }
    }, 3000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repId])

  return resources
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 7: MetricsPanel

**Files:**
- Create: `src/views/sessions/active/MetricsPanel.tsx`

- [ ] **Step 1: Create component**

```typescript
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

import CustomAvatar from '@core/components/mui/Avatar'
import type { ThemeColor } from '@core/types'

import type { RepMetricBroadcastData } from '@/types/app/assessmentTypes'

const COLORS: ThemeColor[] = ['primary', 'success', 'warning', 'error', 'secondary']

const ICONS = [
  'ri-speed-line',
  'ri-angle-line',
  'ri-map-pin-range-line',
  'ri-rotate-lock-line',
  'ri-dashboard-line',
]

type ExpectedMetric = { conditionalMetricId: number; name: string }

type Props = {
  expectedMetrics: ExpectedMetric[]
  currentRepMetrics: RepMetricBroadcastData[]
}

const MetricsPanel = ({ expectedMetrics, currentRepMetrics }: Props) => {
  const valueMap = new Map(currentRepMetrics.map(m => [m.conditionalMetricId, m.value]))

  return (
    <Card className='h-full'>
      <CardHeader title='Metrics' />
      <CardContent className='flex flex-col gap-4'>
        {expectedMetrics.length === 0 && (
          <Typography color='text.secondary' variant='body2'>
            Metrics will appear after the first rep
          </Typography>
        )}
        {expectedMetrics.map((metric, index) => {
          const rawValue = valueMap.get(metric.conditionalMetricId)
          const display = rawValue !== undefined && rawValue !== null ? String(rawValue) : '—'
          const color = COLORS[index % COLORS.length]
          const icon = ICONS[index % ICONS.length]

          return (
            <div key={metric.conditionalMetricId} className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color={color}>
                <i className={icon} />
              </CustomAvatar>
              <div>
                <Typography variant='h5' color={`${color}.main`}>
                  {display}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {metric.name}
                </Typography>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default MetricsPanel
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 8: VideoPanel

**Files:**
- Create: `src/views/sessions/active/VideoPanel.tsx`

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useRef, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import type { RepResourceBroadcastData } from '@/types/app/assessmentTypes'

type Props = {
  resources: RepResourceBroadcastData[]
  selectedVideoType: string | null
  onVideoTypeChange: (type: string) => void
}

function videoResources(resources: RepResourceBroadcastData[]) {
  return resources.filter(r => r.type.toUpperCase().includes('VIDEO'))
}

const VideoPanel = ({ resources, selectedVideoType, onVideoTypeChange }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videos = videoResources(resources)

  const active = selectedVideoType
    ? (videos.find(r => r.type === selectedVideoType) ?? videos[0])
    : videos[0]

  useEffect(() => {
    if (videoRef.current && active?.status === 'READY') {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [active?.url, active?.status])

  const renderContent = () => {
    if (!active) {
      return (
        <div className='flex flex-col items-center justify-center gap-2 min-h-48 text-textSecondary'>
          <i className='ri-video-off-line text-4xl' />
          <Typography variant='body2' color='text.secondary'>No video for this rep</Typography>
        </div>
      )
    }
    if (active.status === 'PENDING') {
      return (
        <div className='flex flex-col items-center justify-center gap-2 min-h-48'>
          <CircularProgress size={40} />
          <Typography variant='body2' color='text.secondary'>Processing video…</Typography>
        </div>
      )
    }
    if (active.status === 'FAILED') {
      return (
        <div className='flex flex-col items-center justify-center gap-2 min-h-48 text-textSecondary'>
          <i className='ri-video-off-line text-4xl' />
          <Typography variant='body2' color='text.secondary'>Video unavailable</Typography>
        </div>
      )
    }
    return (
      <video ref={videoRef} autoPlay muted loop style={{ width: '100%', display: 'block' }}>
        <source src={active.url} />
      </video>
    )
  }

  return (
    <Card className='h-full'>
      <CardHeader
        title='Video'
        action={
          videos.length > 1 ? (
            <ToggleButtonGroup
              size='small'
              exclusive
              value={selectedVideoType ?? videos[0]?.type ?? null}
              onChange={(_, val) => val && onVideoTypeChange(val)}
            >
              {videos.map(r => (
                <ToggleButton key={r.type} value={r.type}>
                  {r.type}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : null
        }
      />
      <CardContent className='p-0'>{renderContent()}</CardContent>
    </Card>
  )
}

export default VideoPanel
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 9: RepListPanel

**Files:**
- Create: `src/views/sessions/active/RepListPanel.tsx`

Newest rep is shown at the top of the list (reversed order). The current rep row gets a `primary` tonal chip and a left border accent.

- [ ] **Step 1: Create component**

```typescript
'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

import type { RepBroadcastDto } from '@/types/app/assessmentTypes'

type Props = {
  reps: RepBroadcastDto[]
  currentRepId: number | null
  onRepSelect: (repId: number) => void
}

const RepListPanel = ({ reps, currentRepId, onRepSelect }: Props) => {
  const reversed = [...reps].reverse()

  return (
    <Card className='h-full'>
      <CardHeader title={`Reps · ${reps.length}`} />
      {reps.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 pbs-4 pbe-6'>
          <CircularProgress size={24} />
          <Typography variant='body2' color='text.secondary'>
            Waiting for first rep…
          </Typography>
        </div>
      ) : (
        <List dense disablePadding>
          {reversed.map(rep => {
            const isCurrent = rep.id === currentRepId
            const firstMetric = rep.metrics[0]

            return (
              <ListItemButton
                key={rep.id}
                selected={isCurrent}
                onClick={() => onRepSelect(rep.id)}
                sx={isCurrent ? { borderLeft: '3px solid', borderColor: 'primary.main' } : {}}
              >
                <ListItemText
                  primary={
                    <div className='flex items-center justify-between gap-2'>
                      <Typography variant='body2' fontWeight={isCurrent ? 600 : 400}>
                        Rep {rep.repNumber ?? rep.id}
                      </Typography>
                      {isCurrent && (
                        <Chip label='current' variant='tonal' color='primary' size='small' />
                      )}
                    </div>
                  }
                  secondary={
                    firstMetric
                      ? `${firstMetric.name}: ${firstMetric.value ?? '—'}`
                      : undefined
                  }
                />
              </ListItemButton>
            )
          })}
        </List>
      )}
    </Card>
  )
}

export default RepListPanel
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 10: ActiveSessionView

**Files:**
- Create: `src/views/sessions/active/ActiveSessionView.tsx`

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useState, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import MetricsPanel from './MetricsPanel'
import RepListPanel from './RepListPanel'
import VideoPanel from './VideoPanel'
import { useResourcePoller } from './useResourcePoller'
import { useSessionWebSocket } from './useSessionWebSocket'
import type { RepBroadcastDto, RepMetricBroadcastData } from '@/types/app/assessmentTypes'

type ExpectedMetric = { conditionalMetricId: number; name: string }

type Props = {
  sessionId: number
  assessmentId: number
  playerName: string
  templateName: string
  conditionName: string | null
  initialReps: RepBroadcastDto[]
  expectedMetrics: ExpectedMetric[]
}

const ActiveSessionView = ({
  sessionId,
  assessmentId,
  playerName,
  templateName,
  conditionName,
  initialReps,
  expectedMetrics,
}: Props) => {
  const router = useRouter()
  const [reps, setReps] = useState<RepBroadcastDto[]>(initialReps)
  const [currentRepId, setCurrentRepId] = useState<number | null>(initialReps.at(-1)?.id ?? null)
  const [selectedVideoType, setSelectedVideoType] = useState<string | null>(null)
  const [stopping, setStopping] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)

  const handleRep = useCallback((rep: RepBroadcastDto) => {
    setReps(prev => [...prev, rep])
    setCurrentRepId(rep.id)
  }, [])

  const { connected } = useSessionWebSocket({ sessionId, onRep: handleRep })

  const currentRep = reps.find(r => r.id === currentRepId) ?? null
  const polledResources = useResourcePoller(currentRepId, currentRep?.resources ?? [])
  const currentMetrics: RepMetricBroadcastData[] = currentRep?.metrics ?? []

  const handleStop = async () => {
    setStopping(true)
    setStopError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' })
      if (res.ok) {
        router.push(`/assessments/${assessmentId}/sessions/${sessionId}`)
      } else {
        const data = await res.json().catch(() => ({}))
        setStopError(data.message ?? 'Failed to stop session')
      }
    } finally {
      setStopping(false)
    }
  }

  const subtitle = [conditionName, templateName].filter(Boolean).join(' · ')

  return (
    <div className='flex flex-col gap-6'>
      {!connected && (
        <Alert severity='warning'>Live connection lost — reps may be delayed</Alert>
      )}

      <Card>
        <CardContent>
          <div className='flex items-start justify-between flex-wrap gap-4'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2 flex-wrap'>
                <Typography variant='h5'>{playerName}</Typography>
                {subtitle && (
                  <Typography color='text.secondary'>· {subtitle}</Typography>
                )}
                <Chip label='ACTIVE' variant='tonal' color='success' size='small' />
              </div>
              <Typography variant='body2' color='text.secondary'>
                Session #{sessionId} · Assessment #{assessmentId}
              </Typography>
            </div>
            <div className='flex flex-col items-end gap-1'>
              <Button
                variant='contained'
                color='error'
                startIcon={
                  stopping
                    ? <CircularProgress size={16} color='inherit' />
                    : <i className='ri-stop-circle-line' />
                }
                disabled={stopping}
                onClick={handleStop}
              >
                Stop Session
              </Button>
              {stopError && (
                <Typography variant='caption' color='error'>{stopError}</Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Grid container spacing={6} className='items-start'>
        <Grid size={{ xs: 12, md: 3 }}>
          <RepListPanel
            reps={reps}
            currentRepId={currentRepId}
            onRepSelect={setCurrentRepId}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <VideoPanel
            resources={polledResources}
            selectedVideoType={selectedVideoType}
            onVideoTypeChange={setSelectedVideoType}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricsPanel
            expectedMetrics={expectedMetrics}
            currentRepMetrics={currentMetrics}
          />
        </Grid>
      </Grid>
    </div>
  )
}

export default ActiveSessionView
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 11: Active Session page.tsx

**Files:**
- Create: `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/active/page.tsx`

- [ ] **Step 1: Create page**

```typescript
import { notFound, redirect } from 'next/navigation'

import ActiveSessionView from '@views/sessions/active/ActiveSessionView'
import type { AssessmentMetricType, AssessmentType, RepBroadcastDto, SessionType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { ConditionType, ConditionalMetricType } from '@/types/app/conditionTypes'
import type { PlayerType } from '@/types/app/playersTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : fallback
  } catch { return fallback }
}

type Props = { params: Promise<{ id: string; sessionId: string }> }

const ActiveSessionPage = async ({ params }: Props) => {
  const { id, sessionId } = await params

  const session = await fetchJson<SessionType | null>(`${API_BASE}/sessions/${sessionId}`, null)
  if (!session) notFound()
  if (session.status !== 'ACTIVE') redirect(`/assessments/${id}/sessions/${sessionId}`)

  const assessment = await fetchJson<AssessmentType | null>(`${API_BASE}/assessments/${id}`, null)
  if (!assessment) notFound()

  const [player, template, condition, initialReps, allAssessmentMetrics, allConditionalMetrics] =
    await Promise.all([
      fetchJson<PlayerType | null>(`${API_BASE}/players/${assessment.playerId}`, null),
      fetchJson<AssessmentTemplateType | null>(`${API_BASE}/assessmentTemplates/${assessment.templateId}`, null),
      assessment.conditionId
        ? fetchJson<ConditionType | null>(`${API_BASE}/conditions/${assessment.conditionId}`, null)
        : Promise.resolve(null),
      fetchJson<RepBroadcastDto[]>(`${API_BASE}/sessions/${sessionId}/reps`, []),
      fetchJson<AssessmentMetricType[]>(`${API_BASE}/assessmentMetrics`, []),
      fetchJson<ConditionalMetricType[]>(`${API_BASE}/conditionalMetrics`, []),
    ])

  const metricIds = new Set(
    allAssessmentMetrics
      .filter(am => am.assessmentId === Number(id))
      .map(am => am.conditionalMetricId)
  )

  const expectedMetrics = allConditionalMetrics
    .filter(cm => metricIds.has(cm.id))
    .map(cm => ({ conditionalMetricId: cm.id, name: cm.name }))

  return (
    <ActiveSessionView
      sessionId={Number(sessionId)}
      assessmentId={Number(id)}
      playerName={player?.name ?? `Player #${assessment.playerId}`}
      templateName={template?.name ?? `Template #${assessment.templateId}`}
      conditionName={condition?.name ?? null}
      initialReps={initialReps}
      expectedMetrics={expectedMetrics}
    />
  )
}

export default ActiveSessionPage
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run dev server and verify end-to-end**

```bash
npm run dev
```

1. Navigate to any session detail page
2. If session is not started: click "Start Session" → should navigate to `/active` route
3. If session is already ACTIVE: "Go Live" button appears → click → opens active page
4. Verify header shows player name, condition, template name, session/assessment IDs
5. Verify metric cards show with `—` values before first rep
6. Trigger a mock integration rep (via backend) → verify rep appears in list, metrics populate, video appears or spins
7. Click a past rep in the list → metrics and video switch to that rep
8. New rep arrives → auto-jumps back to newest
9. If rep has video resource: verify it auto-plays when READY, loops
10. If >1 video resource: verify source switcher appears and persists selection
11. Click "Stop Session" → navigates back to session detail

---

## Self-Review Notes

- All types used in later tasks match definitions from Task 2 ✅
- `useResourcePoller` correctly maps `urlStatus → status` ✅
- `RepListPanel` shows newest rep first (reversed) — no auto-scroll needed since newest is always at top ✅
- `VideoPanel` falls back to first video resource if `selectedVideoType` not found in current rep ✅
- `page.tsx` redirects to session detail if session is not ACTIVE ✅
- `assessmentMetrics` filtered client-side by `assessmentId` (no query param on backend) ✅
- `SessionStartStopButtons` keeps existing Stop behaviour on session detail page, adds Go Live for ACTIVE ✅
