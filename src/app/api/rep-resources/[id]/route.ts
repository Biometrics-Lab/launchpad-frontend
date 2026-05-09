import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/repResources/${id}`, { method: 'DELETE', headers: { Authorization: AUTH } })
  return NextResponse.json(await res.json(), { status: res.status })
}
