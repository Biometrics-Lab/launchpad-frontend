import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const qs = req.nextUrl.search
  const res = await fetch(`${API_BASE}/reports/${id}${qs}`, {
    headers: HEADERS,
    cache: 'no-store'
  })

  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/reports/${id}`, { method: 'DELETE', headers: HEADERS })

  return NextResponse.json(await res.json(), { status: res.status })
}
