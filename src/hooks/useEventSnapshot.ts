import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { EventSnapshot } from '../types'

const POLL_MS = 4000

export function useEventSnapshot(eventId: string | undefined, refreshKey = 0) {
  const [data, setData] = useState<EventSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!eventId) {
      setData(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const snap = await api.get<EventSnapshot>(`/events/${eventId}/data`)
        if (!cancelled) {
          setData(snap)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '로드 실패')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [eventId, refreshKey, tick])

  return { data, loading, error, refresh }
}