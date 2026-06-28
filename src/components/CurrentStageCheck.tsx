import { useState } from 'react'
import type { Item, CheckStage, ItemCheck } from '../types'
import { toggleItemCheck, updateItemCheckMissing, isStageApplicable } from '../services/itemService'
import { vibrate, cn } from '../lib/utils'

interface CurrentStageCheckProps {
  item: Item
  stage: CheckStage
  checks: ItemCheck[]
  onUpdate: () => void
  large?: boolean
}

export function CurrentStageCheck({ item, stage, checks, onUpdate, large }: CurrentStageCheckProps) {
  const [expanded, setExpanded] = useState(false)
  const check = checks.find((c) => c.stageId === stage.id)
  const isChecked = check?.checked ?? false
  const hasMissing = (check?.missingCount ?? 0) > 0

  if (!isStageApplicable(item, stage)) {
    return (
      <p className="text-xs text-slate-500 py-1">이 단계 해당 없음</p>
    )
  }

  const handleToggle = async () => {
    const newChecked = !isChecked
    await toggleItemCheck(item, stage, newChecked)
    vibrate(newChecked ? 20 : 10)
    onUpdate()
  }

  const handleMissingUpdate = async (count: number, reason: string) => {
    await updateItemCheckMissing(item.id, stage.id, count, reason)
    onUpdate()
  }

  return (
    <div className={cn(
      'rounded-xl overflow-hidden',
      isChecked ? 'bg-success/15 border border-success/30' : 'bg-brand-500/10 border border-brand-500/25',
      hasMissing && !isChecked && 'bg-warning/10 border-warning/30'
    )}>
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-3 touch-target text-left transition-colors',
          large ? 'px-4 py-4' : 'px-3 py-3'
        )}
      >
        <div
          className={cn(
            'rounded-xl border-2 flex items-center justify-center shrink-0 transition-all',
            large ? 'w-10 h-10' : 'w-8 h-8',
            isChecked ? 'bg-success border-success' : 'border-slate-400',
            hasMissing && !isChecked && 'border-warning'
          )}
        >
          {isChecked && (
            <svg className={cn(large ? 'w-6 h-6' : 'w-5 h-5', 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {hasMissing && !isChecked && (
            <span className="text-warning font-bold">!</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold', large ? 'text-base' : 'text-sm', isChecked && 'text-success')}>
            {stage.name}
          </p>
          {hasMissing && (
            <p className="text-xs text-warning mt-0.5">{check?.missingCount}개 부족</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="p-2 rounded-lg text-slate-400 hover:bg-surface-overlay shrink-0"
          aria-label="부족 상세"
        >
          <svg className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-slate-700/20 animate-slide-up">
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-slate-400 shrink-0">부족 수량</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMissingUpdate(Math.max(0, (check?.missingCount ?? 0) - 1), check?.missingReason ?? '')}
                className="w-8 h-8 rounded-lg bg-surface-overlay font-bold"
              >−</button>
              <span className="w-8 text-center font-bold">{check?.missingCount ?? 0}</span>
              <button
                onClick={() => handleMissingUpdate(Math.min(item.quantity, (check?.missingCount ?? 0) + 1), check?.missingReason ?? '')}
                className="w-8 h-8 rounded-lg bg-surface-overlay font-bold"
              >+</button>
            </div>
          </div>
          <input
            type="text"
            placeholder="부족 사유"
            value={check?.missingReason ?? ''}
            onChange={(e) => handleMissingUpdate(check?.missingCount ?? 0, e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-slate-600/50 text-sm"
          />
        </div>
      )}
    </div>
  )
}