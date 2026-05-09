import { notFound } from 'next/navigation'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import AssessmentMetricsTable from '@views/assessments/AssessmentMetricsTable'
import AssessmentResourcesTable from '@views/assessments/AssessmentResourcesTable'
import SessionsTable from '@views/assessments/SessionsTable'
import type { AssessmentType, AssessmentMetricType, AssessmentResourceType, SessionType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { MetricType } from '@/types/app/metricTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { PlayerType } from '@/types/app/playersTypes'
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

type Props = { params: Promise<{ id: string }> }

const AssessmentDetailPage = async ({ params }: Props) => {
  const { id } = await params

  const [
    assessment,
    allAssessmentMetrics,
    allAssessmentResources,
    allSessions,
    metrics,
    dataSources,
    resourceTypes,
    players,
    templates
  ] = await Promise.all([
    fetchJson<AssessmentType | null>(`${API_BASE}/assessments/${id}`, null),
    fetchJson<AssessmentMetricType[]>(`${API_BASE}/assessmentMetrics`, []),
    fetchJson<AssessmentResourceType[]>(`${API_BASE}/assessmentResources`, []),
    fetchJson<SessionType[]>(`${API_BASE}/sessions`, []),
    fetchJson<MetricType[]>(`${API_BASE}/metrics`, []),
    fetchJson<DataSourceType[]>(`${API_BASE}/dataSources`, []),
    fetchJson<DictionaryEntry[]>(`${API_BASE}/resourceTypeDictionaries`, []),
    fetchJson<PlayerType[]>(`${API_BASE}/players`, []),
    fetchJson<AssessmentTemplateType[]>(`${API_BASE}/assessmentTemplates`, [])
  ])

  if (!assessment) notFound()

  const numericId = Number(id)
  const assessmentMetrics = allAssessmentMetrics.filter(am => am.assessmentId === numericId)
  const assessmentResources = allAssessmentResources.filter(ar => ar.assessmentId === numericId)
  const sessions = allSessions.filter(s => s.assessmentId === numericId)

  const player = players.find(p => p.id === assessment.playerId)
  const template = templates.find(t => t.id === assessment.templateId)

  return (
    <div className='flex flex-col gap-6'>
      <Link href='/assessments' className='flex items-center gap-1 text-primary w-fit'>
        <i className='ri-arrow-left-s-line text-xl' />
        <Typography color='primary'>Assessments</Typography>
      </Link>
      <Card>
        <CardContent className='flex flex-col gap-3'>
          <div className='flex items-center gap-3 flex-wrap'>
            <Typography variant='h5'>Assessment #{assessment.id}</Typography>
            <Chip label={assessment.sport} color='primary' variant='outlined' size='small' />
          </div>
          <div className='flex flex-col gap-1'>
            <Typography color='text.secondary'>Player: {player?.name ?? `#${assessment.playerId}`}</Typography>
            <Typography color='text.secondary'>Template: {template?.name ?? `#${assessment.templateId}`}</Typography>
          </div>
        </CardContent>
      </Card>
      <AssessmentMetricsTable
        assessmentId={numericId}
        assessmentMetrics={assessmentMetrics}
        metrics={metrics}
        dataSources={dataSources}
      />
      <AssessmentResourcesTable
        assessmentId={numericId}
        assessmentResources={assessmentResources}
        resourceTypes={resourceTypes}
      />
      <SessionsTable
        assessmentId={numericId}
        sessions={sessions}
      />
    </div>
  )
}

export default AssessmentDetailPage
