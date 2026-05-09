export type ModelType = {
  id: number
  sport: string
  ageGroup: string
  description?: string
}

export type ModelMetricType = {
  id: number
  modelId: number
  metricId: number
  value?: number
}
