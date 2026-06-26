'use client'

import { useState, useEffect, useCallback } from 'react'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import ReportToolbar from './ReportToolbar'
import ReportPanel from './ReportPanel'
import SaveConfigDialog from './SaveConfigDialog'

import type { PlayerType } from '@/types/app/playersTypes'
import type { AssessmentType, SessionType } from '@/types/app/assessmentTypes'
import type { ReportConfigEntry, ReportConfigJson, ReportData } from '@/types/app/reportTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'

type Granularity = 'OVERALL' | 'PER_SESSION' | 'PER_REP'

const DEFAULT_CONFIG_NAME = 'Column Chart'

const PRESET_CONFIGS: ReportConfigEntry[] = [
  { id: null, name: 'Column Chart', reportType: 'player-assessment', preset: true, config: { granularity: 'OVERALL', filters: { conditionalMetricIds: [] }, panels: [{ type: 'bar', series: ['avg', 'min', 'max'] }] } },
  { id: null, name: 'Radar Chart', reportType: 'player-assessment', preset: true, config: { granularity: 'OVERALL', valueType: 'avg', filters: { conditionalMetricIds: [] }, panels: [{ type: 'radar', series: ['avg'] }] } },
]

type Props = {
  initialPlayerId: number | null
  initialAssessmentId: number | null
  initialSessionId?: number | null
  initialGranularity?: 'OVERALL' | 'PER_SESSION' | 'PER_REP' | null
  initialConfigName?: string | null
}

const PlayerAssessmentReportView = ({ initialPlayerId, initialAssessmentId, initialSessionId, initialGranularity, initialConfigName }: Props) => {
  const [players, setPlayers] = useState<PlayerType[]>([])
  const [assessments, setAssessments] = useState<AssessmentType[]>([])
  const [sessions, setSessions] = useState<SessionType[]>([])
  const [configs, setConfigs] = useState<ReportConfigEntry[]>([])
  const [conditionalMetrics, setConditionalMetrics] = useState<ConditionalMetricType[]>([])

  const [playerId, setPlayerId] = useState<number | null>(initialPlayerId)
  const [assessmentId, setAssessmentId] = useState<number | null>(initialAssessmentId)
  const [configName, setConfigName] = useState(initialConfigName ?? DEFAULT_CONFIG_NAME)
  const [granularity, setGranularity] = useState<Granularity>(initialGranularity ?? 'OVERALL')
  const [sessionId, setSessionId] = useState<number | null>(initialSessionId ?? null)
  const [valueType, setValueType] = useState<'avg' | 'min' | 'max'>('avg')
  const [cmFilter, setCmFilter] = useState<number[]>([])

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Load players, assessments, and configs on mount
  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setPlayers).catch(() => {})
    fetch('/api/assessments').then(r => r.json()).then(setAssessments).catch(() => {})
    fetch('/api/sessions').then(r => r.json()).then(setSessions).catch(() => {})
    fetch('/api/report-configs?reportType=player-assessment')
      .then(r => r.json())
      .then((saved: ReportConfigEntry[]) => {
        const names = new Set(saved.map(c => c.name))
        setConfigs([...PRESET_CONFIGS.filter(p => !names.has(p.name)), ...saved])
      })
      .catch(() => setConfigs(PRESET_CONFIGS))
  }, [])

  // Auto-select assessment when player has exactly one
  useEffect(() => {
    if (!playerId) return
    const playerAssessments = assessments.filter(a => a.playerId === playerId)
    if (playerAssessments.length === 1) {
      setAssessmentId(playerAssessments[0].id)
    }
  }, [playerId, assessments])

  // Load conditionalMetrics when assessment selected
  useEffect(() => {
    if (!assessmentId) return
    const assessment = assessments.find(a => a.id === assessmentId)
    if (!assessment) return

    fetch('/api/conditional-metrics').then(r => r.json()).then((all: ConditionalMetricType[]) => {
      const filtered = assessment.conditionId
        ? all.filter(cm => cm.conditionId === assessment.conditionId)
        : all
      setConditionalMetrics(filtered)
    }).catch(() => setConditionalMetrics([]))
  }, [assessmentId, assessments])

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!assessmentId) return
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      assessmentId: String(assessmentId),
      configName,
      granularity
    })
    if (sessionId) params.set('sessionId', String(sessionId))
    cmFilter.forEach(id => params.append('conditionalMetricIds', String(id)))

    try {
      const res = await fetch(`/api/reports/player-assessment?${params}`)
      if (!res.ok) {
        setError('Failed to load report data')
        return
      }
      setReportData(await res.json())
    } catch {
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, configName, granularity, cmFilter, sessionId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handlePlayerChange = (id: number | null) => {
    setPlayerId(id)
    setAssessmentId(null)
    setSessionId(null)
    setCmFilter([])
    setReportData(null)
  }

  const activeConfig = configs.find(c => c.name === configName)
  const activeConfigJson: ReportConfigJson = activeConfig?.config ?? {
    granularity: 'OVERALL',
    filters: { conditionalMetricIds: [] },
    panels: [{ type: 'bar', series: ['avg', 'min', 'max'] }]
  }

  const saveableConfig: ReportConfigJson = {
    ...activeConfigJson,
    granularity,
    filters: { conditionalMetricIds: cmFilter }
  }

  return (
    <div className='flex flex-col'>
      <ReportToolbar
        players={players}
        assessments={assessments}
        configs={configs}
        conditionalMetrics={conditionalMetrics}
        playerId={playerId}
        assessmentId={assessmentId}
        configName={configName}
        granularity={granularity}
        valueType={valueType}
        cmFilter={cmFilter}
        onPlayerChange={handlePlayerChange}
        sessions={sessions}
        sessionId={sessionId}
        onAssessmentChange={id => { setAssessmentId(id); setSessionId(null) }}
        onSessionChange={id => {
          setSessionId(id)
          if (id) setGranularity('PER_SESSION')
        }}
        onConfigChange={name => {
          setConfigName(name)
          const cfg = configs.find(c => c.name === name)
          if (cfg?.config.granularity) setGranularity(cfg.config.granularity)
          if (cfg?.config.valueType) setValueType(cfg.config.valueType)
        }}
        onGranularityChange={setGranularity}
        onValueTypeChange={setValueType}
        onCmFilterChange={setCmFilter}
        onSaveConfig={() => setSaveDialogOpen(true)}
      />

      <div className='flex flex-col gap-4 p-4'>
        {error && <Alert severity='error'>{error}</Alert>}

        {!assessmentId && (
          <Card>
            <CardContent className='flex items-center justify-center' style={{ minHeight: 200 }}>
              <Typography color='text.secondary'>
                Select a player and assessment to load the report
              </Typography>
            </CardContent>
          </Card>
        )}

        {assessmentId && loading && (
          <div className='flex items-center justify-center' style={{ minHeight: 200 }}>
            <CircularProgress />
          </div>
        )}

        {assessmentId && !loading && reportData && reportData.rows.length === 0 && (
          <Card>
            <CardContent className='flex items-center justify-center' style={{ minHeight: 200 }}>
              <Typography color='text.secondary'>
                {cmFilter.length > 0 ? 'No data for selected metrics' : 'No session data recorded for this assessment yet'}
              </Typography>
            </CardContent>
          </Card>
        )}

        {assessmentId && !loading && reportData && reportData.rows.length > 0 &&
          activeConfigJson.panels.map((panel, i) => (
            <ReportPanel key={i} panel={panel} data={reportData} valueType={valueType} />
          ))
        }
      </div>

      <SaveConfigDialog
        open={saveDialogOpen}
        config={saveableConfig}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={entry => {
          setConfigs(prev => [...prev, entry])
          setConfigName(entry.name)
        }}
      />
    </div>
  )
}

export default PlayerAssessmentReportView
