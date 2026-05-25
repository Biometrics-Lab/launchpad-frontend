import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/players/${id}/metrics`, { headers: HEADERS, cache: 'no-store' })

  return NextResponse.json(await res.json(), { status: res.status })
}
