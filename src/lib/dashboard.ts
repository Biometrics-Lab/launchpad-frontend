import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { AssessmentType, SessionType } from '@/types/app/assessmentTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'
import type { DashboardKpi, PlayerAssessmentSummary, RecentPlayerEntry } from '@/types/app/dashboardTypes'

export function deriveKpi(
  players: PlayerType[],
  teams: TeamType[],
  assessments: AssessmentType[],
  sessions: SessionType[]
): DashboardKpi {
  return {
    playerCount: players.length,
    teamCount: teams.length,
    assessmentCount: assessments.length,
    activeSessionCount: sessions.filter(s => s.status === 'ACTIVE').length,
  }
}

export function deriveRecentPlayers(
  players: PlayerType[],
  teams: TeamType[],
  assessments: AssessmentType[],
  sessions: SessionType[],
  metricsMap: Map<number, PlayerMetricsResponse>
): RecentPlayerEntry[] {
  const teamMap = new Map(teams.map(t => [t.id, t.name]))

  const assessmentsByPlayer = new Map<number, AssessmentType[]>()
  for (const a of assessments) {
    const list = assessmentsByPlayer.get(a.playerId) ?? []
    list.push(a)
    assessmentsByPlayer.set(a.playerId, list)
  }

  const assessmentById = new Map(assessments.map(a => [a.id, a]))

  // Sort all COMPLETE sessions newest first
  const completeSessions = sessions
    .filter(s => s.status === 'COMPLETE')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  // Deduplicate to top 10 unique players by most recent COMPLETE session
  const seenPlayerIds = new Set<number>()
  const orderedPlayerIds: number[] = []
  const defaultSessionByPlayer = new Map<number, SessionType>()

  for (const session of completeSessions) {
    const assessment = assessmentById.get(session.assessmentId)
    if (!assessment) continue
    if (!seenPlayerIds.has(assessment.playerId)) {
      seenPlayerIds.add(assessment.playerId)
      orderedPlayerIds.push(assessment.playerId)
      defaultSessionByPlayer.set(assessment.playerId, session)
      if (orderedPlayerIds.length === 10) break
    }
  }

  return orderedPlayerIds
    .map(playerId => {
      const player = players.find(p => p.id === playerId)
      if (!player) return null

      const playerAssessments = assessmentsByPlayer.get(playerId) ?? []
      const playerMetrics = metricsMap.get(playerId)
      const defaultSession = defaultSessionByPlayer.get(playerId)!

      const assessmentSummaries: PlayerAssessmentSummary[] = playerAssessments
        .map(a => {
          const aSessions = sessions.filter(s => s.assessmentId === a.id)
          const latestComplete = aSessions
            .filter(s => s.status === 'COMPLETE')
            .sort((x, y) => new Date(y.startTime).getTime() - new Date(x.startTime).getTime())[0]

          return {
            assessmentId: a.id,
            sport: a.sport,
            lastSessionDate: latestComplete?.startTime ?? null,
            isActiveNow: aSessions.some(s => s.status === 'ACTIVE'),
            metrics: playerMetrics?.assessments.find(m => m.assessmentId === a.id)?.metrics ?? [],
          }
        })
        .sort((a, b) => {
          if (!a.lastSessionDate && !b.lastSessionDate) return 0
          if (!a.lastSessionDate) return 1
          if (!b.lastSessionDate) return -1
          return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime()
        })

      return {
        player,
        teamName: player.teamId ? (teamMap.get(player.teamId) ?? null) : null,
        hasActiveSession: assessmentSummaries.some(a => a.isActiveNow),
        assessments: assessmentSummaries,
        defaultOpenAssessmentId: defaultSession.assessmentId,
      }
    })
    .filter((e): e is RecentPlayerEntry => e !== null)
}

// ── UI helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#7c6af7', '#22c55e', '#f97316', '#3b82f6',
  '#c084fc', '#ef4444', '#14b8a6', '#f59e0b',
]

export function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

export function getInitials(name: string): string {
  const initials = name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return initials || '?'
}

const SPORT_EMOJI: Record<string, string> = {
  baseball: '⚾',
  softball: '🥎',
  pitching: '🥎',
  hitting: '⚾',
  fielding: '🎯',
  strength: '🏋️',
  speed: '🏃',
}

export function getSportEmoji(sport: string): string {
  return SPORT_EMOJI[sport.toLowerCase()] ?? '🏟️'
}

export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return 'no sessions'
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`
  return `${Math.floor(diffDays / 30)} mo ago`
}
