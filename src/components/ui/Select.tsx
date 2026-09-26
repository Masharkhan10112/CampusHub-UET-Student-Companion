import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'
import { controlClasses } from '@/components/ui/Input'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="field-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={cn(controlClasses, 'pr-8', error && 'border-red-500', className)}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
})
