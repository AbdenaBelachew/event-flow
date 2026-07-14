import { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('section pt-8 pb-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium text-brand-600 mb-2">{eyebrow}</p>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-slate-500 text-sm sm:text-base max-w-xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
