'use client'

import { useRef, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import type { RepResourceBroadcastData } from '@/types/app/assessmentTypes'

const SPEED_OPTIONS = [0.1, 0.25, 0.5, 1, 1.5, 2]

type Props = {
  repId: number | null
  resources: RepResourceBroadcastData[]
  selectedVideoType: string | null
  onVideoTypeChange: (type: string) => void
  speed: number
  onSpeedChange: (speed: number) => void
  loop?: boolean
  onActivity?: () => void
  onPlaying?: () => void
  onPaused?: () => void
  onEnded?: () => void
}

function videoResources(resources: RepResourceBroadcastData[]) {
  return resources.filter(r => r.type.toUpperCase().includes('VIDEO'))
}

const VideoPanel = ({ repId, resources, selectedVideoType, onVideoTypeChange, speed, onSpeedChange, loop = true, onActivity, onPlaying, onPaused, onEnded }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Suppress activity events for 2s after video.load() — browser fires seeking/pause during initial load
  const loadStartRef = useRef<number>(Date.now())
  // Suppress activity events briefly after playbackRate change
  const rateChangingRef = useRef(false)
  const videos = videoResources(resources)

  const active = selectedVideoType
    ? (videos.find(r => r.type === selectedVideoType) ?? videos[0])
    : videos[0]

  // Load new video at current speed — repId in deps so same URL still reloads on rep change
  useEffect(() => {
    const video = videoRef.current
    if (!video || active?.status !== 'READY') return
    loadStartRef.current = Date.now()
    video.load()
    video.playbackRate = speed
    video.play().catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repId, active?.url, active?.status])

  // Apply speed change to current video immediately
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed])

  const renderContent = () => {
    if (!active) {
      return (
        <div className='flex flex-col items-center justify-center gap-2 min-h-48 text-textSecondary'>
          <i className='ri-video-off-line text-4xl' />
          <Typography variant='body2' color='text.secondary'>No video for this rep</Typography>
        </div>
      )
    }
    if (active.status === 'PENDING') {
      return (
        <div className='flex flex-col items-center justify-center gap-2 min-h-48'>
          <CircularProgress size={40} />
          <Typography variant='body2' color='text.secondary'>Processing video…</Typography>
        </div>
      )
    }
    if (active.status === 'FAILED') {
      return (
        <div className='flex flex-col items-center justify-center gap-2 min-h-48 text-textSecondary'>
          <i className='ri-video-off-line text-4xl' />
          <Typography variant='body2' color='text.secondary'>Video unavailable</Typography>
        </div>
      )
    }
    return (
      <div>
        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          loop={loop}
          style={{ width: '100%', display: 'block' }}
          onPlay={() => onPlaying?.()}
          onRateChange={() => { rateChangingRef.current = true; setTimeout(() => { rateChangingRef.current = false }, 500) }}
          onPause={e => {
            const sinceLoad = Date.now() - loadStartRef.current
            if (!e.currentTarget.ended && sinceLoad > 2000 && !rateChangingRef.current) { onPaused?.(); onActivity?.() }
          }}
          onSeeking={() => {
            const sinceLoad = Date.now() - loadStartRef.current
            if (sinceLoad > 2000 && !rateChangingRef.current) onActivity?.()
          }}
          onEnded={() => onEnded?.()}
        >
          <source src={active.url} />
        </video>
        <div className='flex items-center gap-3 px-3 py-2'>
          <Typography variant='caption' color='text.secondary'>Speed</Typography>
          <ToggleButtonGroup
            size='small'
            exclusive
            value={speed}
            onChange={(_, val) => val !== null && onSpeedChange(val)}
          >
            {SPEED_OPTIONS.map(s => (
              <ToggleButton key={s} value={s} sx={{ px: 1.5, py: 0.25, fontSize: 12 }}>
                {s}x
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>
    )
  }

  return (
    <Card className='h-full'>
      <CardHeader
        title='Video'
        action={
          videos.length > 1 ? (
            <ToggleButtonGroup
              size='small'
              exclusive
              value={selectedVideoType ?? videos[0]?.type ?? null}
              onChange={(_, val) => val && onVideoTypeChange(val)}
            >
              {videos.map(r => (
                <ToggleButton key={r.type} value={r.type}>
                  {r.type}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : null
        }
      />
      <CardContent className='p-0'>{renderContent()}</CardContent>
    </Card>
  )
}

export default VideoPanel
