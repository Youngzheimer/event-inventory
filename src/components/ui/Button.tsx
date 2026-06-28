import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none touch-target',
        fullWidth && 'w-full',
        size === 'sm' && 'px-3 py-2 text-sm',
        size === 'md' && 'px-4 py-3 text-base',
        size === 'lg' && 'px-6 py-4 text-lg',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/25',
        variant === 'secondary' && 'bg-surface-overlay text-slate-200 hover:bg-slate-500',
        variant === 'ghost' && 'bg-transparent text-slate-300 hover:bg-surface-overlay',
        variant === 'danger' && 'bg-danger/20 text-danger hover:bg-danger/30',
        variant === 'success' && 'bg-success/20 text-success hover:bg-success/30',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}