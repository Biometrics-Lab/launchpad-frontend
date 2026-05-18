import ConditionsTable from '@views/conditions/ConditionsTable'
import type { ConditionType } from '@/types/app/conditionTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getConditions(): Promise<ConditionType[]> {
  try {
    const res = await fetch(`${API_BASE}/conditions`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

async function getSports(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/sportDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

const ConditionsPage = async () => {
  const [data, sports] = await Promise.all([getConditions(), getSports()])

  return <ConditionsTable conditionData={data} sports={sports} />
}

export default ConditionsPage
