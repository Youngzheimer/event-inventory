import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-400 mb-1.5">{label}</span>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-surface border border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <span className="text-sm text-danger mt-1 block">{error}</span>}
    </label>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-400 mb-1.5">{label}</span>}
      <textarea
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-surface border border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none',
          className
        )}
        {...props}
      />
    </label>
  )
}