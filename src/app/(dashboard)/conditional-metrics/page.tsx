import ConditionalMetricsTable from '@views/conditional-metrics/ConditionalMetricsTable'
import type { ConditionalMetricType, ConditionType } from '@/types/app/conditionTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getConditionalMetrics(): Promise<ConditionalMetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/conditionalMetrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

async function getConditions(): Promise<ConditionType[]> {
  try {
    const res = await fetch(`${API_BASE}/conditions`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

const ConditionalMetricsPage = async () => {
  const [conditionalMetrics, conditions, metrics] = await Promise.all([
    getConditionalMetrics(), getConditions(), getMetrics()
  ])

  return <ConditionalMetricsTable conditionalMetricData={conditionalMetrics} conditions={conditions} metrics={metrics} />
}

export default ConditionalMetricsPage
