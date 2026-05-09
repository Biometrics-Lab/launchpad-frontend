import { notFound } from 'next/navigation'

import DictionaryTable from '@views/dictionaries/DictionaryTable'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

const SLUG_TO_ENDPOINT: Record<string, string> = {
  'age-groups': 'ageGroupDictionaries',
  'data-source-types': 'dataSourceTypeDictionaries',
  'resource-types': 'resourceTypeDictionaries',
  sports: 'sportDictionaries',
  'user-roles': 'userRoleDictionaries'
}

async function getDictionary(slug: string): Promise<DictionaryEntry[]> {
  try {
    const endpoint = SLUG_TO_ENDPOINT[slug]
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: { Authorization: AUTH },
      cache: 'no-store'
    })

    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

type Props = { params: Promise<{ slug: string }> }

const DictionaryPage = async ({ params }: Props) => {
  const { slug } = await params

  if (!SLUG_TO_ENDPOINT[slug]) notFound()

  const data = await getDictionary(slug)

  return <DictionaryTable data={data} />
}

export default DictionaryPage
