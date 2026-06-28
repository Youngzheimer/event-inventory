import { api } from '../api/client'
import type { Event, EventSummary } from '../types'

export async function createEvent(data: {
  name: string
  location?: string
  startDate?: string
  endDate?: string
}): Promise<Event> {
  return api.post<Event>('/events', data)
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  return api.patch<Event>(`/events/${id}`, data)
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`)
}

export async function getEvent(id: string): Promise<Event> {
  return api.get<Event>(`/events/${id}`)
}

export async function getEventByInvite(code: string): Promise<Event> {
  return api.get<Event>(`/events/invite/${encodeURIComponent(code.trim())}`)
}

export async function lookupEvents(ids: string[]): Promise<EventSummary[]> {
  if (ids.length === 0) return []
  return api.post<EventSummary[]>('/events/lookup', { ids })
}