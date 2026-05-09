import MeasurementsTable from '@views/assessments/measurements/MeasurementsTable'
import type { MeasurementType } from '@/types/app/assessmentTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

const getMeasurements = async (): Promise<MeasurementType[]> => {
  try {
    const res = await fetch(`${API_BASE}/measurements`, {
      headers: { Authorization: AUTH },
      cache: 'no-store'
    })

    if (!res.ok) return []

    return res.json()
  } catch {
    return []
  }
}

const MeasurementPage = async () => {
  const data = await getMeasurements()

  return <MeasurementsTable measurementData={data} />
}

export default MeasurementPage
