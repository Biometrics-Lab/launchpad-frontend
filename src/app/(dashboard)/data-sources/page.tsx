import DataSourcesTable from '@views/data-sources/DataSourcesTable'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { IntegrationType } from '@/types/app/integrationTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getDataSources(): Promise<DataSourceType[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSources`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getIntegrations(): Promise<IntegrationType[]> {
  try {
    const res = await fetch(`${API_BASE}/integrations`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getDataSourceTypes(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSourceTypeDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const DataSourcesPage = async () => {
  const [dataSources, integrations, metrics, dataSourceTypes] = await Promise.all([
    getDataSources(),
    getIntegrations(),
    getMetrics(),
    getDataSourceTypes()
  ])

  return <DataSourcesTable dataSources={dataSources} integrations={integrations} metrics={metrics} dataSourceTypes={dataSourceTypes} />
}

export default DataSourcesPage
