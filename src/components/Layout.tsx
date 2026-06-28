import { Outlet, useParams, useLocation, Link } from 'react-router-dom'
import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { ActiveStageBar } from './ActiveStageBar'
import { cn } from '../lib/utils'

export function Layout() {
  const { eventId } = useParams()
  const location = useLocation()
  const isEventRoute = !!eventId
  const { data } = useEventSnapshot(eventId)
  const event = data?.event

  const navItems = eventId ? [
    { to: `/events/${eventId}`, label: '홈', icon: HomeIcon, exact: true },
    { to: `/events/${eventId}/items`, label: '물품', icon: ItemsIcon },
    { to: `/events/${eventId}/containers`, label: '상자', icon: BoxIcon },
    { to: `/events/${eventId}/scan`, label: '스캔', icon: ScanIcon },
    { to: `/events/${eventId}/settings`, label: '설정', icon: SettingsIcon },
  ] : []

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const showStageBar = isEventRoute
    && !location.pathname.endsWith('/scan')
    && !location.pathname.endsWith('/settings')

  return (
    <div className="min-h-screen flex bg-surface">
      {isEventRoute && (
        <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 bg-surface-raised border-r border-slate-700/50 safe-top safe-bottom sticky top-0 h-screen">
          <div className="px-5 py-6 border-b border-slate-700/30">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-400 mb-3 block">← 행사 목록</Link>
            <h2 className="font-bold text-lg leading-tight truncate">{event?.name ?? '...'}</h2>
            {event?.location && (
              <p className="text-xs text-slate-400 mt-1 truncate">{event.location}</p>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all touch-target',
                  isActive(item.to, item.exact)
                    ? 'bg-brand-500/15 text-brand-400 font-semibold'
                    : 'text-slate-400 hover:bg-surface-overlay hover:text-slate-200'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="px-5 py-4 border-t border-slate-700/30">
            <p className="text-[10px] text-slate-600 font-medium">PackTrack</p>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <main className={cn('flex-1', isEventRoute && 'pb-20 md:pb-0')}>
          {showStageBar && eventId && <ActiveStageBar eventId={eventId} />}
          <Outlet />
        </main>

        {isEventRoute && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-raised/95 backdrop-blur-lg border-t border-slate-700/50 safe-bottom z-40">
            <div className="flex items-stretch justify-around px-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-3 min-w-[64px] touch-target transition-colors',
                    isActive(item.to, item.exact) ? 'text-brand-400' : 'text-slate-500'
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function ItemsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 4h2m8 0h2M4 4h.01" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}