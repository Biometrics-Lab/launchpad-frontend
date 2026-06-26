'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import type { ApexOptions } from 'apexcharts'
import type { RecentPlayerEntry } from '@/types/app/dashboardTypes'
import { getAvatarColor, getInitials, getSportEmoji, formatRelativeDate } from '@/lib/dashboard'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

// TODO: remove once backend excludes Power from metrics by default
const HIDDEN_METRICS = new Set(['Power'])

type Props = { entry: RecentPlayerEntry }

const PlayerSessionCard = ({ entry }: Props) => {
  const { player, teamName, hasActiveSession, assessments, defaultOpenAssessmentId } = entry
  const [openId, setOpenId] = useState<number>(defaultOpenAssessmentId)
  const router = useRouter()

  const goToReport = (assessmentId: number) =>
    router.push(`/report?playerId=${player.id}&assessmentId=${assessmentId}&configName=Radar+Chart`)

  const toggle = (assessmentId: number) => {
    setOpenId(prev => (prev === assessmentId ? -1 : assessmentId))
  }

  const getRadarOptions = (metrics: RecentPlayerEntry['assessments'][number]['metrics'], color: string): ApexOptions => ({
    chart: { toolbar: { show: false }, animations: { enabled: false }, parentHeightOffset: 0 },
    colors: [color],
    plotOptions: {
      radar: {
        size: 75,
        polygons: { strokeColors: 'var(--mui-palette-divider)', connectorColors: 'var(--mui-palette-divider)' }
      }
    },
    fill: { opacity: 0.25 },
    markers: { size: 0 },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: {
      categories: metrics.map(m => m.name.length > 11 ? m.name.slice(0, 11) + '…' : m.name),
      labels: {
        style: { fontSize: '9px', colors: Array(metrics.length).fill('var(--mui-palette-text-disabled)') }
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
            const visibleMetrics = a.metrics.filter(m => !HIDDEN_METRICS.has(m.name))
            const chartMetrics = visibleMetrics.filter(m => m.avgValue != null)

            return (
              <div key={a.assessmentId} className='rounded-lg overflow-hidden'>
                {/* Row */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer select-none ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
                  style={{
                    backgroundColor:
                      a.isActiveNow && isOpen ? 'rgba(34,197,94,0.12)' :
                      a.isActiveNow           ? 'rgba(34,197,94,0.07)' :
                      isOpen                  ? 'rgba(124,106,247,0.12)' :
                                                'rgba(255,255,255,0.03)',
                  }}
                  onClick={() => toggle(a.assessmentId)}
                >
                  {/* Sport label — row click toggles only, no navigation here */}
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <span className='text-sm flex-shrink-0'>{getSportEmoji(a.sport)}</span>
                    <div className='flex flex-col min-w-0'>
                      <div className='flex items-center gap-1.5'>
                        <Typography variant='caption' className='font-semibold leading-tight' color='text.primary'>
                          {a.sport}
                        </Typography>
                        {a.isActiveNow && (
                          <span
                            className='w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse'
                            style={{ backgroundColor: 'var(--mui-palette-success-main)' }}
                          />
                        )}
                      </div>
                      {a.templateName && (
                        <Typography variant='caption' className='truncate leading-tight' color='text.disabled' style={{ fontSize: '10px' }}>
                          {a.templateName}
                        </Typography>
                      )}
                    </div>
                  </div>

                  {a.isActiveNow ? (
                    <Typography variant='caption' color='success.main' className='font-semibold flex-shrink-0'>
                      active now
                    </Typography>
                  ) : (
                    <Typography variant='caption' color='text.disabled' className='flex-shrink-0'>
                      {formatRelativeDate(a.lastSessionDate)}
                    </Typography>
                  )}

                  {/* Chevron — visual only, row click handles toggle */}
                  <span
                    className={`ml-1 flex-shrink-0 text-xs transition-all duration-200 select-none ${isOpen ? 'rotate-180 text-primary' : 'text-text-disabled'}`}
                    style={{ display: 'inline-block' }}
                  >
                    ▾
                  </span>
                </div>

                {/* Expandable panel */}
                {isOpen && (
                  <div
                    className='px-3 pb-3 pt-2 rounded-b-lg'
                    style={{
                      background: a.isActiveNow ? 'rgba(34,197,94,0.05)' : 'rgba(124,106,247,0.06)',
                      borderTop: a.isActiveNow ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(124,106,247,0.15)',
                    }}
                  >
                    {a.isActiveNow && visibleMetrics.length === 0 && (
                      <Typography variant='caption' color='text.secondary' className='block text-center py-2 italic'>
                        Session in progress — no completed metrics yet
                      </Typography>
                    )}
                    {a.isActiveNow && visibleMetrics.length > 0 && (
                      <Typography variant='caption' color='text.secondary' className='block text-center mb-1 italic'>
                        Session in progress — showing last completed metrics
                      </Typography>
                    )}
                    {!a.isActiveNow && visibleMetrics.length === 0 && (
                      <Typography variant='caption' color='text.secondary' className='block text-center py-2 italic'>
                        No metrics recorded yet
                      </Typography>
                    )}
                    {visibleMetrics.length > 0 && (
                      <div
                        className='cursor-pointer'
                        onClick={() => goToReport(a.assessmentId)}
                        title='Open report'
                      >
                        {chartMetrics.length > 0 && (
                          <AppReactApexCharts
                            type='radar'
                            height={260}
                            width='100%'
                            series={[{ name: 'AVG', data: chartMetrics.map(m => m.avgValue as number) }]}
                            options={getRadarOptions(chartMetrics, getAvatarColor(player.id))}
                          />
                        )}
                        {chartMetrics.length === 0 && visibleMetrics.length > 0 && (
                          <Typography variant='caption' color='text.secondary' className='block text-center py-2 italic'>
                            No values recorded yet
                          </Typography>
                        )}
                        <div className='flex flex-wrap gap-1.5 mt-1'>
                          {visibleMetrics.map(m => (
                            <span
                              key={m.conditionalMetricId}
                              className='text-xs px-2 py-0.5 rounded-md border border-divider bg-action-hover text-text-secondary'
                            >
                              {m.name}{' '}
                              <span className='font-semibold text-primary'>
                                {m.avgValue != null ? Math.round(m.avgValue * 10) / 10 : 'N/A'}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
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
