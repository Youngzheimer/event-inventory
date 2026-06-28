import { useState } from 'react'
import type { Item, Tag, Origin, Container } from '../types'
import { Button } from './ui/Button'
import { Input, Textarea } from './ui/Input'
import { TagBadge } from './TagBadge'
import { OriginBadge } from './OriginBadge'
import { cn } from '../lib/utils'

interface ItemFormProps {
  eventId: string
  tags: Tag[]
  origins: Origin[]
  containers: Container[]
  initial?: Partial<Item>
  defaultContainerId?: string
  defaultOriginId?: string
  onSubmit: (data: {
    name: string
    quantity: number
    notes?: string
    originId?: string
    tagIds: string[]
    containerId?: string
  }) => Promise<void>
  onCancel: () => void
}

export function ItemForm({ tags, origins, containers, initial, defaultContainerId, defaultOriginId, onSubmit, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [originId, setOriginId] = useState(initial?.originId ?? defaultOriginId ?? '')
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? [])
  const [containerId, setContainerId] = useState(initial?.containerId ?? defaultContainerId ?? '')
  const [loading, setLoading] = useState(false)

  const toggleTag = (id: string) => {
    setTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])
  }

  const selectOrigin = (id: string) => {
    setOriginId((prev) => prev === id ? '' : id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        quantity,
        notes: notes.trim() || undefined,
        originId: originId || undefined,
        tagIds,
        containerId: containerId || undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <Input
        label="물품명"
        placeholder="예: XLR 케이블 5m"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        required
      />

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">수량</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-12 rounded-xl bg-surface-overlay text-xl font-bold touch-target"
          >−</button>
          <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-12 h-12 rounded-xl bg-surface-overlay text-xl font-bold touch-target"
          >+</button>
        </div>
      </div>

      {origins.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">소유/출처 (Origin)</label>
          <p className="text-xs text-slate-500 mb-2">물품당 하나만 선택</p>
          <div className="flex flex-wrap gap-2">
            {origins.map((origin) => (
              <button
                key={origin.id}
                type="button"
                onClick={() => selectOrigin(origin.id)}
                className={cn(
                  'rounded-lg transition-all',
                  originId === origin.id ? 'ring-2 ring-offset-2 ring-offset-surface-raised scale-105' : 'opacity-50'
                )}
                style={{ ringColor: origin.color } as React.CSSProperties}
              >
                <OriginBadge origin={origin} size="md" />
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">태그</label>
          <p className="text-xs text-slate-500 mb-2">분류용 라벨, 여러 개 선택 가능</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  'rounded-full transition-all',
                  tagIds.includes(tag.id) ? 'ring-2 ring-offset-2 ring-offset-surface-raised' : 'opacity-50'
                )}
                style={{ ringColor: tag.color } as React.CSSProperties}
              >
                <TagBadge tag={tag} size="md" />
              </button>
            ))}
          </div>
        </div>
      )}

      {containers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">상자/적재함</label>
          <select
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-slate-600/50 text-slate-100"
          >
            <option value="">미지정</option>
            {containers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <Textarea
        label="메모"
        placeholder="추가 정보..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" fullWidth onClick={onCancel}>취소</Button>
        <Button type="submit" fullWidth disabled={!name.trim() || loading}>
          {loading ? '저장 중...' : initial?.id ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}