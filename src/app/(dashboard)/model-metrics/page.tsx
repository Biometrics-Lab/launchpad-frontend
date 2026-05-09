import ModelMetricsListTable from '@views/model-metrics/ModelMetricsListTable'
import type { ModelMetricType, ModelType } from '@/types/app/modelTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getModelMetrics(): Promise<ModelMetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/modelMetrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getModels(): Promise<ModelType[]> {
  try {
    const res = await fetch(`${API_BASE}/models`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const ModelMetricsPage = async () => {
  const [modelMetrics, models, metrics] = await Promise.all([getModelMetrics(), getModels(), getMetrics()])

  return <ModelMetricsListTable modelMetrics={modelMetrics} models={models} metrics={metrics} />
}

export default ModelMetricsPage
