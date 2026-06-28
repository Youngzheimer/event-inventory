import { useState, useEffect, useCallback } from 'react'

export type CheckViewMode = 'full' | 'focus'

const STAGE_KEY = (eventId: string) => `packtrack_active_stage_${eventId}`
const VIEW_KEY = (eventId: string) => `packtrack_check_view_${eventId}`

function readStageId(eventId: string): string | null {
  try {
    return localStorage.getItem(STAGE_KEY(eventId))
  } catch {
    return null
  }
}

function readViewMode(eventId: string): CheckViewMode {
  try {
    return localStorage.getItem(VIEW_KEY(eventId)) === 'full' ? 'full' : 'focus'
  } catch {
    return 'focus'
  }
}

export function useActiveStage(eventId: string | undefined, stageIds: string[] = []) {
  const [activeStageId, setActiveStageIdState] = useState<string | null>(null)
  const [viewMode, setViewModeState] = useState<CheckViewMode>('focus')

  useEffect(() => {
    if (!eventId) return
    setViewModeState(readViewMode(eventId))
    const stored = readStageId(eventId)
    if (stored) setActiveStageIdState(stored)
  }, [eventId])

  useEffect(() => {
    if (!eventId || stageIds.length === 0) return
    const stored = readStageId(eventId)
    const valid = stored && stageIds.includes(stored)
    const id = valid ? stored! : stageIds[0]
    setActiveStageIdState(id)
    if (!valid) {
      try {
        localStorage.setItem(STAGE_KEY(eventId), id)
      } catch { /* ignore */ }
    }
  }, [eventId, stageIds.join(',')])

  const setActiveStageId = useCallback((id: string) => {
    if (!eventId) return
    setActiveStageIdState(id)
    try {
      localStorage.setItem(STAGE_KEY(eventId), id)
    } catch { /* ignore */ }
  }, [eventId])

  const setViewMode = useCallback((mode: CheckViewMode) => {
    if (!eventId) return
    setViewModeState(mode)
    try {
      localStorage.setItem(VIEW_KEY(eventId), mode)
    } catch { /* ignore */ }
  }, [eventId])

  return { activeStageId, setActiveStageId, viewMode, setViewMode }
}