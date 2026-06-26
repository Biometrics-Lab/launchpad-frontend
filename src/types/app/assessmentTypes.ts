export type MeasurementType = {
  id: number
  name: string
}

export type AssessmentType = { id: number; playerId: number; sport: string; date?: string; templateId: number; conditionId?: number; allowExternalUrls: boolean }
export type AssessmentTemplateType = { id: number; name: string; sport: string; description?: string; conditionId?: number }
export type SessionType = { id: number; assessmentId: number; startTime: string; status?: 'ACTIVE' | 'COMPLETE' | null }
export type RepType = { id: number; sessionId: number; startTime: string; repNumber?: number }
export type AssessmentMetricType = { id: number; assessmentId: number; conditionalMetricId: number; sourceId: number; description?: string; minValue?: number; maxValue?: number; avgValue?: number; sessionCount: number; repCount: number }
export type SessionMetricType = { id: number; sessionId: number; conditionalMetricId: number; minValue?: number; maxValue?: number; avgValue?: number }
export type RepMetricType = { id: number; repId: number; conditionalMetricId: number; value?: number; dataSourceId?: number | null }
export type UrlStatus = 'PENDING' | 'READY' | 'FAILED'
export type AssessmentResourceType = { id: number; assessmentId: number; type: string; url: string; externalUrl?: string; urlStatus?: UrlStatus }
export type SessionResourceType = { id: number; sessionId: number; type: string; url: string; externalUrl?: string; urlStatus?: UrlStatus }
export type RepResourceType = { id: number; repId: number; type: string; url: string; externalUrl?: string; urlStatus?: UrlStatus }

export type RepBroadcastDto = {
  id: number
  sessionId: number
  repNumber?: number
  startTime: string
  metrics: RepMetricBroadcastData[]
  resources: RepResourceBroadcastData[]
}

export type RepMetricBroadcastData = {
  conditionalMetricId: number
  name: string
  value?: number | null
}

export type RepResourceBroadcastData = {
  id: number
  type: string
  url: string
  status: UrlStatus
}
