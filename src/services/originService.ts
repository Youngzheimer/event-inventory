import { api } from '../api/client'
import type { Origin } from '../types'

export async function createOrigin(eventId: string, name: string, color: string): Promise<Origin> {
  return api.post<Origin>(`/events/${eventId}/origins`, { name, color })
}

export async function deleteOrigin(id: string): Promise<void> {
  await api.delete(`/origins/${id}`)
}