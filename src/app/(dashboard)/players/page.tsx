import PlayersTable from '@views/people/PlayersTable'
import type { PlayerType, TeamType } from '@/types/app/playersTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getPlayers(): Promise<PlayerType[]> {
  try {
    const res = await fetch(`${API_BASE}/players`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getTeams(): Promise<TeamType[]> {
  try {
    const res = await fetch(`${API_BASE}/teams`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const PlayersPage = async () => {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()])

  return <PlayersTable players={players} teams={teams} />
}

export default PlayersPage
