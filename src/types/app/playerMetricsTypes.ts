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
