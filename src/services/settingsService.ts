import { api } from '../api/client'
import type { Tag, CheckStage } from '../types'

export async function createTag(eventId: string, name: string, color: string): Promise<Tag> {
  return api.post<Tag>(`/events/${eventId}/tags`, { name, color })
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/tags/${id}`)
}

export async function createCheckStage(eventId: string, name: string): Promise<CheckStage> {
  return api.post<CheckStage>(`/events/${eventId}/stages`, { name })
}

export async function updateCheckStage(id: string, data: Partial<CheckStage>): Promise<void> {
  await api.patch(`/stages/${id}`, data)
}

export async function deleteCheckStage(id: string): Promise<void> {
  await api.delete(`/stages/${id}`)
}