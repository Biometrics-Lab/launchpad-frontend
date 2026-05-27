import { notFound } from 'next/navigation'
import Link from 'next/link'
import Typography from '@mui/material/Typography'

import DataSourceEditForm from '@views/data-sources/DataSourceEditForm'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getDataSource(id: string): Promise<DataSourceType | null> {
  try {
    const res = await fetch(`${API_BASE}/dataSources/${id}`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : null
  } catch { return null }
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

type Props = { params: Promise<{ id: string }> }

const EditDataSourcePage = async ({ params }: Props) => {
  const { id } = await params
  const [dataSource, metrics, dataSourceTypes] = await Promise.all([
    getDataSource(id),
    getMetrics(),
    getDataSourceTypes()
  ])

  if (!dataSource) notFound()

  return (
    <div className='flex flex-col gap-6'>
      <Link href='/data-sources' className='flex items-center gap-1 text-primary w-fit'>
        <i className='ri-arrow-left-s-line text-xl' />
        <Typography color='primary'>Data Sources</Typography>
      </Link>
      <DataSourceEditForm
        dataSource={dataSource}
        metrics={metrics}
        dataSourceTypes={dataSourceTypes}
      />
    </div>
  )
}

export default EditDataSourcePage
