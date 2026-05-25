'use client'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

import type { PlayerType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse, PlayerMetricEntry } from '@/types/app/playerMetricsTypes'

type Props = {
  player: PlayerType
  teamName: string | null
  metrics: PlayerMetricsResponse
}

const fmt = (v: number | null): string => (v === null ? 'N/A' : String(v))

const MetricGrid = ({ entries }: { entries: PlayerMetricEntry[] }) => (
  <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
    {entries.map(m => (
      <Card key={m.conditionalMetricId} variant='outlined'>
        <CardContent className='flex flex-col gap-1 !p-3'>
          <Typography variant='caption' color='text.secondary' className='uppercase tracking-wide'>
            {m.name}
          </Typography>
          <Typography variant='h5' color='primary'>
            {fmt(m.avgValue)}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            min {fmt(m.minValue)} · max {fmt(m.maxValue)}
          </Typography>
        </CardContent>
      </Card>
    ))}
  </div>
)

const PlayerReportView = ({ player, teamName, metrics }: Props) => (
  <div className='flex flex-col gap-6'>
    <Link href='/players' className='flex items-center gap-1 text-primary w-fit'>
      <i className='ri-arrow-left-s-line text-xl' />
      <Typography color='primary'>Players</Typography>
    </Link>
    <Card>
      <CardContent className='flex flex-col gap-2'>
        <Typography variant='h5'>{player.name}</Typography>
        <Typography color='text.secondary'>
          {teamName ?? '—'} · Class of {player.graduationYear}
          {player.dob ? ` · ${player.dob}` : ''}
        </Typography>
      </CardContent>
    </Card>
    <div className='flex flex-col gap-4'>
      <Typography variant='h6'>Overall</Typography>
      {metrics.overall.length === 0 ? (
        <Typography color='text.secondary'>No metrics recorded yet</Typography>
      ) : (
        <MetricGrid entries={metrics.overall} />
      )}
    </div>
    <div className='flex flex-col gap-4'>
      <Typography variant='h6'>Assessments</Typography>
      {metrics.assessments.length === 0 ? (
        <Typography color='text.secondary'>No assessments recorded yet</Typography>
      ) : (
        metrics.assessments.map(a => (
          <Accordion key={a.assessmentId}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <Typography>Assessment #{a.assessmentId} · {a.sport}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MetricGrid entries={a.metrics} />
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </div>
  </div>
)

export default PlayerReportView
