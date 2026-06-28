import type { CheckStage, ItemCheck } from '../types'
import { cn } from '../lib/utils'

interface StageHistoryDotsProps {
  stages: CheckStage[]
  checks: ItemCheck[]
  activeStageId: string
}

export function StageHistoryDots({ stages, checks, activeStageId }: StageHistoryDotsProps) {
  const activeIdx = stages.findIndex((s) => s.id === activeStageId)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stages.map((stage, i) => {
        const check = checks.find((c) => c.stageId === stage.id)
        const isChecked = check?.checked ?? false
        const hasMissing = !isChecked && (check?.missingCount ?? 0) > 0
        const isCurrent = stage.id === activeStageId
        const isFuture = i > activeIdx

        return (
          <div
            key={stage.id}
            title={stage.name}
            className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium',
              isCurrent && 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/40',
              !isCurrent && isChecked && 'text-success/80',
              !isCurrent && !isChecked && hasMissing && 'text-warning/80',
              !isCurrent && !isChecked && !hasMissing && 'text-slate-600',
              isFuture && !isCurrent && 'opacity-50'
            )}
          >
            <span className="w-3 text-center shrink-0">
              {isChecked ? '✓' : hasMissing ? '!' : '○'}
            </span>
            <span className="truncate max-w-[4rem]">{stage.name}</span>
          </div>
        )
      })}
    </div>
  )
}