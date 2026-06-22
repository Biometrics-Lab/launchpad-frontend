import { notFound, redirect } from 'next/navigation'

import ActiveSessionView from '@/views/sessions/active/ActiveSessionView'
import type { AssessmentType, AssessmentMetricType, RepBroadcastDto, SessionType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'

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

const ActiveSessionPage = async ({ params }: Props) => {
  const { id, sessionId } = await params

  // 1. Fetch session and guard: only ACTIVE sessions are served here
  const session = await fetchJson<SessionType | null>(`${API_BASE}/sessions/${sessionId}`, null)

  if (!session) notFound()

  // 2. Fetch assessment
  const assessment = await fetchJson<AssessmentType | null>(`${API_BASE}/assessments/${session.assessmentId}`, null)

  if (!assessment) notFound()

  // 3. Fetch remaining data in parallel
  const [
    player,
    template,
    condition,
    allAssessmentMetrics,
    allConditionalMetrics,
    initialReps,
  ] = await Promise.all([
    fetchJson<{ id: number; name: string } | null>(`${API_BASE}/players/${assessment.playerId}`, null),
    fetchJson<{ id: number; name: string } | null>(`${API_BASE}/assessmentTemplates/${assessment.templateId}`, null),
    assessment.conditionId != null
      ? fetchJson<{ id: number; name: string } | null>(`${API_BASE}/conditions/${assessment.conditionId}`, null)
      : Promise.resolve(null),
    fetchJson<AssessmentMetricType[]>(`${API_BASE}/assessmentMetrics`, []),
    fetchJson<ConditionalMetricType[]>(`${API_BASE}/conditionalMetrics`, []),
    fetchJson<RepBroadcastDto[]>(`${API_BASE}/sessions/${sessionId}/reps`, []),
  ])

  // 4. Build expectedMetrics from this assessment's metrics
  const assessmentMetricList = allAssessmentMetrics.filter(am => am.assessmentId === assessment.id)
  const expectedMetrics = assessmentMetricList.map(am => {
    const cm = allConditionalMetrics.find(c => c.id === am.conditionalMetricId)
    return { conditionalMetricId: am.conditionalMetricId, name: cm?.name ?? String(am.conditionalMetricId) }
  })

  // 5. Render
  return (
    <ActiveSessionView
      sessionId={Number(sessionId)}
      assessmentId={assessment.id}
      initialStatus={session.status ?? null}
      playerName={player?.name ?? `Player #${assessment.playerId}`}
      templateName={template?.name ?? `Template #${assessment.templateId}`}
      conditionName={condition?.name ?? null}
      initialReps={initialReps}
      expectedMetrics={expectedMetrics}
    />
  )
}

export default ActiveSessionPage
