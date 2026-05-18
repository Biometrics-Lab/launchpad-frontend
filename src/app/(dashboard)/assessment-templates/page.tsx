import AssessmentTemplatesTable from '@views/assessment-templates/AssessmentTemplatesTable'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { ConditionType } from '@/types/app/conditionTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getTemplates(): Promise<AssessmentTemplateType[]> {
  try {
    const res = await fetch(`${API_BASE}/assessmentTemplates`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getSports(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/sportDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getConditions(): Promise<ConditionType[]> {
  try {
    const res = await fetch(`${API_BASE}/conditions`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const AssessmentTemplatePage = async () => {
  const [templates, sports, conditions] = await Promise.all([getTemplates(), getSports(), getConditions()])

  return <AssessmentTemplatesTable templateData={templates} sports={sports} conditions={conditions} />
}

export default AssessmentTemplatePage
