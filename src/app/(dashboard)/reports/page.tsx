import ReportsTable from '@views/reports/ReportsTable'
import type { ReportType } from '@/types/app/reportTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getReports(): Promise<ReportType[]> {
  try {
    const res = await fetch(`${API_BASE}/reports`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const ReportsPage = async () => {
  const reports = await getReports()

  return <ReportsTable reports={reports} />
}

export default ReportsPage
