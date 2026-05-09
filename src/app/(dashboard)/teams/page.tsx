import TeamsTable from '@views/people/TeamsTable'
import type { TeamType, OrganisationType } from '@/types/app/playersTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getTeams(): Promise<TeamType[]> {
  try {
    const res = await fetch(`${API_BASE}/teams`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getOrganisations(): Promise<OrganisationType[]> {
  try {
    const res = await fetch(`${API_BASE}/organisations`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getSports(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/sportDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const TeamsPage = async () => {
  const [teams, organisations, sports] = await Promise.all([getTeams(), getOrganisations(), getSports()])

  return <TeamsTable teams={teams} organisations={organisations} sports={sports} />
}

export default TeamsPage
