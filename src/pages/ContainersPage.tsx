import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { createContainer, deleteContainer } from '../services/containerService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'

export function ContainersPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { data, loading, refresh } = useEventSnapshot(eventId)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!eventId) return null
  if (loading && !data) return null

  const containers = data?.containers ?? []
  const items = data?.items ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await createContainer({ eventId, name: name.trim(), description: description.trim() || undefined })
      setShowCreate(false)
      setName('')
      setDescription('')
      refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, containerName: string) => {
    if (confirm(`"${containerName}" 상자를 삭제하시겠습니까?`)) {
      await deleteContainer(id)
      refresh()
    }
  }

  return (
    <div className="safe-top">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-lg px-5 pt-6 pb-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">상자 / 적재함</h1>
            <p className="text-sm text-slate-400 mt-0.5">라벨을 인쇄하여 상자에 붙이세요</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            추가
          </Button>
        </div>
      </header>

      <div className="px-5 py-4 space-y-3">
        {containers.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-raised flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p>등록된 상자가 없습니다</p>
            <p className="text-sm text-slate-500 mt-1">상자를 만들고 라벨을 인쇄하세요</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>첫 상자 만들기</Button>
          </div>
        )}

        {containers.map((container) => {
          const itemCount = items.filter((i) => i.containerId === container.id).length
          return (
            <Link
              key={container.id}
              to={`/events/${eventId}/containers/${container.id}`}
              className="block rounded-2xl bg-surface-raised border border-slate-700/50 p-4 hover:border-accent/30 transition-all active:scale-[0.98] animate-slide-up"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">{container.name}</h3>
                    <p className="text-sm text-slate-400">물품 {itemCount}개 · {container.code}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(container.id, container.name) }}
                  className="p-2 rounded-lg text-slate-500 hover:text-danger"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Link>
          )
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="새 상자">
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <Input
            label="상자명"
            placeholder="예: 오디오 케이블 박스 A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <Textarea
            label="설명 (선택)"
            placeholder="이 상자에 들어갈 물품 설명..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Button type="submit" fullWidth disabled={!name.trim() || submitting}>
            {submitting ? '생성 중...' : '상자 만들기'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}