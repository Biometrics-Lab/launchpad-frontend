export type ReportType = { id: number; name: string; extRef?: string }

export type ReportConfigEntry = {
  id: number | null
  name: string
  reportType: string
  config: ReportConfigJson
  preset: boolean
}

export type ReportConfigJson = {
  granularity: 'OVERALL' | 'PER_SESSION' | 'PER_REP'
  valueType?: 'avg' | 'min' | 'max'
  filters: { conditionalMetricIds: number[] }
  panels: ReportPanelConfig[]
}

export type ReportPanelConfig = {
  type: 'bar' | 'line' | 'radar' | 'table'
  series: ('avg' | 'min' | 'max' | 'range')[]
  options?: Record<string, unknown>
}

export type ReportData = {
  columns: ReportColumn[]
  rows: ReportRow[]
}

export type ReportColumn = {
  id: number
  label: string
  type: 'assessment' | 'session' | 'rep'
}

export type ReportRow = {
  conditionalMetricId: number
  name: string
  negated: boolean
  cells: ReportCell[]
}

export type ReportCell = {
  columnId: number
  min: number | null
  max: number | null
  avg: number | null
  count: number
}
