export type ConditionType = {
  id: number
  name: string
  sport?: string
  templateId?: number
}

export type ConditionalMetricType = {
  id: number
  name: string
  conditionId: number
  metricId: number
}
