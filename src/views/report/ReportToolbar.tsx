'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'

import type { PlayerType } from '@/types/app/playersTypes'
import type { AssessmentType, SessionType } from '@/types/app/assessmentTypes'
import type { ReportConfigEntry } from '@/types/app/reportTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'

type Granularity = 'OVERALL' | 'PER_SESSION' | 'PER_REP'
type ValueType = 'avg' | 'min' | 'max'

type Props = {
  players: PlayerType[]
  assessments: AssessmentType[]
  configs: ReportConfigEntry[]
  conditionalMetrics: ConditionalMetricType[]
  playerId: number | null
  assessmentId: number | null
  configName: string
  granularity: Granularity
  valueType: ValueType
  cmFilter: number[]
  sessions: SessionType[]
  sessionId: number | null
  onPlayerChange: (id: number | null) => void
  onAssessmentChange: (id: number | null) => void
  onConfigChange: (name: string) => void
  onGranularityChange: (g: Granularity) => void
  onValueTypeChange: (v: ValueType) => void
  onCmFilterChange: (ids: number[]) => void
  onSessionChange: (id: number | null) => void
  onSaveConfig: () => void
}

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'OVERALL', label: 'All' },
  { value: 'PER_SESSION', label: 'Session' },
  { value: 'PER_REP', label: 'Rep' }
]

const VALUE_TYPES: { value: ValueType; label: string; color: string }[] = [
  { value: 'avg', label: 'AVG', color: 'var(--mui-palette-success-main)' },
  { value: 'min', label: 'MIN', color: 'var(--mui-palette-warning-main)' },
  { value: 'max', label: 'MAX', color: 'var(--mui-palette-info-main)' }
]

const ReportToolbar = ({
  players, assessments, sessions, configs, conditionalMetrics,
  playerId, assessmentId, configName, granularity, valueType, cmFilter, sessionId,
  onPlayerChange, onAssessmentChange, onConfigChange, onGranularityChange, onValueTypeChange, onCmFilterChange, onSessionChange, onSaveConfig
}: Props) => {
  const [metricsAnchor, setMetricsAnchor] = useState<HTMLElement | null>(null)

  const playerAssessments = assessments.filter(a => a.playerId === playerId)

  const toggleMetric = (id: number) => {
    if (cmFilter.length === 0) {
      // currently showing all — unchecking one means "show all except this"
      onCmFilterChange(conditionalMetrics.map(cm => cm.id).filter(x => x !== id))
    } else {
      const next = cmFilter.includes(id) ? cmFilter.filter(x => x !== id) : [...cmFilter, id]
      // if all are selected, collapse back to "show all" (empty array)
      onCmFilterChange(next.length === conditionalMetrics.length ? [] : next)
    }
  }

  return (
    <div className='flex items-center gap-2 py-2 px-3' style={{ background: 'var(--mui-palette-action-hover)', borderBottom: '1px solid var(--mui-palette-divider)', flexWrap: 'nowrap', overflowX: 'auto' }}>
      {/* Player */}
      <FormControl size='small' sx={{ minWidth: 120 }}>
        <InputLabel>Player</InputLabel>
        <Select
          label='Player'
          value={playerId ?? ''}
          onChange={e => onPlayerChange(e.target.value ? Number(e.target.value) : null)}
        >
          <MenuItem value=''><em>Select player…</em></MenuItem>
          {players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Assessment */}
      <FormControl size='small' sx={{ minWidth: 140 }} disabled={!playerId}>
        <InputLabel>Assessment</InputLabel>
        <Select
          label='Assessment'
          value={assessmentId ?? ''}
          onChange={e => onAssessmentChange(e.target.value ? Number(e.target.value) : null)}
        >
          <MenuItem value=''><em>Select assessment…</em></MenuItem>
          {playerAssessments.length === 0 && playerId && (
            <MenuItem value='' disabled><em>No assessments</em></MenuItem>
          )}
          {playerAssessments.map(a => (
            <MenuItem key={a.id} value={a.id}>#{a.id} {a.sport} — {a.date}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Session */}
      <FormControl size='small' sx={{ minWidth: 120 }} disabled={!assessmentId}>
        <InputLabel>Session</InputLabel>
        <Select
          label='Session'
          value={sessionId ?? ''}
          onChange={e => onSessionChange(e.target.value ? Number(e.target.value) : null)}
        >
          <MenuItem value=''><em>All sessions</em></MenuItem>
          {sessions
            .filter(s => s.assessmentId === assessmentId)
            .map((s, i) => (
              <MenuItem key={s.id} value={s.id}>
                Session {i + 1} — {s.startTime?.slice(0, 10)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <div style={{ width: 1, height: 32, background: 'var(--mui-palette-divider)' }} />

      {/* Config */}
      <FormControl size='small' sx={{ minWidth: 140 }} disabled={!assessmentId}>
        <InputLabel>Config</InputLabel>
        <Select
          label='Config'
          value={configName}
          onChange={e => onConfigChange(e.target.value)}
        >
          {configs.map(c => (
            <MenuItem key={c.name} value={c.name}>
              {c.name}{c.preset ? ' (preset)' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Granularity */}
      <ButtonGroup size='small' disabled={!assessmentId}>
        {GRANULARITIES.map(g => (
          <Button
            key={g.value}
            variant={granularity === g.value ? 'contained' : 'outlined'}
            onClick={() => onGranularityChange(g.value)}
          >
            {g.label}
          </Button>
        ))}
      </ButtonGroup>

      {/* Value type */}
      <ButtonGroup size='small' disabled={!assessmentId}>
        {VALUE_TYPES.map(v => (
          <Button
            key={v.value}
            variant={valueType === v.value ? 'contained' : 'outlined'}
            onClick={() => onValueTypeChange(v.value)}
            sx={{
              borderColor: v.color,
              color: valueType === v.value ? '#fff' : v.color,
              background: valueType === v.value ? v.color : 'transparent',
              '&:hover': {
                background: valueType === v.value ? v.color : `${v.color}22`,
                borderColor: v.color
              }
            }}
          >
            {v.label}
          </Button>
        ))}
      </ButtonGroup>

      {/* Metrics filter */}
      <Badge badgeContent={cmFilter.length || null} color='primary'>
        <Button
          size='small'
          variant='outlined'
          startIcon={<i className='ri-settings-3-line' />}
          onClick={e => setMetricsAnchor(e.currentTarget)}
          disabled={!assessmentId || conditionalMetrics.length === 0}
        >
          Metrics
        </Button>
      </Badge>

      <Popover
        open={!!metricsAnchor}
        anchorEl={metricsAnchor}
        onClose={() => setMetricsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <div className='p-3 flex flex-col gap-1' style={{ minWidth: 200, maxHeight: 300, overflowY: 'auto' }}>
          <Typography variant='caption' color='text.secondary' className='uppercase tracking-wide mb-1'>
            Filter Metrics
          </Typography>
          {conditionalMetrics.map(cm => (
            <FormControlLabel
              key={cm.id}
              control={
                <Checkbox
                  size='small'
                  checked={cmFilter.length === 0 || cmFilter.includes(cm.id)}
                  onChange={() => toggleMetric(cm.id)}
                />
              }
              label={<Typography variant='body2'>{cm.name}</Typography>}
            />
          ))}
        </div>
      </Popover>

      {/* Save Config */}
      <Button
        size='small'
        variant='contained'
        onClick={onSaveConfig}
        disabled={!assessmentId}
        sx={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
      >
        Save
      </Button>
    </div>
  )
}

export default ReportToolbar
