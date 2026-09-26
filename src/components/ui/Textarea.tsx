import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'
import { controlClasses } from '@/components/ui/Input'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="field-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={cn(controlClasses, 'min-h-[96px]', error && 'border-red-500', className)}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
})
