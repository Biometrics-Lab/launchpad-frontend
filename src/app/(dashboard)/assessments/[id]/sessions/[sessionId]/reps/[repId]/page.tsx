import { notFound } from 'next/navigation'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import RepMetricsTable from '@views/reps/RepMetricsTable'
import RepResourcesTable from '@views/reps/RepResourcesTable'
import RepMetricSourcesTable from '@views/reps/RepMetricSourcesTable'
import type { RepType, RepMetricType, RepResourceType, RepMetricSourceType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : fallback
  } catch { return fallback }
}

type Props = { params: Promise<{ id: string; sessionId: string; repId: string }> }

const RepDetailPage = async ({ params }: Props) => {
  const { id, sessionId, repId } = await params

  const [
    rep,
    allRepMetrics,
    allRepResources,
    allRepMetricSources,
    conditionalMetrics,
    dataSources,
    resourceTypes
  ] = await Promise.all([
    fetchJson<RepType | null>(`${API_BASE}/reps/${repId}`, null),
    fetchJson<RepMetricType[]>(`${API_BASE}/repMetrics`, []),
    fetchJson<RepResourceType[]>(`${API_BASE}/repResources`, []),
    fetchJson<RepMetricSourceType[]>(`${API_BASE}/repMetricSources`, []),
    fetchJson<ConditionalMetricType[]>(`${API_BASE}/conditionalMetrics`, []),
    fetchJson<DataSourceType[]>(`${API_BASE}/dataSources`, []),
    fetchJson<DictionaryEntry[]>(`${API_BASE}/resourceTypeDictionaries`, [])
  ])

  if (!rep) notFound()

  const numericRepId = Number(repId)
  const repMetrics = allRepMetrics.filter(rm => rm.repId === numericRepId)
  const repResources = allRepResources.filter(rr => rr.repId === numericRepId)
  const repMetricIds = new Set(repMetrics.map(rm => rm.id))
  const repMetricSources = allRepMetricSources.filter(rms => repMetricIds.has(rms.repMetricId))

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-2 flex-wrap'>
        <Link href='/assessments' className='flex items-center gap-1 text-primary'>
          <i className='ri-arrow-left-s-line text-xl' />
          <Typography color='primary'>Assessments</Typography>
        </Link>
        <Typography color='text.secondary'>/</Typography>
        <Link href={`/assessments/${id}`}>
          <Typography color='primary'>Assessment #{id}</Typography>
        </Link>
        <Typography color='text.secondary'>/</Typography>
        <Link href={`/assessments/${id}/sessions/${sessionId}`}>
          <Typography color='primary'>Session #{sessionId}</Typography>
        </Link>
      </div>
      <Card>
        <CardContent className='flex flex-col gap-2'>
          <Typography variant='h5'>Rep #{rep.id}</Typography>
          <Typography color='text.secondary'>Start Time: {rep.startTime}</Typography>
          <Typography color='text.secondary'>Session: #{rep.sessionId}</Typography>
        </CardContent>
      </Card>
      <RepMetricsTable
        repId={numericRepId}
        repMetrics={repMetrics}
        conditionalMetrics={conditionalMetrics}
      />
      <RepResourcesTable
        repId={numericRepId}
        repResources={repResources}
        resourceTypes={resourceTypes}
      />
      <RepMetricSourcesTable
        repId={numericRepId}
        repMetrics={repMetrics}
        repMetricSources={repMetricSources}
        conditionalMetrics={conditionalMetrics}
        dataSources={dataSources}
      />
    </div>
  )
}

export default RepDetailPage
