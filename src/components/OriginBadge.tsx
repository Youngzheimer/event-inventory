import { cn } from '../lib/utils'
import type { Origin } from '../types'

export function OriginBadge({ origin, size = 'sm' }: { origin: Origin; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm'
      )}
      style={{ backgroundColor: `${origin.color}22`, color: origin.color, border: `1px solid ${origin.color}55` }}
    >
      {origin.name}
    </span>
  )
}