'use client'

import { useEffect, useRef, useState } from 'react'

import type { RepResourceBroadcastData, RepResourceType } from '@/types/app/assessmentTypes'

function mapResource(r: RepResourceType): RepResourceBroadcastData {
  return { id: r.id, type: r.type, url: r.url, status: r.urlStatus ?? 'PENDING' }
}

function allDone(resources: RepResourceBroadcastData[]): boolean {
  return resources.length > 0 && resources.every(r => r.status === 'READY' || r.status === 'FAILED')
}

export function useResourcePoller(
  repId: number | null,
  initialResources: RepResourceBroadcastData[]
) {
  const [resources, setResources] = useState<RepResourceBroadcastData[]>(initialResources)
  const resourcesRef = useRef(resources)

  useEffect(() => {
    setResources(initialResources)
    resourcesRef.current = initialResources
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repId])

  useEffect(() => {
    if (repId === null || allDone(resourcesRef.current)) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reps/${repId}/resources`)
        if (!res.ok) return
        const data: RepResourceType[] = await res.json()
        const mapped = data.map(mapResource)
        resourcesRef.current = mapped
        setResources(mapped)
        if (allDone(mapped)) clearInterval(interval)
      } catch { /* network error — keep polling */ }
    }, 3000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repId])

  return resources
}
