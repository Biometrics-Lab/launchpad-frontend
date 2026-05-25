// src/views/home/DashboardView.tsx
import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'

type PlayerWithMetrics = {
  player: PlayerType
  metrics: PlayerMetricsResponse
}

type Props = {
  players: PlayerWithMetrics[]
  teams: TeamType[]
}

const fmt = (v: number | null): string => (v === null ? 'N/A' : String(v))

const DashboardView = ({ players, teams }: Props) => {
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]))

  if (players.length === 0) {
    return <Typography color='text.secondary'>No players found</Typography>
  }

  return (
    <div className='flex flex-col gap-6'>
      <Typography variant='h4'>Dashboard</Typography>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {players.map(({ player, metrics }) => (
          <Card key={player.id}>
            <CardContent className='flex flex-col gap-3'>
              <div>
                <Link href={`/players/${player.id}`}>
                  <Typography color='primary' className='font-medium'>
                    {player.name}
                  </Typography>
                </Link>
                <Typography variant='caption' color='text.secondary'>
                  {player.teamId ? (teamMap[player.teamId] ?? '—') : '—'} · Class of {player.graduationYear}
                </Typography>
              </div>
              {metrics.overall.length === 0 ? (
                <Typography variant='caption' color='text.secondary'>
                  No metrics recorded yet
                </Typography>
              ) : (
                <div className='flex flex-col gap-2'>
                  {metrics.overall.map(m => (
                    <div key={m.conditionalMetricId}>
                      <Typography variant='caption' color='text.secondary' className='uppercase tracking-wide block'>
                        {m.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        min {fmt(m.minValue)}{'  '}max {fmt(m.maxValue)}{'  '}
                        <Typography component='span' color='primary' variant='body2' className='font-semibold'>
                          avg {fmt(m.avgValue)}
                        </Typography>
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DashboardView
