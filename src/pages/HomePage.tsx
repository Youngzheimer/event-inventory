import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEvent, lookupEvents } from '../services/eventService'
import { getJoinedEventIds, addJoinedEvent, removeJoinedEvent } from '../lib/joinedEvents'
import { getEventByInvite } from '../services/eventService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { formatDate } from '../lib/utils'
import type { EventSummary } from '../types'

export function HomePage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadEvents = async () => {
    const ids = getJoinedEventIds()
    if (ids.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }
    try {
      const list = await lookupEvents(ids)
      setEvents(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const event = await createEvent({ name: name.trim(), location: location.trim() || undefined })
      addJoinedEvent(event)
      setShowCreate(false)
      setName('')
      setLocation('')
      navigate(`/events/${event.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = inviteInput.trim()
    if (!code) return
    setJoinError('')
    setSubmitting(true)
    try {
      const event = await getEventByInvite(code)
      addJoinedEvent(event)
      setShowJoin(false)
      setInviteInput('')
      navigate(`/events/${event.id}`)
    } catch {
      setJoinError('코드를 찾을 수 없습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, eventName: string) => {
    if (confirm(`"${eventName}"을(를) 목록에서 제거하시겠습니까?\n(서버 데이터는 유지되며, 초대 코드로 다시 참여할 수 있습니다)`)) {
      removeJoinedEvent(id)
      await loadEvents()
    }
  }

  return (
    <div className="safe-top min-h-screen">
      <header className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PackTrack</h1>
            <p className="text-sm text-slate-400">행사 재고관리</p>
          </div>
        </div>
      </header>

      <div className="px-5 pb-8 space-y-3">
        <Button fullWidth size="lg" onClick={() => setShowCreate(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 행사 만들기
        </Button>
        <Button fullWidth size="lg" variant="secondary" onClick={() => setShowJoin(true)}>
          행사 참여 (초대 코드)
        </Button>

        {!loading && events.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">참여 중인 행사</h2>
            {events.map((event) => (
              <EventCard key={event.id} event={event} onRemove={() => handleDelete(event.id, event.name)} />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="mt-12 text-center text-slate-400">
            <p>참여 중인 행사가 없습니다</p>
            <p className="text-sm text-slate-500 mt-1">새로 만들거나 초대 코드로 참여하세요</p>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="새 행사">
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <Input label="행사명" placeholder="예: 2026 봄 페스티벌" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          <Input label="장소 (선택)" placeholder="예: 올림픽공원" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Button type="submit" fullWidth disabled={!name.trim() || submitting}>
            {submitting ? '생성 중...' : '행사 만들기'}
          </Button>
        </form>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="행사 참여">
        <form onSubmit={handleJoin} className="p-5 space-y-4">
          <Input
            label="초대 코드"
            placeholder="UUID 초대 코드 입력"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            autoFocus
            required
          />
          <p className="text-xs text-slate-500">초대 링크의 코드 또는 행사 ID를 입력하세요</p>
          {joinError && <p className="text-sm text-danger">{joinError}</p>}
          <Button type="submit" fullWidth disabled={!inviteInput.trim() || submitting}>
            {submitting ? '참여 중...' : '참여하기'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

function EventCard({ event, onRemove }: { event: EventSummary; onRemove: () => void }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="block rounded-2xl bg-surface-raised border border-slate-700/50 p-4 hover:border-brand-500/30 transition-all active:scale-[0.98] animate-slide-up"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{event.name}</h3>
          {event.location && <p className="text-sm text-slate-400 mt-0.5">{event.location}</p>}
          {event.startDate && <p className="text-xs text-slate-500 mt-1">{formatDate(event.startDate)}</p>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onRemove() }}
          className="p-2 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10"
          aria-label="목록에서 제거"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-4 mt-3 text-sm text-slate-400">
        <span>물품 {event.itemCount ?? 0}개</span>
        <span>상자 {event.containerCount ?? 0}개</span>
      </div>
    </Link>
  )
}