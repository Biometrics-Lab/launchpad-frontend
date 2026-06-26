import PlayerAssessmentReportView from '@views/report/PlayerAssessmentReportView'

type Props = { searchParams: Promise<{ playerId?: string; assessmentId?: string; sessionId?: string; granularity?: string; configName?: string }> }

const ReportPage = async ({ searchParams }: Props) => {
  const { playerId, assessmentId, sessionId, granularity, configName } = await searchParams

  return (
    <PlayerAssessmentReportView
      initialPlayerId={playerId ? Number(playerId) : null}
      initialAssessmentId={assessmentId ? Number(assessmentId) : null}
      initialSessionId={sessionId ? Number(sessionId) : null}
      initialGranularity={(granularity as 'OVERALL' | 'PER_SESSION' | 'PER_REP') ?? null}
      initialConfigName={configName ?? null}
    />
  )
}

export default ReportPage
