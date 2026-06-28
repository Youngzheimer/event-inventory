import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { updateContainer } from '../services/containerService'
import { createItem, updateItem, deleteItem } from '../services/itemService'
import { ItemCard } from '../components/ItemCard'
import { ItemForm } from '../components/ItemForm'
import { BarcodeLabel } from '../components/BarcodeLabel'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { useActiveStage } from '../hooks/useActiveStage'
import type { Item } from '../types'

export function ContainerDetailPage() {
  const { eventId, containerId } = useParams<{ eventId: string; containerId: string }>()
  const { data, loading, refresh } = useEventSnapshot(eventId)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [showLabel, setShowLabel] = useState(false)
  const [printing, setPrinting] = useState(false)
  const printPendingRef = useRef(false)

  const stages = data?.stages ?? []
  const stageIds = stages.map((s) => s.id)
  const { activeStageId, viewMode } = useActiveStage(eventId, stageIds)

  const container = data?.containers.find((c) => c.id === containerId)
  const event = data?.event
  const items = data?.items.filter((i) => i.containerId === containerId) ?? []
  const tags = data?.tags ?? []
  const origins = data?.origins ?? []
  const checks = data?.checks ?? []
  const allContainers = data?.containers ?? []
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    printPendingRef.current = false
  }, [containerId, container?.code])

  const finishPrint = useCallback(() => {
    document.body.classList.remove('printing-label')
    setPrinting(false)
    printPendingRef.current = false
  }, [])

  useEffect(() => {
    const onAfterPrint = () => finishPrint()
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [finishPrint])

  const handleBarcodeReady = useCallback(() => {
    if (printPendingRef.current) {
      printPendingRef.current = false
      document.body.classList.add('printing-label')
      requestAnimationFrame(() => window.print())
    }
  }, [])

  const handlePrint = () => {
    printPendingRef.current = true
    setPrinting(true)
  }

  if (loading && !data) {
    return <div className="p-5 text-center text-slate-400">불러오는 중...</div>
  }

  if (!container || !eventId) {
    return <div className="p-5 text-center text-slate-400">상자를 찾을 수 없습니다</div>
  }

  const handleRename = async () => {
    if (name.trim()) {
      await updateContainer(container.id, { name: name.trim() })
      setEditingName(false)
      refresh()
    }
  }

  const handleCreateItem = async (formData: {
    name: string
    quantity: number
    notes?: string
    originId?: string
    tagIds: string[]
    containerId?: string
  }) => {
    await createItem({ ...formData, eventId, containerId: container.id })
    setShowForm(false)
    refresh()
  }

  const handleUpdateItem = async (formData: {
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

  const labelContent = event ? (
    <BarcodeLabel
      container={container}
      eventName={event.name}
      size="lg"
      onReady={handleBarcodeReady}
    />
  ) : null

  return (
    <div className="safe-top container-detail-page">
      <header className="px-5 pt-6 pb-4">
        <Link to={`/events/${eventId}/containers`} className="text-sm text-slate-400 hover:text-slate-300 mb-3 inline-block">
          ← 상자 목록
        </Link>

        {editingName ? (
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="flex-1" />
            <Button size="sm" onClick={handleRename}>저장</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>취소</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{container.name}</h1>
              <p className="text-sm text-slate-400 font-mono mt-1">{container.code}</p>
            </div>
            <button
              onClick={() => { setName(container.name); setEditingName(true) }}
              className="p-2 rounded-lg text-slate-400 hover:bg-surface-overlay"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </header>

      <div className="px-5 mb-4">
        <div className="rounded-2xl bg-surface-raised border border-slate-700/50 p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">물품 종류</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalQuantity}</p>
              <p className="text-xs text-slate-400 mt-0.5">총 수량</p>
            </div>
          </div>
          {container.description && (
            <p className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-700/30">{container.description}</p>
          )}
        </div>
      </div>

      <div className="px-5 flex gap-2 mb-4">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => setShowLabel(!showLabel)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {showLabel ? '라벨 숨기기' : '라벨 보기'}
        </Button>
        <Button size="sm" className="flex-1" onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          물품 추가
        </Button>
      </div>

      {showLabel && (
        <div className="px-5 mb-4">
          <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg">
            {labelContent}
          </div>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-3"
            onClick={handlePrint}
            disabled={printing}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {printing ? '인쇄 준비 중...' : '라벨 인쇄'}
          </Button>
        </div>
      )}

      <div className="px-5 pb-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          포함 물품 ({items.length})
        </h2>

        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400 rounded-2xl bg-surface-raised border border-dashed border-slate-600">
            <p>이 상자에 물품이 없습니다</p>
            <Button className="mt-3" size="sm" onClick={() => setShowForm(true)}>물품 추가</Button>
          </div>
        )}

        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            stages={stages}
            checks={checks.filter((c) => c.itemId === item.id)}
            tags={tags}
            origins={origins}
            onEdit={() => setEditingItem(item)}
            onDelete={async () => {
              if (confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) {
                await deleteItem(item.id)
                refresh()
              }
            }}
            onUpdate={refresh}
            viewMode={viewMode}
            activeStageId={activeStageId}
            defaultExpanded={viewMode === 'full'}
          />
        ))}
      </div>

      {printing && createPortal(
        <div className="print-label-portal">
          {labelContent}
        </div>,
        document.body
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="물품 추가">
        <ItemForm
          eventId={eventId}
          tags={tags}
          origins={origins}
          containers={allContainers}
          defaultContainerId={container.id}
          onSubmit={handleCreateItem}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="물품 수정">
        {editingItem && (
          <ItemForm
            eventId={eventId}
            tags={tags}
            origins={origins}
            containers={allContainers}
            initial={editingItem}
            onSubmit={handleUpdateItem}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>
    </div>
  )
}