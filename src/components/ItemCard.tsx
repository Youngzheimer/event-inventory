import { useState } from 'react'
import type { Item, CheckStage, ItemCheck, Tag, Origin, Container } from '../types'
import type { CheckViewMode } from '../hooks/useActiveStage'
import { TagBadge } from './TagBadge'
import { OriginBadge } from './OriginBadge'
import { CheckStagePanel } from './CheckStagePanel'
import { CurrentStageCheck } from './CurrentStageCheck'
import { StageHistoryDots } from './StageHistoryDots'
import { getApplicableStages, isStageApplicable } from '../services/itemService'
import { cn } from '../lib/utils'

interface ItemCardProps {
  item: Item
  stages: CheckStage[]
  checks: ItemCheck[]
  tags: Tag[]
  origins: Origin[]
  container?: Container
  viewMode?: CheckViewMode
  activeStageId?: string | null
  onEdit: () => void
  onDelete: () => void
  onUpdate: () => void
  defaultExpanded?: boolean
}

export function ItemCard({
  item,
  stages,
  checks,
  tags,
  origins,
  container,
  viewMode = 'full',
  activeStageId,
  onEdit,
  onDelete,
  onUpdate,
  defaultExpanded = false,
}: ItemCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const itemTags = tags.filter((t) => item.tagIds.includes(t.id))
  const itemOrigin = origins.find((o) => o.id === item.originId)

  const applicableStages = getApplicableStages(item, stages)
  const activeStage = activeStageId ? stages.find((s) => s.id === activeStageId) : null
  const activeCheck = activeStageId ? checks.find((c) => c.stageId === activeStageId) : null
  const activeChecked = activeCheck?.checked ?? false
  const activeApplicable = activeStage ? isStageApplicable(item, activeStage) : false

  const checkedCount = applicableStages.filter((s) => checks.find((c) => c.stageId === s.id)?.checked).length
  const allChecked = applicableStages.length > 0 && checkedCount === applicableStages.length
  const hasMissing = checks.some((c) => !c.checked && c.missingCount > 0)

  const focusMode = viewMode === 'focus' && activeStageId && activeStage

  const cardBorder = focusMode
    ? activeApplicable
      ? activeChecked
        ? 'border-success/30 bg-success/5'
        : !activeChecked && (activeCheck?.missingCount ?? 0) > 0
          ? 'border-warning/30 bg-warning/5'
          : 'border-brand-500/30 bg-brand-500/5'
      : 'border-slate-700/50 bg-surface-raised opacity-60'
    : allChecked
      ? 'border-success/30 bg-success/5'
      : 'border-slate-700/50 bg-surface-raised'

  return (
    <div className={cn('rounded-2xl border transition-all animate-slide-up', cardBorder, hasMissing && !allChecked && !focusMode && 'border-warning/30')}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-0 text-left touch-target"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{item.name}</h3>
              <span className="text-sm text-slate-400 shrink-0">×{item.quantity}</span>
            </div>
            {container && (
              <p className="text-xs text-accent mt-0.5">📦 {container.name}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {itemOrigin && <OriginBadge origin={itemOrigin} />}
              {itemTags.map((t) => <TagBadge key={t.id} tag={t} />)}
            </div>
          </button>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {!focusMode && applicableStages.length > 0 && (
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                allChecked ? 'bg-success/20 text-success' : 'bg-surface-overlay text-slate-400'
              )}>
                {checkedCount}/{applicableStages.length}
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 touch-target"
            >
              <svg
                className={cn('w-5 h-5 text-slate-500 transition-transform', expanded && 'rotate-180')}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {focusMode && activeApplicable && (
          <div className="mt-3">
            <CurrentStageCheck
              item={item}
              stage={activeStage}
              stages={stages}
              checks={checks}
              onUpdate={onUpdate}
              large
            />
          </div>
        )}

        {focusMode && applicableStages.length > 1 && (
          <div className="mt-2">
            <StageHistoryDots
              stages={applicableStages}
              checks={checks}
              activeStageId={activeStageId}
            />
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/30 animate-slide-up">
          {item.notes && (
            <p className="text-sm text-slate-400 py-2">{item.notes}</p>
          )}

          {viewMode === 'full' ? (
            <CheckStagePanel
              item={item}
              stages={stages}
              checks={checks}
              onUpdate={onUpdate}
            />
          ) : focusMode && activeApplicable ? (
            <p className="text-xs text-slate-500 py-2">위에서 현재 단계를 체크하세요. 전체 단계는 &quot;전체&quot; 보기를 사용하세요.</p>
          ) : null}

          <div className="flex gap-2 mt-3">
            <button onClick={onEdit} className="flex-1 py-2 text-sm text-brand-400 font-medium rounded-lg hover:bg-brand-500/10">
              수정
            </button>
            <button onClick={onDelete} className="flex-1 py-2 text-sm text-danger font-medium rounded-lg hover:bg-danger/10">
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}