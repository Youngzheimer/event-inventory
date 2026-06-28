import { api } from '../api/client'
import type { Container } from '../types'

export async function createContainer(data: {
  eventId: string
  name: string
  description?: string
}): Promise<Container> {
  return api.post<Container>(`/events/${data.eventId}/containers`, data)
}

export async function updateContainer(id: string, data: Partial<Container>): Promise<void> {
  await api.patch(`/containers/${id}`, data)
}

export async function deleteContainer(id: string): Promise<void> {
  await api.delete(`/containers/${id}`)
}

export async function getContainerByCode(code: string): Promise<Container | undefined> {
  try {
    return await api.get<Container>(`/containers/code/${encodeURIComponent(code)}`)
  } catch {
    return undefined
  }
}