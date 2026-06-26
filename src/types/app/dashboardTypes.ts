import type { PlayerType } from '@/types/app/playersTypes'
import type { PlayerMetricEntry } from '@/types/app/playerMetricsTypes'

export type DashboardKpi = {
  playerCount: number
  teamCount: number
  assessmentCount: number
  activeSessionCount: number
}

export type PlayerAssessmentSummary = {
  assessmentId: number
  sport: string
  lastSessionDate: string | null
  isActiveNow: boolean
  metrics: PlayerMetricEntry[]
}

export type RecentPlayerEntry = {
  player: PlayerType
  teamName: string | null
  hasActiveSession: boolean
  assessments: PlayerAssessmentSummary[]
  defaultOpenAssessmentId: number
}
