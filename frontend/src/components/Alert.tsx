import { ReactNode } from 'react'
import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle, X } from 'lucide-react'
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
    container: 'bg-green-50 border border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-green-800',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-800',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    message: 'text-yellow-800',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-800',
    Icon: InfoIcon,
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

  return (
    <div
      className={clsx(
        'rounded-lg p-4 flex items-start space-x-4',
        style.container,
        className
      )}
    >
      <style.Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', style.icon)} />
      <div className="flex-1">
        {title && <h3 className={clsx('font-medium', style.title)}>{title}</h3>}
        <p className={style.message}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
