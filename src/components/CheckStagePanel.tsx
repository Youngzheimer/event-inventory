import { useState } from 'react'
import type { Item, CheckStage, ItemCheck } from '../types'
import { getApplicableStages } from '../services/itemService'
import { toggleItemCheck, updateItemCheckMissing } from '../services/itemService'
import { vibrate, cn } from '../lib/utils'

interface CheckStagePanelProps {
  item: Item
  stages: CheckStage[]
  checks: ItemCheck[]
  onUpdate: () => void
  compact?: boolean
}

export function CheckStagePanel({ item, stages, checks, onUpdate, compact }: CheckStagePanelProps) {
  const applicable = getApplicableStages(item, stages)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  if (applicable.length === 0) {
    return <p className="text-sm text-slate-500">적용 가능한 체크 단계 없음</p>
  }

  const handleToggle = async (stage: CheckStage) => {
    const existing = checks.find((c) => c.stageId === stage.id)
    const newChecked = !existing?.checked
    await toggleItemCheck(item, stage, newChecked)
    vibrate(newChecked ? 15 : 8)
    onUpdate()
  }

  const handleMissingUpdate = async (stageId: string, count: number, reason: string) => {
    await updateItemCheckMissing(item.id, stageId, count, reason)
    onUpdate()
  }

  return (
    <div className={cn('space-y-2', compact && 'space-y-1.5')}>
      {applicable.map((stage) => {
        const check = checks.find((c) => c.stageId === stage.id)
        const isChecked = check?.checked ?? false
        const hasMissing = (check?.missingCount ?? 0) > 0
        const isExpanded = expandedStage === stage.id

        return (
          <div key={stage.id} className="rounded-xl bg-surface/60 overflow-hidden">
            <div
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 transition-colors',
                isChecked && 'bg-success/10',
                hasMissing && !isChecked && 'bg-warning/10'
              )}
            >
              <button
                onClick={() => handleToggle(stage)}
                className="flex items-center gap-3 flex-1 min-w-0 touch-target text-left"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                    isChecked ? 'bg-success border-success' : 'border-slate-500',
                    hasMissing && !isChecked && 'border-warning'
                  )}
                >
                  {isChecked && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {hasMissing && !isChecked && (
                    <span className="text-warning text-xs font-bold">!</span>
                  )}
                </div>
                <span className={cn('flex-1 text-sm font-medium', isChecked && 'text-success')}>
                  {stage.name}
                </span>
                {hasMissing && (
                  <span className="text-xs text-warning font-medium shrink-0">{check?.missingCount}개 부족</span>
                )}
              </button>
              <button
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                className="p-1.5 rounded-lg hover:bg-surface-overlay text-slate-400 touch-target shrink-0"
                aria-label="부족 상세"
              >
                <svg className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-700/30 animate-slide-up">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 shrink-0">부족 수량</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMissingUpdate(stage.id, Math.max(0, (check?.missingCount ?? 0) - 1), check?.missingReason ?? '')}
                      className="w-8 h-8 rounded-lg bg-surface-overlay flex items-center justify-center text-lg font-bold"
                    >−</button>
                    <span className="w-8 text-center font-bold">{check?.missingCount ?? 0}</span>
                    <button
                      onClick={() => handleMissingUpdate(stage.id, Math.min(item.quantity, (check?.missingCount ?? 0) + 1), check?.missingReason ?? '')}
                      className="w-8 h-8 rounded-lg bg-surface-overlay flex items-center justify-center text-lg font-bold"
                    >+</button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="부족 사유 (예: 현장에서 분실)"
                  value={check?.missingReason ?? ''}
                  onChange={(e) => handleMissingUpdate(stage.id, check?.missingCount ?? 0, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-slate-600/50 text-sm"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}