# BL-54 Frontend: Player Metrics Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a player report page at `/players/[id]` and a dashboard home at `/home` that consume `GET /api/v1/players/{id}/metrics`.

**Architecture:** Server Components fetch data and pass it to presentational views. The player report view uses MUI Accordion (requires `'use client'`); the dashboard view is purely server-rendered. A new Next.js API proxy route handles the metrics endpoint. Types live in a new dedicated file.

**Tech Stack:** Next.js 15 (App Router, Server Components), MUI v6, TypeScript, Tailwind CSS, Remix Icons (`ri-*`)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/types/app/playerMetricsTypes.ts` | TypeScript types for metrics API response |
| Create | `src/app/api/players/[id]/metrics/route.ts` | Next.js API proxy → backend metrics endpoint |
| Create | `src/views/players/PlayerReportView.tsx` | Client Component — accordion layout for player report |
| Create | `src/app/(dashboard)/players/[id]/page.tsx` | Server Component — fetches data, renders PlayerReportView |
| Modify | `src/views/people/PlayersTable.tsx` | Make player name a link to `/players/[id]` |
| Create | `src/views/home/DashboardView.tsx` | Presentational component — player metric cards grid |
| Modify | `src/app/(dashboard)/home/page.tsx` | Replace placeholder, fetch all player metrics, render DashboardView |

---

## Task 1: TypeScript types

**Files:**
- Create: `src/types/app/playerMetricsTypes.ts`

- [ ] **Create the types file**

```ts
// src/types/app/playerMetricsTypes.ts
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

- [ ] **Commit**

```bash
git add src/types/app/playerMetricsTypes.ts
git commit -m "[BL-54] Add PlayerMetricsResponse TypeScript types"
```

---

## Task 2: API proxy route

**Files:**
- Create: `src/app/api/players/[id]/metrics/route.ts`

- [ ] **Create the route file**

```ts
// src/app/api/players/[id]/metrics/route.ts
import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/players/${id}/metrics`, { headers: HEADERS, cache: 'no-store' })

  return NextResponse.json(await res.json(), { status: res.status })
}
```

- [ ] **Commit**

```bash
git add src/app/api/players/[id]/metrics/route.ts
git commit -m "[BL-54] Add API proxy route for player metrics"
```

---

## Task 3: PlayerReportView component

**Files:**
- Create: `src/views/players/PlayerReportView.tsx`

This is a `'use client'` component because MUI Accordion manages expand/collapse state internally and requires browser APIs.

The `MetricGrid` sub-component is defined in the same file — it is used in both the Overall section and inside each Accordion details panel.

`fmt` helper: returns the number as-is, or `'N/A'` for null.

- [ ] **Create the view file**

```tsx
// src/views/players/PlayerReportView.tsx
'use client'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

import type { PlayerType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse, PlayerMetricEntry } from '@/types/app/playerMetricsTypes'

type Props = {
  player: PlayerType
  teamName: string | null
  metrics: PlayerMetricsResponse
}

const fmt = (v: number | null): string => (v === null ? 'N/A' : String(v))

const MetricGrid = ({ entries }: { entries: PlayerMetricEntry[] }) => (
  <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
    {entries.map(m => (
      <Card key={m.conditionalMetricId} variant='outlined'>
        <CardContent className='flex flex-col gap-1 !p-3'>
          <Typography variant='caption' color='text.secondary' className='uppercase tracking-wide'>
            {m.name}
          </Typography>
          <Typography variant='h5' color='primary'>
            {fmt(m.avgValue)}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            min {fmt(m.minValue)} · max {fmt(m.maxValue)}
          </Typography>
        </CardContent>
      </Card>
    ))}
  </div>
)

const PlayerReportView = ({ player, teamName, metrics }: Props) => (
  <div className='flex flex-col gap-6'>
    <Link href='/players' className='flex items-center gap-1 text-primary w-fit'>
      <i className='ri-arrow-left-s-line text-xl' />
      <Typography color='primary'>Players</Typography>
    </Link>
    <Card>
      <CardContent className='flex flex-col gap-2'>
        <Typography variant='h5'>{player.name}</Typography>
        <Typography color='text.secondary'>
          {teamName ?? '—'} · Class of {player.graduationYear}
          {player.dob ? ` · ${player.dob}` : ''}
        </Typography>
      </CardContent>
    </Card>
    <div className='flex flex-col gap-4'>
      <Typography variant='h6'>Overall</Typography>
      {metrics.overall.length === 0 ? (
        <Typography color='text.secondary'>No metrics recorded yet</Typography>
      ) : (
        <MetricGrid entries={metrics.overall} />
      )}
    </div>
    <div className='flex flex-col gap-4'>
      <Typography variant='h6'>Assessments</Typography>
      {metrics.assessments.length === 0 ? (
        <Typography color='text.secondary'>No assessments recorded yet</Typography>
      ) : (
        metrics.assessments.map(a => (
          <Accordion key={a.assessmentId}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <Typography>Assessment #{a.assessmentId} · {a.sport}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MetricGrid entries={a.metrics} />
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </div>
  </div>
)

export default PlayerReportView
```

- [ ] **Commit**

```bash
git add src/views/players/PlayerReportView.tsx
git commit -m "[BL-54] Add PlayerReportView with accordion layout"
```

---

## Task 4: Player report page (Server Component)

**Files:**
- Create: `src/app/(dashboard)/players/[id]/page.tsx`

Note: the `(dashboard)` group uses parentheses — this is a Next.js route group, not a directory name in the URL.

The page fetches player info (404 if not found), metrics, and teams in parallel. It resolves the team name before passing to the view.

- [ ] **Create the page file**

```tsx
// src/app/(dashboard)/players/[id]/page.tsx
import { notFound } from 'next/navigation'

import PlayerReportView from '@views/players/PlayerReportView'
import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : fallback
  } catch { return fallback }
}

type Props = { params: Promise<{ id: string }> }

const emptyMetrics: PlayerMetricsResponse = { overall: [], assessments: [] }

const PlayerReportPage = async ({ params }: Props) => {
  const { id } = await params

  const [player, metrics, teams] = await Promise.all([
    fetchJson<PlayerType | null>(`${API_BASE}/players/${id}`, null),
    fetchJson<PlayerMetricsResponse>(`${API_BASE}/players/${id}/metrics`, emptyMetrics),
    fetchJson<TeamType[]>(`${API_BASE}/teams`, [])
  ])

  if (!player) notFound()

  const teamName = player.teamId ? (teams.find(t => t.id === player.teamId)?.name ?? null) : null

  return <PlayerReportView player={player} teamName={teamName} metrics={metrics} />
}

export default PlayerReportPage
```

- [ ] **Commit**

```bash
git add src/app/(dashboard)/players/[id]/page.tsx
git commit -m "[BL-54] Add player report page at /players/[id]"
```

---

## Task 5: Player name as link in PlayersTable

**Files:**
- Modify: `src/views/people/PlayersTable.tsx`

The `name` column cell currently renders a plain `<Typography>`. Change it to a `<Link>` wrapping a `<Typography>` so clicking a player name navigates to their report page.

- [ ] **Add the Link import at the top of the file** (after the existing React/MUI imports):

```tsx
import Link from 'next/link'
```

- [ ] **Update the `name` column cell** (find the existing `columnHelper.accessor('name', ...)` block and replace its `cell` function):

```tsx
columnHelper.accessor('name', {
  header: 'Name',
  cell: ({ row }) => (
    <Link href={`/players/${row.original.id}`}>
      <Typography color='primary' className='font-medium'>
        {row.original.name}
      </Typography>
    </Link>
  )
}),
```

- [ ] **Commit**

```bash
git add src/views/people/PlayersTable.tsx
git commit -m "[BL-54] Make player name a link to player report page"
```

---

## Task 6: DashboardView component

**Files:**
- Create: `src/views/home/DashboardView.tsx`

This is a pure Server Component (no `'use client'` — no browser interactions needed). It receives pre-fetched data and renders a grid of player cards.

Each card shows: player name (linked to report), team + grad year subtitle, then for each metric in `overall`: metric name label, then min/max/avg on one line with avg highlighted in primary color.

- [ ] **Create the view file**

```tsx
// src/views/home/DashboardView.tsx
import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'

type PlayerWithMetrics = {
  player: PlayerType
  metrics: PlayerMetricsResponse
}

type Props = {
  players: PlayerWithMetrics[]
  teams: TeamType[]
}

const fmt = (v: number | null): string => (v === null ? 'N/A' : String(v))

const DashboardView = ({ players, teams }: Props) => {
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]))

  if (players.length === 0) {
    return <Typography color='text.secondary'>No players found</Typography>
  }

  return (
    <div className='flex flex-col gap-6'>
      <Typography variant='h4'>Dashboard</Typography>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {players.map(({ player, metrics }) => (
          <Card key={player.id}>
            <CardContent className='flex flex-col gap-3'>
              <div>
                <Link href={`/players/${player.id}`}>
                  <Typography color='primary' className='font-medium'>
                    {player.name}
                  </Typography>
                </Link>
                <Typography variant='caption' color='text.secondary'>
                  {player.teamId ? (teamMap[player.teamId] ?? '—') : '—'} · Class of {player.graduationYear}
                </Typography>
              </div>
              {metrics.overall.length === 0 ? (
                <Typography variant='caption' color='text.secondary'>
                  No metrics recorded yet
                </Typography>
              ) : (
                <div className='flex flex-col gap-2'>
                  {metrics.overall.map(m => (
                    <div key={m.conditionalMetricId}>
                      <Typography variant='caption' color='text.secondary' className='uppercase tracking-wide block'>
                        {m.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        min {fmt(m.minValue)}{'  '}max {fmt(m.maxValue)}{'  '}
                        <Typography component='span' color='primary' variant='body2' className='font-semibold'>
                          avg {fmt(m.avgValue)}
                        </Typography>
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DashboardView
```

- [ ] **Commit**

```bash
git add src/views/home/DashboardView.tsx
git commit -m "[BL-54] Add DashboardView with player metric cards"
```

---

## Task 7: Dashboard home page (Server Component)

**Files:**
- Modify: `src/app/(dashboard)/home/page.tsx`

Replace the placeholder. Fetch all players and teams first, then fetch metrics for every player in parallel via `Promise.all`.

- [ ] **Replace the entire file contents**

```tsx
// src/app/(dashboard)/home/page.tsx
import DashboardView from '@views/home/DashboardView'
import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : fallback
  } catch { return fallback }
}

const emptyMetrics: PlayerMetricsResponse = { overall: [], assessments: [] }

const DashboardPage = async () => {
  const [players, teams] = await Promise.all([
    fetchJson<PlayerType[]>(`${API_BASE}/players`, []),
    fetchJson<TeamType[]>(`${API_BASE}/teams`, [])
  ])

  const playerMetrics = await Promise.all(
    players.map(p => fetchJson<PlayerMetricsResponse>(`${API_BASE}/players/${p.id}/metrics`, emptyMetrics))
  )

  const playersWithMetrics = players.map((p, i) => ({ player: p, metrics: playerMetrics[i] }))

  return <DashboardView players={playersWithMetrics} teams={teams} />
}

export default DashboardPage
```

- [ ] **Lint**

```bash
npm run lint
```

Expected: no errors or warnings (fix any that appear before committing).

- [ ] **Commit**

```bash
git add src/app/(dashboard)/home/page.tsx
git commit -m "[BL-54] Implement dashboard home with player metric cards"
```

---

## Task 8: Visual verification

- [ ] **Start the dev server**

```bash
npm run dev
```

- [ ] **Check dashboard home** — open `http://localhost:3000/home`
  - Should show a grid of player cards
  - Each card: player name (linked), team + grad year subtitle, metrics with min/max/avg
  - Players with no metrics: "No metrics recorded yet"
  - No players at all: "No players found"

- [ ] **Check player name link** — open `http://localhost:3000/players`
  - Player names should appear in primary color and be clickable
  - Clicking should navigate to `/players/{id}`

- [ ] **Check player report page** — click a player name
  - Back link to `/players` at top
  - Player header card with name, team, grad year
  - Overall section with metric cards (avg large, min/max small)
  - Assessments accordion — each section expands/collapses
  - Null values display as `N/A`

- [ ] **Check 404** — open `http://localhost:3000/players/99999`
  - Should render the 404 page (Next.js default or custom)

- [ ] **Final lint**

```bash
npm run lint
```

Expected: no errors.
