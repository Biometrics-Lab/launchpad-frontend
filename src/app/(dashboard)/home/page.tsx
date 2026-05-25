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
