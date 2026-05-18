export type MeasurementType = {
  id: number
  name: string
}

export type AssessmentType = { id: number; playerId: number; sport: string; templateId: number; conditionId?: number }
export type SessionType = { id: number; assessmentId: number; startTime: string }
export type RepType = { id: number; session1Id: number; startTime: string }
export type AssessmentMetricType = { id: number; assessmentId: number; conditionalMetricId: number; sourceId: number; description?: string; minValue?: number; maxValue?: number; avgValue?: number; lastValue?: number }
export type SessionMetricType = { id: number; session1Id: number; conditionalMetricId: number; minValue?: number; maxValue?: number; avgValue?: number }
export type RepMetricType = { id: number; repId: number; conditionalMetricId: number; value?: number }
export type AssessmentResourceType = { id: number; assessmentId: number; type: string; url: string }
export type SessionResourceType = { id: number; session1Id: number; type: string; url: string }
export type RepResourceType = { id: number; repId: number; type: string; url: string }
export type RepMetricSourceType = { id: number; repMetricId: number; dataSourceId: number; description?: string }
