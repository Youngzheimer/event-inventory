import type { Item, CheckStage, ItemCheck } from '../types'
import { getPreviousStageMissing } from '../services/itemService'

interface PreviousStageMissingProps {
  item: Item
  stages: CheckStage[]
  checks: ItemCheck[]
  currentStageId: string
}

export function PreviousStageMissing({ item, stages, checks, currentStageId }: PreviousStageMissingProps) {
  const info = getPreviousStageMissing(item, stages, checks, currentStageId)
  if (!info) return null

  return (
    <div className="px-3 py-2.5 bg-warning/10 border-b border-warning/20">
      <p className="text-xs font-medium text-warning">
        이전 단계 ({info.stage.name}): {info.check.missingCount}개 부족
      </p>
      {info.check.missingReason && (
        <p className="text-xs text-slate-400 mt-0.5">{info.check.missingReason}</p>
      )}
    </div>
  )
}