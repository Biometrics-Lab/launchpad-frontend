import DataSourcesTable from '@views/data-sources/DataSourcesTable'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getDataSources(): Promise<DataSourceType[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSources`, { headers: HEADERS, cache: 'no-store' })

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
  const [dataSources, dataSourceTypes] = await Promise.all([getDataSources(), getDataSourceTypes()])

  return <DataSourcesTable dataSources={dataSources} dataSourceTypes={dataSourceTypes} />
}

export default DataSourcesPage
