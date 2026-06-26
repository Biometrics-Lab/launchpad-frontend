import DashboardView from '@views/home/DashboardView'
import { deriveKpi, deriveRecentPlayers } from '@/lib/dashboard'
import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { AssessmentType, SessionType } from '@/types/app/assessmentTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? ((await res.json()) as T) : fallback
  } catch {
    return fallback
  }
}

const DashboardPage = async () => {
  // Batch 1: base data (4 parallel requests)
  const [players, teams, assessments, sessions] = await Promise.all([
    fetchJson<PlayerType[]>(`${API_BASE}/players`, []),
    fetchJson<TeamType[]>(`${API_BASE}/teams`, []),
    fetchJson<AssessmentType[]>(`${API_BASE}/assessments`, []),
    fetchJson<SessionType[]>(`${API_BASE}/sessions`, []),
  ])

  const kpi = deriveKpi(players, teams, assessments, sessions)

  // Identify the top 10 player IDs (same dedup logic as deriveRecentPlayers)
  const assessmentById = new Map(assessments.map(a => [a.id, a]))
  const seenPlayerIds = new Set<number>()
  const top10PlayerIds: number[] = []

  for (const session of [...sessions]
    .filter(s => s.status === 'COMPLETE')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())) {
    const assessment = assessmentById.get(session.assessmentId)
    if (!assessment) continue
    if (!seenPlayerIds.has(assessment.playerId)) {
      seenPlayerIds.add(assessment.playerId)
      top10PlayerIds.push(assessment.playerId)
      if (top10PlayerIds.length === 10) break
    }
  }

  // Batch 2: metrics for top 10 only (parallel)
  const metricsResults = await Promise.all(
    top10PlayerIds.map(id =>
      fetchJson<PlayerMetricsResponse>(
        `${API_BASE}/players/${id}/metrics`,
        { overall: [], assessments: [] }
      )
    )
  )

  const metricsMap = new Map<number, PlayerMetricsResponse>(
    top10PlayerIds.map((id, i) => [id, metricsResults[i]])
  )

  const entries = deriveRecentPlayers(players, teams, assessments, sessions, metricsMap)

  return <DashboardView kpi={kpi} entries={entries} />
}

export default DashboardPage
