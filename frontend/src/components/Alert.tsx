import { ReactNode } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: ReactNode
  onClose?: () => void
  className?: string
}

const typeStyles = {
  success: {
    container:
      'bg-brand-50/80 border-brand-200/80 ring-1 ring-brand-100',
    icon: 'text-brand-600 bg-brand-100',
    title: 'text-brand-900',
    message: 'text-brand-800',
    Icon: CheckCircle2,
  },
  error: {
    container: 'bg-red-50/80 border-red-200/80 ring-1 ring-red-100',
    icon: 'text-red-600 bg-red-100',
    title: 'text-red-900',
    message: 'text-red-800',
    Icon: AlertCircle,
  },
  warning: {
    container:
      'bg-amber-50/80 border-amber-200/80 ring-1 ring-amber-100',
    icon: 'text-amber-600 bg-amber-100',
    title: 'text-amber-900',
    message: 'text-amber-800',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-brand-50/80 border-brand-200/80 ring-1 ring-brand-100',
    icon: 'text-brand-600 bg-brand-100',
    title: 'text-brand-900',
    message: 'text-brand-800',
    Icon: Info,
  },
}

export default function Alert({
  type,
  title,
  message,
  onClose,
  className,
}: AlertProps) {
  const style = typeStyles[type]
  const Icon = style.Icon

  return (
    <div
      role="alert"
      className={clsx(
        'rounded-2xl p-4 flex items-start gap-3 animate-fade-in',
        style.container,
        className
      )}
    >
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          style.icon
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h4 className={clsx('text-sm font-semibold mb-0.5', style.title)}>
            {title}
          </h4>
        )}
        <div className={clsx('text-sm leading-relaxed', style.message)}>
          {message}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
