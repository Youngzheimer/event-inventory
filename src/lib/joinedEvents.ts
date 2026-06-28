import type { Event } from '../types'

const KEY = 'packtrack_joined_events'

interface JoinedEntry {
  id: string
  name: string
  inviteCode: string
  joinedAt: number
}

function read(): JoinedEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(entries: JoinedEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function getJoinedEventIds(): string[] {
  return read().map((e) => e.id)
}

export function addJoinedEvent(event: Event) {
  const entries = read().filter((e) => e.id !== event.id)
  entries.unshift({
    id: event.id,
    name: event.name,
    inviteCode: event.inviteCode,
    joinedAt: Date.now(),
  })
  write(entries)
}

export function removeJoinedEvent(id: string) {
  write(read().filter((e) => e.id !== id))
}