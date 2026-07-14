import { ReactNode } from 'react'
import { cn } from '../lib/cn'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600',
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60',
  success: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60',
  info: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200/60',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
  success: 'bg-brand-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-slate-400',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
