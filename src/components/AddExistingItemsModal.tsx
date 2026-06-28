import { useState } from 'react'
import type { Item, Origin, Container } from '../types'
import { createItem } from '../services/itemService'
import { Modal } from './ui/Modal'
import { OriginBadge } from './OriginBadge'

interface AddExistingItemsModalProps {
  open: boolean
  onClose: () => void
  eventId: string
  currentContainerId: string
  items: Item[]
  origins: Origin[]
  containers: Container[]
  onAdded: () => void
}

export function AddExistingItemsModal({
  open,
  onClose,
  eventId,
  currentContainerId,
  items,
  origins,
  containers,
  onAdded,
}: AddExistingItemsModalProps) {
  const [search, setSearch] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)

  const available = items.filter((i) => i.containerId !== currentContainerId)
  const filtered = available.filter(
    (i) => !search || i.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (item: Item) => {
    setAddingId(item.id)
    try {
      await createItem({
        eventId,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        originId: item.originId,
        tagIds: item.tagIds,
        containerId: currentContainerId,
      })
      onAdded()
    } finally {
      setAddingId(null)
    }
  }

  const handleClose = () => {
    setSearch('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="기존 물품에서 추가" size="full">
      <div className="p-5 space-y-4">
        <input
          type="search"
          placeholder="물품 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-600/50 text-sm"
          autoFocus
        />

        {available.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>다른 상자에 등록된 물품이 없습니다</p>
            <p className="text-sm text-slate-500 mt-1">새 물품을 직접 추가해 보세요</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const origin = origins.find((o) => o.id === item.originId)
              const source = containers.find((c) => c.id === item.containerId)
              const isAdding = addingId === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={!!addingId}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-slate-700/50 text-left transition-all hover:border-brand-500/40 hover:bg-surface-overlay active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      <span className="text-sm text-slate-400 shrink-0">×{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {origin && <OriginBadge origin={origin} size="sm" />}
                      <span className="text-xs text-slate-500">
                        {source ? source.name : '미지정'}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
                    {isAdding ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}