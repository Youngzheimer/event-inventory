import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { getInviteLink } from '../api/client'
import { updateEvent } from '../services/eventService'
import {
  createTag, deleteTag,
  createCheckStage, updateCheckStage, deleteCheckStage,
} from '../services/settingsService'
import { createOrigin, deleteOrigin } from '../services/originService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { TagBadge } from '../components/TagBadge'
import { OriginBadge } from '../components/OriginBadge'
import type { CheckStage } from '../types'

const COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#22d3ee', '#34d399', '#f87171', '#ec4899', '#84cc16']

export function SettingsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { data, loading, refresh } = useEventSnapshot(eventId)
  const [showNewTag, setShowNewTag] = useState(false)
  const [showNewOrigin, setShowNewOrigin] = useState(false)
  const [showNewStage, setShowNewStage] = useState(false)
  const [editingStage, setEditingStage] = useState<CheckStage | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLORS[0])
  const [newOriginName, setNewOriginName] = useState('')
  const [newOriginColor, setNewOriginColor] = useState(COLORS[0])
  const [newStageName, setNewStageName] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  const event = data?.event
  const tags = data?.tags ?? []
  const origins = data?.origins ?? []
  const stages = data?.stages ?? []

  useEffect(() => {
    if (event) {
      setEventName(event.name)
      setEventLocation(event.location ?? '')
    }
  }, [event?.id, event?.name, event?.location])

  if (!eventId) return null
  if (loading && !data) return null
  if (!event) return null

  const inviteLink = getInviteLink(event.inviteCode)

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
  }

  const saveEventInfo = async () => {
    const updates: { name?: string; location?: string } = {}
    if (eventName.trim() && eventName !== event.name) updates.name = eventName.trim()
    const loc = eventLocation.trim()
    if (loc !== (event.location ?? '')) updates.location = loc || undefined
    if (Object.keys(updates).length > 0) {
      await updateEvent(eventId, updates)
      refresh()
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    await createTag(eventId, newTagName.trim(), newTagColor)
    setShowNewTag(false)
    setNewTagName('')
    refresh()
  }

  const handleCreateOrigin = async () => {
    if (!newOriginName.trim()) return
    await createOrigin(eventId, newOriginName.trim(), newOriginColor)
    setShowNewOrigin(false)
    setNewOriginName('')
    refresh()
  }

  const handleCreateStage = async () => {
    if (!newStageName.trim()) return
    await createCheckStage(eventId, newStageName.trim())
    setShowNewStage(false)
    setNewStageName('')
    refresh()
  }

  const toggleExcludedOrigin = async (stage: CheckStage, originId: string) => {
    const excluded = stage.excludedOriginIds.includes(originId)
      ? stage.excludedOriginIds.filter((id) => id !== originId)
      : [...stage.excludedOriginIds, originId]
    await updateCheckStage(stage.id, { excludedOriginIds: excluded })
    refresh()
  }

  return (
    <div className="safe-top pb-8 max-w-2xl">
      <header className="px-5 md:px-8 pt-6 pb-4">
        <h1 className="text-xl font-bold">설정</h1>
        <p className="text-sm text-slate-400 mt-0.5">{event.name}</p>
      </header>

      <section className="px-5 md:px-8 mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">행사 정보</h2>
        <div className="rounded-2xl bg-surface-raised p-4 space-y-3">
          <Input
            label="행사명"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            onBlur={saveEventInfo}
          />
          <Input
            label="장소"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            onBlur={saveEventInfo}
            placeholder="장소 입력..."
          />
        </div>
      </section>

      <section className="px-5 md:px-8 mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">팀 초대</h2>
        <p className="text-xs text-slate-500 mb-3">링크 또는 코드를 공유하면 다른 사람이 이 행사에 참여할 수 있습니다.</p>
        <div className="rounded-2xl bg-surface-raised p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">초대 링크</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface border border-slate-600/50 text-sm font-mono text-slate-300 truncate"
              />
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(inviteLink, 'link')}>
                {copied === 'link' ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">초대 코드</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={event.inviteCode}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface border border-slate-600/50 text-sm font-mono text-slate-300"
              />
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(event.inviteCode, 'code')}>
                {copied === 'code' ? '복사됨' : '복사'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">홈 화면에서 코드를 직접 입력해도 참여할 수 있습니다.</p>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-8 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">체크 단계</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowNewStage(true)}>+ 추가</Button>
        </div>
        <p className="text-xs text-slate-500 mb-3">Origin별로 특정 체크 단계를 제외할 수 있습니다.</p>

        <div className="space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.id} className="rounded-2xl bg-surface-raised border border-slate-700/50 overflow-hidden">
              <div className="w-full flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setEditingStage(editingStage?.id === stage.id ? null : stage)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left touch-target"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{stage.name}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`"${stage.name}" 단계를 삭제하시겠습니까?`)) {
                      deleteCheckStage(stage.id).then(refresh)
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-danger touch-target shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {editingStage?.id === stage.id && (
                <div className="px-4 pb-4 border-t border-slate-700/30 animate-slide-up">
                  <p className="text-xs text-slate-400 mt-3 mb-2">제외할 Origin (이 출처의 물품은 이 단계에서 체크하지 않음)</p>
                  <div className="flex flex-wrap gap-2">
                    {origins.map((origin) => {
                      const excluded = stage.excludedOriginIds.includes(origin.id)
                      return (
                        <button
                          key={origin.id}
                          onClick={() => toggleExcludedOrigin(stage, origin.id)}
                          className={`transition-all ${excluded ? 'opacity-100 ring-2 ring-danger ring-offset-1 ring-offset-surface-raised' : 'opacity-40'}`}
                        >
                          <OriginBadge origin={origin} size="md" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-8 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Origin (소유/출처)</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowNewOrigin(true)}>+ 추가</Button>
        </div>
        <p className="text-xs text-slate-500 mb-3">물품당 하나만 선택. 체크 단계 제외 설정에 사용됩니다.</p>

        <div className="space-y-2">
          {origins.map((origin) => (
            <div key={origin.id} className="flex items-center justify-between rounded-xl bg-surface-raised px-4 py-3">
              <OriginBadge origin={origin} size="md" />
              {!origin.isSystem && (
                <button
                  onClick={() => {
                    if (confirm(`"${origin.name}" Origin을 삭제하시겠습니까?`)) {
                      deleteOrigin(origin.id).then(refresh)
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-danger"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">태그</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowNewTag(true)}>+ 추가</Button>
        </div>
        <p className="text-xs text-slate-500 mb-3">분류용 라벨. 여러 개 붙일 수 있습니다.</p>

        <div className="space-y-2">
          {tags.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">등록된 태그 없음</p>
          )}
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-xl bg-surface-raised px-4 py-3">
              <TagBadge tag={tag} size="md" />
              <button
                onClick={() => {
                  if (confirm(`"${tag.name}" 태그를 삭제하시겠습니까?`)) {
                    deleteTag(tag.id).then(refresh)
                  }
                }}
                className="p-1.5 text-slate-500 hover:text-danger"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      <Modal open={showNewOrigin} onClose={() => setShowNewOrigin(false)} title="새 Origin">
        <div className="p-5 space-y-4">
          <Input
            label="Origin명"
            placeholder="예: 협찬 물품"
            value={newOriginName}
            onChange={(e) => setNewOriginName(e.target.value)}
            autoFocus
          />
          <ColorPicker value={newOriginColor} onChange={setNewOriginColor} />
          <Button fullWidth onClick={handleCreateOrigin} disabled={!newOriginName.trim()}>Origin 추가</Button>
        </div>
      </Modal>

      <Modal open={showNewTag} onClose={() => setShowNewTag(false)} title="새 태그">
        <div className="p-5 space-y-4">
          <Input
            label="태그명"
            placeholder="예: 오디오"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            autoFocus
          />
          <ColorPicker value={newTagColor} onChange={setNewTagColor} />
          <Button fullWidth onClick={handleCreateTag} disabled={!newTagName.trim()}>태그 추가</Button>
        </div>
      </Modal>

      <Modal open={showNewStage} onClose={() => setShowNewStage(false)} title="새 체크 단계">
        <div className="p-5 space-y-4">
          <Input
            label="단계명"
            placeholder="예: 귀가 후 확인"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            autoFocus
          />
          <Button fullWidth onClick={handleCreateStage} disabled={!newStageName.trim()}>단계 추가</Button>
        </div>
      </Modal>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-2">색상</label>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full transition-all ${value === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-raised scale-110' : ''}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}