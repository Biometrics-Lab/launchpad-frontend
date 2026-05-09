import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_BASE}/templateMetrics`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })

  return NextResponse.json(await res.json(), { status: res.status })
}
