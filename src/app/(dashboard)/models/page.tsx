import ModelsTable from '@views/models/ModelsTable'
import type { ModelType } from '@/types/app/modelTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getModels(): Promise<ModelType[]> {
  try {
    const res = await fetch(`${API_BASE}/models`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getSports(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/sportDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getAgeGroups(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/ageGroupDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const ModelsPage = async () => {
  const [models, sports, ageGroups] = await Promise.all([getModels(), getSports(), getAgeGroups()])

  return <ModelsTable models={models} sports={sports} ageGroups={ageGroups} />
}

export default ModelsPage
