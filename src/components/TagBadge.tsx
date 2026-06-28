import { cn } from '../lib/utils'
import type { Tag } from '../types'

export function TagBadge({ tag, size = 'sm' }: { tag: Tag; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm'
      )}
      style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}
    >
      {tag.name}
    </span>
  )
}