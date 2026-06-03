import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' }

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const body = await req.json()
  const res = await fetch(`${API_BASE}/report-configs/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body)
  })

  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const res = await fetch(`${API_BASE}/report-configs/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: HEADERS
  })

  return NextResponse.json(await res.json(), { status: res.status })
}
