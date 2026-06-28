import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActiveStage } from '../hooks/useActiveStage'
import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { createItem, updateItem, deleteItem } from '../services/itemService'
import { ItemCard } from '../components/ItemCard'
import { ItemForm } from '../components/ItemForm'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { OriginBadge } from '../components/OriginBadge'
import type { Item } from '../types'

export function ItemsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { data, loading, refresh } = useEventSnapshot(eventId)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [filter, setFilter] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [originFilter, setOriginFilter] = useState<string | null>(null)

  const stages = data?.stages ?? []
  const stageIds = stages.map((s) => s.id)
  const { activeStageId, viewMode } = useActiveStage(eventId, stageIds)

  if (!eventId) return null
  if (loading && !data) return null

  const { items, tags, origins, containers, checks } = data!

  const filtered = items.filter((item) => {
    const matchName = !filter || item.name.toLowerCase().includes(filter.toLowerCase())
    const matchTag = !tagFilter || item.tagIds.includes(tagFilter)
    const matchOrigin = !originFilter || item.originId === originFilter
    return matchName && matchTag && matchOrigin
  })

  const handleCreate = async (formData: {
    name: string
    quantity: number
    notes?: string
    originId?: string
    tagIds: string[]
    containerId?: string
  }) => {
    await createItem({ ...formData, eventId })
    setShowForm(false)
    refresh()
  }

  const handleUpdate = async (formData: {
    name: string
    quantity: number
    notes?: string
    originId?: string
    tagIds: string[]
    containerId?: string
  }) => {
    if (!editingItem) return
    await updateItem(editingItem.id, formData)
    setEditingItem(null)
    refresh()
  }

  const handleDelete = async (item: Item) => {
    if (confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) {
      await deleteItem(item.id)
      refresh()
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-lg px-5 md:px-8 pt-4 pb-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">물품</h1>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            추가
          </Button>
        </div>
        <input
          type="search"
          placeholder="물품 검색..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-raised border border-slate-600/50 text-sm"
        />
        {origins.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setOriginFilter(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!originFilter ? 'bg-brand-500 text-white' : 'bg-surface-raised text-slate-400'}`}
            >
              전체 Origin
            </button>
            {origins.map((origin) => (
              <button
                key={origin.id}
                onClick={() => setOriginFilter(originFilter === origin.id ? null : origin.id)}
                className={`shrink-0 transition-all ${originFilter === origin.id ? 'scale-105' : 'opacity-60'}`}
              >
                <OriginBadge origin={origin} />
              </button>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setTagFilter(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!tagFilter ? 'bg-surface-overlay text-slate-300' : 'bg-surface-raised text-slate-500'}`}
            >
              전체 태그
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${tagFilter === tag.id ? 'text-white' : 'bg-surface-raised text-slate-400'}`}
                style={tagFilter === tag.id ? { backgroundColor: tag.color } : undefined}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-5 md:px-8 py-4 space-y-3 max-w-3xl">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p>등록된 물품이 없습니다</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>첫 물품 추가하기</Button>
          </div>
        )}
        {filtered.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            stages={stages}
            checks={checks.filter((c) => c.itemId === item.id)}
            tags={tags}
            origins={origins}
            container={containers.find((c) => c.id === item.containerId)}
            onEdit={() => setEditingItem(item)}
            onDelete={() => handleDelete(item)}
            onUpdate={refresh}
            viewMode={viewMode}
            activeStageId={activeStageId}
          />
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="물품 추가">
        <ItemForm
          eventId={eventId}
          tags={tags}
          origins={origins}
          containers={containers}
          defaultOriginId={originFilter ?? undefined}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="물품 수정">
        {editingItem && (
          <ItemForm
            eventId={eventId}
            tags={tags}
            origins={origins}
            containers={containers}
            initial={editingItem}
            onSubmit={handleUpdate}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>
    </div>
  )
}