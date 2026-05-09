import OrganisationsTable from '@views/people/OrganisationsTable'
import type { OrganisationType } from '@/types/app/playersTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getOrganisations(): Promise<OrganisationType[]> {
  try {
    const res = await fetch(`${API_BASE}/organisations`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const OrganisationsPage = async () => {
  const organisations = await getOrganisations()

  return <OrganisationsTable organisations={organisations} />
}

export default OrganisationsPage
