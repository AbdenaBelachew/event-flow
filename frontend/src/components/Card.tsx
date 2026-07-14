import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  variant?: 'default' | 'flat' | 'ghost'
  style?: React.CSSProperties
}

export default function Card({
  children,
  className,
  onClick,
  hoverable = false,
  variant = 'default',
  style,
}: CardProps) {
  const variants = {
    default: 'bg-white border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.06)]',
    flat: 'bg-white border border-slate-200/70',
    ghost: 'bg-slate-50/60 border border-slate-200/60',
  }

  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx(
        'rounded-2xl overflow-hidden transition-all duration-200',
        variants[variant],
        hoverable && 'hover:shadow-lift hover:border-slate-300 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('px-6 py-4 border-b border-slate-200/70', className)}>
      {children}
    </div>
  )
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={clsx('px-6 py-5', className)}>{children}</div>
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'px-6 py-4 border-t border-slate-200/70 bg-slate-50/60',
        className
      )}
    >
      {children}
    </div>
  )
}
