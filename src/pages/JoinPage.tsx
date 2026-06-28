import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByInvite } from '../services/eventService'
import { addJoinedEvent } from '../lib/joinedEvents'

export function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteCode) return

    const join = async () => {
      try {
        const event = await getEventByInvite(inviteCode)
        addJoinedEvent(event)
        navigate(`/events/${event.id}`, { replace: true })
      } catch {
        setError('초대 코드가 올바르지 않거나 행사를 찾을 수 없습니다')
      }
    }

    join()
  }, [inviteCode, navigate])

  if (error) {
    return (
      <div className="safe-top min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-brand-400 font-medium"
        >
          홈으로
        </button>
      </div>
    )
  }

  return (
    <div className="safe-top min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
}