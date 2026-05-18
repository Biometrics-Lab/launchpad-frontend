import AssessmentsTable from '@views/assessments/AssessmentsTable'
import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { PlayerType } from '@/types/app/playersTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { ConditionType } from '@/types/app/conditionTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getAssessments(): Promise<AssessmentType[]> {
  try {
    const res = await fetch(`${API_BASE}/assessments`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getPlayers(): Promise<PlayerType[]> {
  try {
    const res = await fetch(`${API_BASE}/players`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getSports(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/sportDictionaries`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getTemplates(): Promise<AssessmentTemplateType[]> {
  try {
    const res = await fetch(`${API_BASE}/assessmentTemplates`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getConditions(): Promise<ConditionType[]> {
  try {
    const res = await fetch(`${API_BASE}/conditions`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

const AssessmentsPage = async () => {
  const [assessments, players, sports, templates, conditions] = await Promise.all([
    getAssessments(), getPlayers(), getSports(), getTemplates(), getConditions()
  ])

  return <AssessmentsTable assessments={assessments} players={players} sports={sports} templates={templates} conditions={conditions} />
}

export default AssessmentsPage
