import IntegrationsTable from '@views/integrations/IntegrationsTable'
import type { IntegrationType } from '@/types/app/integrationTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getIntegrations(): Promise<IntegrationType[]> {
  try {
    const res = await fetch(`${API_BASE}/integrations`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const IntegrationsPage = async () => {
  const integrations = await getIntegrations()

  return <IntegrationsTable integrations={integrations} />
}

export default IntegrationsPage
