import { notFound } from 'next/navigation'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'

import SessionMetricsTable from '@views/sessions/SessionMetricsTable'
import SessionResourcesTable from '@views/sessions/SessionResourcesTable'
import RepsTable from '@views/sessions/RepsTable'
import SessionStartStopButtons from '@views/sessions/SessionStartStopButtons'
import type { SessionType, SessionMetricType, SessionResourceType, RepType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'
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

type Props = { params: Promise<{ id: string; sessionId: string }> }

const SessionDetailPage = async ({ params }: Props) => {
  const { id, sessionId } = await params

  const [
    session,
    allSessionMetrics,
    allSessionResources,
    allReps,
    conditionalMetrics,
    resourceTypes
  ] = await Promise.all([
    fetchJson<SessionType | null>(`${API_BASE}/sessions/${sessionId}`, null),
    fetchJson<SessionMetricType[]>(`${API_BASE}/sessionMetrics`, []),
    fetchJson<SessionResourceType[]>(`${API_BASE}/sessionResources`, []),
    fetchJson<RepType[]>(`${API_BASE}/reps`, []),
    fetchJson<ConditionalMetricType[]>(`${API_BASE}/conditionalMetrics`, []),
    fetchJson<DictionaryEntry[]>(`${API_BASE}/resourceTypeDictionaries`, [])
  ])

  if (!session) notFound()

  const numericSessionId = Number(sessionId)
  const sessionMetrics = allSessionMetrics.filter(sm => sm.sessionId === numericSessionId)
  const sessionResources = allSessionResources.filter(sr => sr.sessionId === numericSessionId)
  const reps = allReps.filter(r => r.sessionId === numericSessionId)

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
      </div>
      <Card>
        <CardContent className='flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <Typography variant='h5'>Session #{session.id}</Typography>
            {session.status && (
              <Chip
                label={session.status}
                color={session.status === 'ACTIVE' ? 'success' : 'default'}
                size='small'
                variant='tonal'
              />
            )}
          </div>
          <Typography color='text.secondary'>Start Time: {session.startTime}</Typography>
          <Typography color='text.secondary'>Assessment: #{session.assessmentId}</Typography>
          <SessionStartStopButtons sessionId={numericSessionId} initialStatus={session.status} />
        </CardContent>
      </Card>
      <SessionMetricsTable
        sessionId={numericSessionId}
        sessionMetrics={sessionMetrics}
        conditionalMetrics={conditionalMetrics}
      />
      <SessionResourcesTable
        sessionId={numericSessionId}
        sessionResources={sessionResources}
        resourceTypes={resourceTypes}
      />
      <RepsTable
        reps={reps}
        assessmentId={Number(id)}
        sessionId={numericSessionId}
      />
    </div>
  )
}

export default SessionDetailPage
