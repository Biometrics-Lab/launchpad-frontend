export type AssessmentTemplateType = {
  id: number
  name: string
  sport: string
  description?: string
}

export type TemplateMetricType = {
  id: number
  templateId: number
  metricId: number
  sourceId: number
}
