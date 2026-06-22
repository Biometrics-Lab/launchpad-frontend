'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid2 from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import CustomAvatar from '@core/components/mui/Avatar'

import type { RepBroadcastDto } from '@/types/app/assessmentTypes'

import MetricsPanel from './MetricsPanel'
import RepListPanel from './RepListPanel'
import VideoPanel from './VideoPanel'
import { useResourcePoller } from './useResourcePoller'
import { useSessionWebSocket } from './useSessionWebSocket'

type Props = {
  sessionId: number
  assessmentId: number
  initialStatus: string | null
  playerName: string
  templateName: string
  conditionName: string | null
  initialReps: RepBroadcastDto[]
  expectedMetrics: { conditionalMetricId: number; name: string }[]
}

const ActiveSessionView = ({
  sessionId,
  assessmentId,
  initialStatus,
  playerName,
  templateName,
  conditionName,
  initialReps,
  expectedMetrics,
}: Props) => {
  const router = useRouter()

  const [started, setStarted] = useState(initialStatus === 'ACTIVE' || initialStatus === 'COMPLETE')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [reps, setReps] = useState<RepBroadcastDto[]>(initialReps)
  const [currentRepId, setCurrentRepId] = useState<number | null>(initialReps[initialReps.length - 1]?.id ?? null)
  const [selectedVideoType, setSelectedVideoType] = useState<string | null>(null)
  const [speed, setSpeed] = useState(1)
  const [stopping, setStopping] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)
  const [stopped, setStopped] = useState(initialStatus === 'COMPLETE')
  const stoppedRef = useRef(initialStatus === 'COMPLETE')

  const [latestRepId, setLatestRepId] = useState<number | null>(initialReps[initialReps.length - 1]?.id ?? null)
  const hasPendingRep = latestRepId !== null && latestRepId !== currentRepId

  // Refs for auto-switch logic (avoids stale closures in interval)
  const latestRepIdRef = useRef<number | null>(initialReps[initialReps.length - 1]?.id ?? null)
  const currentRepIdRef = useRef<number | null>(initialReps[initialReps.length - 1]?.id ?? null)
  const videoStateRef = useRef<'playing' | 'paused' | 'ended'>('playing')
  const lastActivityRef = useRef<{ ts: number; repId: number } | null>(null)
  // When the first new-rep gap opened (current fell behind latest). Used for the "no-interaction 10s" path.
  const newRepArrivedAtRef = useRef<number | null>(null)

  // Keep currentRepIdRef in sync with state
  useEffect(() => { currentRepIdRef.current = currentRepId }, [currentRepId])

  // Auto-switch interval
  useEffect(() => {
    const interval = setInterval(() => {
      const latest = latestRepIdRef.current
      if (!latest || latest === currentRepIdRef.current) return
      if (stoppedRef.current) return

      const now = Date.now()
      const state = videoStateRef.current
      console.log('[Interval] lastActivity=', lastActivityRef.current, 'cur=', currentRepIdRef.current, 'latest=', latest)
      const interacted = lastActivityRef.current !== null && lastActivityRef.current.repId === currentRepIdRef.current
      const inactiveSecs = interacted ? (now - lastActivityRef.current!.ts) / 1000 : null

      if (interacted) {
        // User paused or seeked: wait for end + 10s, or 20s paused fallback
        if (state === 'ended' && inactiveSecs! >= 10) { console.log('[Switch] lastActivity before switch:', lastActivityRef.current); lastActivityRef.current = null; setCurrentRepId(latest); setLatestRepId(latest) }
        else if (state === 'paused' && inactiveSecs! >= 20) { console.log('[Switch] lastActivity before switch:', lastActivityRef.current); lastActivityRef.current = null; setCurrentRepId(latest); setLatestRepId(latest) }
      } else {
        // No interaction: switch on end, or after 10s safety-net
        if (state === 'ended') {
          console.log('[Switch] lastActivity before switch:', lastActivityRef.current)
          setCurrentRepId(latest); setLatestRepId(latest)
        } else if (newRepArrivedAtRef.current && (now - newRepArrivedAtRef.current) >= 10_000) {
          console.log('[Switch] lastActivity before switch:', lastActivityRef.current)
          setCurrentRepId(latest); setLatestRepId(latest)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleVideoActivity = useCallback(() => {
    if (currentRepIdRef.current === null) return
    lastActivityRef.current = { ts: Date.now(), repId: currentRepIdRef.current }
    console.trace('[Activity] lastActivityRef set')
  }, [])
  const handleVideoPlaying = useCallback(() => { videoStateRef.current = 'playing' }, [])
  const handleVideoPaused = useCallback(() => { videoStateRef.current = 'paused' }, [])
  const handleVideoEnded = useCallback(() => { videoStateRef.current = 'ended' }, [])

  const handleRepSelect = useCallback((id: number) => {
    setCurrentRepId(id)
    lastActivityRef.current = { ts: Date.now(), repId: id }
    newRepArrivedAtRef.current = null
  }, [])

  // Reset video + interaction state whenever the viewed rep changes
  useEffect(() => {
    videoStateRef.current = 'playing'
    lastActivityRef.current = null
  }, [currentRepId])

  const { disconnected } = useSessionWebSocket({
    sessionId,
    enabled: started && !stopped,
    onRep: (rep: RepBroadcastDto) => {
      setReps(prev => [...prev, rep])
      // If nothing is showing yet, jump immediately
      if (currentRepIdRef.current === null) {
        setCurrentRepId(rep.id)
        latestRepIdRef.current = rep.id
        setLatestRepId(rep.id)
        lastActivityRef.current = null
        return
      }
      // Record when the gap first opened (don't overwrite if already behind)
      if (latestRepIdRef.current === currentRepIdRef.current) {
        newRepArrivedAtRef.current = Date.now()
      }
      latestRepIdRef.current = rep.id
      setLatestRepId(rep.id)
    },
  })

  const currentRep = reps.find(r => r.id === currentRepId) ?? null
  const resources = useResourcePoller(currentRep?.id ?? null, currentRep?.resources ?? [])
  const currentRepMetrics = currentRep?.metrics ?? []

  const handleStart = async () => {
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start session')
      setStarted(true)
    } catch {
      setStartError('Failed to start session. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    setStopping(true)
    setStopError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to stop session')
      stoppedRef.current = true
      setStopped(true)
    } catch {
      setStopError('Failed to stop session. Please try again.')
    } finally {
      setStopping(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header Card */}
      <Card>
        <CardContent className='flex items-start justify-between gap-4 flex-wrap py-4!'>
          <div className='flex items-center gap-4'>
            <CustomAvatar variant='rounded' skin='light' color={stopped ? 'warning' : 'success'} sx={{ width: 52, height: 52, fontSize: 28 }}>
              <i className='ri-run-line' />
            </CustomAvatar>
            <div>
            <div className='flex items-center gap-3 flex-wrap'>
              <Typography variant='h5'>{playerName}</Typography>
              {conditionName && (
                <Typography variant='body1' color='text.secondary'>· {conditionName}</Typography>
              )}
              <Typography variant='body1' color='text.secondary'>· {templateName}</Typography>
              {started && <Chip label={stopped ? 'COMPLETED' : 'ACTIVE'} variant='tonal' color={stopped ? 'warning' : 'success'} size='small' />}
            </div>
            <Typography variant='body2' color='text.secondary' className='mbs-1'>
              Session #{sessionId} · Assessment #{assessmentId}
            </Typography>
            </div>
          </div>
          <div className='flex flex-col items-end gap-1'>
            {!started ? (
              <Button
                variant='contained'
                color='success'
                startIcon={starting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-play-circle-line' />}
                disabled={starting}
                onClick={handleStart}
              >
                Start Session
              </Button>
            ) : stopped ? (
              <Button
                variant='outlined'
                startIcon={<i className='ri-close-line' />}
                onClick={() => router.push(`/assessments/${assessmentId}`)}
              >
                Close
              </Button>
            ) : (
              <Button
                variant='contained'
                color='error'
                startIcon={stopping ? <CircularProgress size={16} color='inherit' /> : <i className='ri-stop-circle-line' />}
                disabled={stopping}
                onClick={handleStop}
              >
                Stop Session
              </Button>
            )}
            {startError && <Typography variant='caption' color='error'>{startError}</Typography>}
            {stopError && <Typography variant='caption' color='error'>{stopError}</Typography>}
          </div>
        </CardContent>
      </Card>

      {disconnected && started && !stopped && (
        <Alert severity='warning'>
          Live connection lost — reps may be delayed
        </Alert>
      )}

      {/* 3-column layout */}
      <Grid2 container spacing={6}>
        <Grid2 size={3}>
          <RepListPanel reps={reps} currentRepId={currentRepId} onRepSelect={handleRepSelect} />
        </Grid2>
        <Grid2 size={3}>
          <MetricsPanel expectedMetrics={expectedMetrics} currentRepMetrics={currentRepMetrics} />
        </Grid2>
        <Grid2 size={6}>
          <VideoPanel
            repId={currentRepId}
            resources={resources}
            selectedVideoType={selectedVideoType}
            onVideoTypeChange={setSelectedVideoType}
            speed={speed}
            onSpeedChange={setSpeed}
            loop={!hasPendingRep}
            onActivity={handleVideoActivity}
            onPlaying={handleVideoPlaying}
            onPaused={handleVideoPaused}
            onEnded={handleVideoEnded}
          />
        </Grid2>
      </Grid2>
    </div>
  )
}

export default ActiveSessionView
