'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

type Props = {
  sessionId: number
  assessmentId: number
  initialStatus: string | null | undefined
}

const SessionStartStopButtons = ({ sessionId, assessmentId, initialStatus }: Props) => {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' })
      if (res.ok) {
        router.push(`/assessments/${assessmentId}/sessions/${sessionId}/active`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? 'Failed to start session')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? 'Failed to stop session')
      }
    } finally {
      setLoading(false)
    }
  }

  if (status === 'COMPLETE') return null

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex gap-2'>
        {!status && (
          <Button variant='contained' color='success' size='small' disabled={loading} onClick={handleStart}>
            {loading ? 'Starting…' : 'Start Session'}
          </Button>
        )}
        {status === 'ACTIVE' && (
          <>
            <Button
              variant='contained'
              color='primary'
              size='small'
              onClick={() => router.push(`/assessments/${assessmentId}/sessions/${sessionId}/active`)}
            >
              Go Live
            </Button>
            <Button variant='contained' color='error' size='small' disabled={loading} onClick={handleStop}>
              {loading ? 'Stopping…' : 'Stop Session'}
            </Button>
          </>
        )}
      </div>
      {error && <Typography variant='caption' color='error'>{error}</Typography>}
    </div>
  )
}

export default SessionStartStopButtons
