export type MeasurementType = {
  id: number
  name: string
}

export type AssessmentType = { id: number; playerId: number; sport: string; templateId: number }
export type SessionType = { id: number; assessmentId: number; startTime: string }
export type RepType = { id: number; session1Id: number; startTime: string }
export type AssessmentMetricType = { id: number; assessmentId: number; metricId: number; sourceId: number; minValue?: number; maxValue?: number; avgValue?: number; lastValue?: number }
export type SessionMetricType = { id: number; session1Id: number; metricId: number; minValue?: number; maxValue?: number; avgValue?: number }
export type RepMetricType = { id: number; repId: number; metricId: number; value?: number }
export type AssessmentResourceType = { id: number; assessmentId: number; type: string; url: string }
export type SessionResourceType = { id: number; session1Id: number; type: string; url: string }
export type RepResourceType = { id: number; repId: number; type: string; url: string }
export type RepMetricSourceType = { id: number; repMetricId: number; dataSourceId: number; description?: string }
