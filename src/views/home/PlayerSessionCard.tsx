'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import type { ApexOptions } from 'apexcharts'
import type { RecentPlayerEntry } from '@/types/app/dashboardTypes'
import { getAvatarColor, getInitials, getSportEmoji, formatRelativeDate } from '@/lib/dashboard'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

type Props = { entry: RecentPlayerEntry }

const PlayerSessionCard = ({ entry }: Props) => {
  const { player, teamName, hasActiveSession, assessments, defaultOpenAssessmentId } = entry
  const [openId, setOpenId] = useState<number>(defaultOpenAssessmentId)

  const toggle = (assessmentId: number) => {
    setOpenId(prev => (prev === assessmentId ? -1 : assessmentId))
  }

  const getRadarOptions = (metrics: RecentPlayerEntry['assessments'][number]['metrics'], color: string): ApexOptions => ({
    chart: { toolbar: { show: false }, animations: { enabled: false } },
    colors: [color],
    plotOptions: {
      radar: { polygons: { strokeColors: 'var(--mui-palette-divider)' } }
    },
    fill: { opacity: 0.25 },
    markers: { size: 0 },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: {
      categories: metrics.map(m => m.name),
      labels: {
        style: { fontSize: '10px', colors: Array(metrics.length).fill('var(--mui-palette-text-disabled)') }
      }
    },
    yaxis: { show: false },
  })

  return (
    <Card className={hasActiveSession ? 'border border-success' : ''}>
      <CardContent className='flex flex-col gap-3 p-4'>

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div
            className='flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-bold flex-shrink-0'
            style={{ background: getAvatarColor(player.id) }}
          >
            {getInitials(player.name)}
          </div>
          <div className='flex-1 min-w-0'>
            <Link href={`/report?playerId=${player.id}`}>
              <Typography
                variant='body2'
                className='font-semibold truncate'
                color='primary'
              >
                {player.name}
              </Typography>
            </Link>
            <Typography variant='caption' color='text.secondary'>
              {teamName ?? '—'}
            </Typography>
          </div>
          {hasActiveSession && (
            <Chip
              label='LIVE'
              size='small'
              color='success'
              variant='tonal'
              icon={<i className='ri-live-line text-xs' />}
            />
          )}
        </div>

        {/* Assessment accordion list */}
        <div className='flex flex-col gap-1'>
          {assessments.map(a => {
            const isOpen = openId === a.assessmentId
            const chartMetrics = a.metrics.filter(m => m.avgValue != null)

            return (
              <div key={a.assessmentId} className='rounded-lg overflow-hidden'>
                {/* Row */}
                <div
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    isOpen
                      ? 'bg-primary/10'
                      : a.isActiveNow
                        ? 'bg-success/10 hover:bg-success/15'
                        : 'bg-action-hover hover:bg-action-selected',
                  ].join(' ')}
                >
                  {/* Sport label — click navigates to report */}
                  <Link
                    href={`/report?playerId=${player.id}&assessmentId=${a.assessmentId}`}
                    className='flex items-center gap-1.5 flex-1 min-w-0'
                  >
                    <span className='text-sm'>{getSportEmoji(a.sport)}</span>
                    <Typography variant='caption' className='font-semibold truncate' color='text.primary'>
                      {a.sport}
                    </Typography>
                  </Link>

                  {a.isActiveNow ? (
                    <Typography variant='caption' color='success.main' className='font-semibold flex-shrink-0'>
                      ● active now
                    </Typography>
                  ) : (
                    <Typography variant='caption' color='text.disabled' className='flex-shrink-0'>
                      {formatRelativeDate(a.lastSessionDate)}
                    </Typography>
                  )}

                  {/* Chevron — click toggles accordion only */}
                  <button
                    onClick={() => toggle(a.assessmentId)}
                    className='ml-1 text-text-disabled hover:text-primary transition-colors flex-shrink-0'
                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                  >
                    <i className={`ri-arrow-down-s-line text-base transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expandable panel */}
                {isOpen && (
                  <div className={`px-3 pb-3 pt-2 rounded-b-lg ${a.isActiveNow ? 'bg-success/5' : 'bg-primary/5'}`}>
                    {a.isActiveNow && a.metrics.length === 0 && (
                      <Typography variant='caption' color='text.secondary' className='block text-center py-2 italic'>
                        Session in progress — no completed metrics yet
                      </Typography>
                    )}
                    {a.isActiveNow && a.metrics.length > 0 && (
                      <Typography variant='caption' color='text.secondary' className='block text-center mb-1 italic'>
                        Session in progress — showing last completed metrics
                      </Typography>
                    )}
                    {!a.isActiveNow && a.metrics.length === 0 && (
                      <Typography variant='caption' color='text.secondary' className='block text-center py-2 italic'>
                        No metrics recorded yet
                      </Typography>
                    )}
                    {a.metrics.length > 0 && (
                      <>
                        {chartMetrics.length > 0 && (
                          <AppReactApexCharts
                            type='radar'
                            height={180}
                            width='100%'
                            series={[{ name: 'AVG', data: chartMetrics.map(m => m.avgValue as number) }]}
                            options={getRadarOptions(chartMetrics, getAvatarColor(player.id))}
                          />
                        )}
                        <div className='flex flex-wrap gap-1.5 mt-1'>
                          {a.metrics.map(m => (
                            <span
                              key={m.conditionalMetricId}
                              className='text-xs px-2 py-0.5 rounded bg-action-hover text-text-secondary'
                            >
                              {m.name}{' '}
                              <span className='font-semibold text-primary'>
                                {m.avgValue != null ? Math.round(m.avgValue * 10) / 10 : 'N/A'}
                              </span>
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </CardContent>
    </Card>
  )
}

export default PlayerSessionCard
