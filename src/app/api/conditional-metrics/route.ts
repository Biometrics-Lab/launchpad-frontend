import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' }

export async function GET() {
  const res = await fetch(`${API_BASE}/conditionalMetrics`, { headers: HEADERS, cache: 'no-store' })
  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_BASE}/conditionalMetrics`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_BASE}/conditionalMetrics`, { method: 'PUT', headers: HEADERS, body: JSON.stringify(body) })
  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}
