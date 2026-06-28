export interface Event {
  id: string
  inviteCode: string
  name: string
  location?: string
  startDate?: string
  endDate?: string
  createdAt: number
  updatedAt: number
}

export interface EventSummary extends Event {
  itemCount?: number
  containerCount?: number
}

export interface Tag {
  id: string
  eventId: string
  name: string
  color: string
}

export interface Origin {
  id: string
  eventId: string
  name: string
  color: string
  isSystem?: boolean
}

export interface CheckStage {
  id: string
  eventId: string
  name: string
  order: number
  excludedOriginIds: string[]
}

export interface Container {
  id: string
  eventId: string
  name: string
  code: string
  description?: string
  createdAt: number
}

export interface Item {
  id: string
  eventId: string
  name: string
  quantity: number
  notes?: string
  originId?: string
  tagIds: string[]
  containerId?: string
  createdAt: number
  updatedAt: number
}

export interface ItemCheck {
  id: string
  itemId: string
  stageId: string
  checked: boolean
  missingCount: number
  missingReason: string
  checkedAt?: number
}

export interface EventSnapshot {
  event: Event
  tags: Tag[]
  origins: Origin[]
  stages: CheckStage[]
  containers: Container[]
  items: Item[]
  checks: ItemCheck[]
}

export const DEFAULT_ORIGINS = [
  { name: '기관 물품', color: '#3b82f6', isSystem: true },
  { name: '개인 물품', color: '#a855f7', isSystem: true },
  { name: '대여 물품', color: '#f59e0b', isSystem: true },
] as const

export const DEFAULT_CHECK_STAGES = [
  '있는지 확인',
  '적재',
  '현장 출발 전 확인',
  '현장에서 확인',
  '도착 이후 확인',
] as const

export const BARCODE_PREFIX = 'EVINV'