import { forwardRef, useId, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export const controlClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlClasses, error && 'border-red-500 dark:border-red-500', className)}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
})
