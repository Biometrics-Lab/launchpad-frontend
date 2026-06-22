'use client'

import { useEffect, useRef, useState } from 'react'

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

import type { RepBroadcastDto } from '@/types/app/assessmentTypes'

type Options = {
  sessionId: number
  enabled: boolean
  onRep: (rep: RepBroadcastDto) => void
}

export function useSessionWebSocket({ sessionId, enabled, onRep }: Options) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const onRepRef = useRef(onRep)
  onRepRef.current = onRep

  useEffect(() => {
    if (!enabled) return
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('connected')
        client.subscribe(`/topic/session/${sessionId}/reps`, message => {
          const rep: RepBroadcastDto = JSON.parse(message.body)
          onRepRef.current(rep)
        })
      },
      onDisconnect: () => setStatus('disconnected'),
      onStompError: () => setStatus('disconnected'),
    })
    client.activate()
    return () => { client.deactivate() }
  }, [sessionId, enabled])

  return { connected: status === 'connected', disconnected: status === 'disconnected' }
}
