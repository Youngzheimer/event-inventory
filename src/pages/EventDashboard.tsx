import { useParams, Link } from 'react-router-dom'
import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { getCheckProgress } from '../services/itemService'
import { cn } from '../lib/utils'

export function EventDashboard() {
  const { eventId } = useParams<{ eventId: string }>()
  const { data, loading } = useEventSnapshot(eventId)

  if (loading && !data) {
    return <div className="p-5 text-center text-slate-400">불러오는 중...</div>
  }

  if (!data?.event) {
    return <div className="p-5 text-center text-slate-400">행사를 찾을 수 없습니다</div>
  }

  const { event, items, containers, stages, checks } = data
  const missingItems = checks.filter((c) => c.missingCount > 0).length

  return (
    <div className="safe-top animate-fade-in">
      <header className="px-5 md:px-8 pt-6 pb-4">
        <Link to="/" className="text-sm text-slate-400 hover:text-slate-300 mb-2 inline-block md:hidden">← 행사 목록</Link>
        <h1 className="text-2xl font-bold">{event.name}</h1>
        {event.location && <p className="text-slate-400 mt-1">{event.location}</p>}
      </header>

      <div className="px-5 md:px-8 grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-w-4xl">
        <StatCard label="물품" value={items.length} color="brand" />
        <StatCard label="상자" value={containers.length} color="accent" />
        {missingItems > 0 && (
          <StatCard label="부족 항목" value={missingItems} color="warning" className="col-span-2" />
        )}
      </div>

      {stages.length > 0 && (
        <div className="px-5 md:px-8 mb-6 max-w-2xl">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">체크 진행률</h2>
          <div className="space-y-3">
            {stages.map((stage) => {
              const progress = getCheckProgress(items, stages, checks, stage.id)
              const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
              return (
                <div key={stage.id} className="rounded-xl bg-surface-raised p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-slate-400">{progress.done}/{progress.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-success' : 'bg-brand-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-5 md:px-8 pb-6 space-y-3 max-w-2xl">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">빠른 작업</h2>
        <QuickAction to={`/events/${eventId}/scan`} icon="scan" label="상자 스캔" desc="상자 내용 확인" />
        <QuickAction to={`/events/${eventId}/items`} icon="items" label="물품 관리" desc="물품 추가 및 체크" />
        <QuickAction to={`/events/${eventId}/containers`} icon="box" label="상자 관리" desc="라벨 인쇄 및 상자 설정" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, className }: { label: string; value: number; color: string; className?: string }) {
  const colors: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/10 border-brand-500/20',
    accent: 'from-accent/20 to-cyan-600/10 border-accent/20',
    warning: 'from-warning/20 to-amber-600/10 border-warning/20',
  }
  return (
    <div className={cn('rounded-2xl bg-gradient-to-br border p-4', colors[color], className)}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

function QuickAction({ to, icon, label, desc }: { to: string; icon: string; label: string; desc: string }) {
  const icons: Record<string, React.ReactNode> = {
    scan: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 4h2m8 0h2M4 4h.01" /></svg>,
    items: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    box: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  }

  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl p-4 transition-all active:scale-[0.98] bg-surface-raised border border-slate-700/50"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-overlay text-slate-300">
        {icons[icon]}
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
      <svg className="w-5 h-5 text-slate-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}