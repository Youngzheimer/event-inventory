import { useEventSnapshot } from '../hooks/useEventSnapshot'
import { useActiveStage, type CheckViewMode } from '../hooks/useActiveStage'
import { getCheckProgress } from '../services/itemService'
import { cn } from '../lib/utils'

interface ActiveStageBarProps {
  eventId: string
}

export function ActiveStageBar({ eventId }: ActiveStageBarProps) {
  const { data } = useEventSnapshot(eventId)
  const stages = data?.stages ?? []
  const stageIds = stages.map((s) => s.id)
  const { activeStageId, setActiveStageId, viewMode, setViewMode } = useActiveStage(eventId, stageIds)

  if (stages.length === 0) return null

  const activeStage = stages.find((s) => s.id === activeStageId)
  const progress = data && activeStageId
    ? getCheckProgress(data.items, stages, data.checks, activeStageId)
    : null

  const pct = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0

  return (
    <div className="sticky top-0 z-20 bg-surface-raised/95 backdrop-blur-lg border-b border-slate-700/40 safe-top">
      <div className="px-4 md:px-6 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">현재 체크 단계</p>
            <select
              value={activeStageId ?? ''}
              onChange={(e) => setActiveStageId(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-brand-400 focus:outline-none truncate"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id} className="bg-surface-raised text-slate-100">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {viewMode === 'focus' && activeStage && progress && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{activeStage.name}</span>
              <span>{progress.done}/{progress.total} ({pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-success' : 'bg-brand-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewModeToggle({ mode, onChange }: { mode: CheckViewMode; onChange: (m: CheckViewMode) => void }) {
  return (
    <div className="flex rounded-lg bg-surface p-0.5 shrink-0">
      <button
        onClick={() => onChange('focus')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-all touch-target',
          mode === 'focus' ? 'bg-brand-500 text-white' : 'text-slate-400'
        )}
      >
        현재
      </button>
      <button
        onClick={() => onChange('full')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-all touch-target',
          mode === 'full' ? 'bg-brand-500 text-white' : 'text-slate-400'
        )}
      >
        전체
      </button>
    </div>
  )
}