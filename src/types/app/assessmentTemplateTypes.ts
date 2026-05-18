export type AssessmentTemplateType = {
  id: number
  name: string
  sport: string
  description?: string
  conditionId?: number
}

export type TemplateMetricType = {
  id: number
  templateId: number
  conditionalMetricId: number
  sourceId: number
  dataSourceId?: number
  description?: string
}
