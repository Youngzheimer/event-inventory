import { api } from '../api/client'
import type { Item, ItemCheck, CheckStage } from '../types'
import { checkId } from '../lib/utils'

export async function createItem(data: {
  eventId: string
  name: string
  quantity: number
  notes?: string
  originId?: string
  tagIds: string[]
  containerId?: string
}): Promise<Item> {
  return api.post<Item>(`/events/${data.eventId}/items`, data)
}

export async function updateItem(id: string, data: Partial<Item>): Promise<void> {
  await api.patch(`/items/${id}`, data)
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/items/${id}`)
}

export function isStageApplicable(item: Item, stage: CheckStage): boolean {
  if (!item.originId) return true
  return !stage.excludedOriginIds.includes(item.originId)
}

export function getApplicableStages(item: Item, stages: CheckStage[]): CheckStage[] {
  return stages.filter((s) => isStageApplicable(item, s))
}

export function getPreviousStage(
  item: Item,
  stages: CheckStage[],
  currentStageId: string
): CheckStage | null {
  const applicable = getApplicableStages(item, stages)
  const idx = applicable.findIndex((s) => s.id === currentStageId)
  if (idx <= 0) return null
  return applicable[idx - 1]
}

export function getPreviousStageMissing(
  item: Item,
  stages: CheckStage[],
  checks: ItemCheck[],
  currentStageId: string
): { stage: CheckStage; check: ItemCheck } | null {
  const prev = getPreviousStage(item, stages, currentStageId)
  if (!prev) return null
  const check = checks.find((c) => c.stageId === prev.id)
  if (!check || check.missingCount <= 0) return null
  return { stage: prev, check }
}

export async function toggleItemCheck(
  item: Item,
  stage: CheckStage,
  checked: boolean
): Promise<ItemCheck> {
  return api.put<ItemCheck>(`/items/${item.id}/checks/${stage.id}`, {
    checked,
    ...(checked ? { missingCount: 0, missingReason: '' } : {}),
  })
}

export async function updateItemCheckMissing(
  itemId: string,
  stageId: string,
  missingCount: number,
  missingReason: string
): Promise<ItemCheck> {
  return api.put<ItemCheck>(`/items/${itemId}/checks/${stageId}`, {
    missingCount,
    missingReason,
    ...(missingCount > 0 ? { checked: false } : {}),
  })
}

export function getCheckProgress(
  items: Item[],
  stages: CheckStage[],
  checks: ItemCheck[],
  stageId: string
): { done: number; total: number } {
  const stage = stages.find((s) => s.id === stageId)
  if (!stage) return { done: 0, total: 0 }

  const applicable = items.filter((i) => isStageApplicable(i, stage))
  const done = applicable.filter((i) => {
    const c = checks.find((ch) => ch.itemId === i.id && ch.stageId === stageId)
    return c?.checked
  }).length

  return { done, total: applicable.length }
}

export { checkId }