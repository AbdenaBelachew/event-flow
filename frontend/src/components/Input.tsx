import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  rightIcon?: ReactNode
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  rightIcon,
  className,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="label-base">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'input-base',
            icon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1.5 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 mt-1.5">{helperText}</p>
      )}
    </div>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  rows?: number
}

export function TextArea({
  label,
  error,
  helperText,
  className,
  rows = 4,
  ...props
}: TextAreaProps) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="label-base">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'input-base resize-none',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1.5 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 mt-1.5">{helperText}</p>
      )}
    </div>
  )
}
