import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

const ENTITY_MAP: Record<string, string> = {
  'age-groups': 'ageGroupDictionaries',
  'data-source-types': 'dataSourceTypeDictionaries',
  'resource-types': 'resourceTypeDictionaries',
  sports: 'sportDictionaries',
  'user-roles': 'userRoleDictionaries'
}

export async function GET(_req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params
  const backendEntity = ENTITY_MAP[entity]

  if (!backendEntity) return NextResponse.json({ error: 'Unknown dictionary' }, { status: 404 })

  const res = await fetch(`${API_BASE}/${backendEntity}`, {
    headers: { Authorization: AUTH },
    cache: 'no-store'
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}
