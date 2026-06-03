import { notFound } from 'next/navigation'

import Link from 'next/link'
import Button from '@mui/material/Button'

import PlayerReportView from '@views/players/PlayerReportView'
import type { PlayerType, TeamType } from '@/types/app/playersTypes'
import type { PlayerMetricsResponse } from '@/types/app/playerMetricsTypes'

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

const emptyMetrics: PlayerMetricsResponse = { overall: [], assessments: [] }

const PlayerReportPage = async ({ params }: Props) => {
  const { id } = await params

  const [player, metrics, teams] = await Promise.all([
    fetchJson<PlayerType | null>(`${API_BASE}/players/${id}`, null),
    fetchJson<PlayerMetricsResponse>(`${API_BASE}/players/${id}/metrics`, emptyMetrics),
    fetchJson<TeamType[]>(`${API_BASE}/teams`, [])
  ])

  if (!player) notFound()

  const teamName = player.teamId ? (teams.find(t => t.id === player.teamId)?.name ?? null) : null

  return (
    <>
      <div className='flex justify-end mb-2'>
        <Link href={`/report?playerId=${id}`}>
          <Button variant='outlined' size='small' startIcon={<i className='ri-bar-chart-2-line' />}>
            View Report
          </Button>
        </Link>
      </div>
      <PlayerReportView player={player} teamName={teamName} metrics={metrics} />
    </>
  )
}

export default PlayerReportPage
