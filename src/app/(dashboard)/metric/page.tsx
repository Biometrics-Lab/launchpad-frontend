import MetricsTable from '@views/assessments/metrics/MetricsTable'
import type { MetricType } from '@/types/app/metricTypes'
import type { MeasurementType } from '@/types/app/assessmentTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

async function getMeasurements(): Promise<MeasurementType[]> {
  try {
    const res = await fetch(`${API_BASE}/measurements`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

const MetricPage = async () => {
  const [metrics, measurements] = await Promise.all([getMetrics(), getMeasurements()])

  return <MetricsTable metricData={metrics} measurementData={measurements} />
}

export default MetricPage
