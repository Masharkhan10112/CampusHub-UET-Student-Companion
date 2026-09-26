import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import type { Priority } from '@/types/models'

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200',
} as const

export type BadgeTone = keyof typeof TONES

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger',
}

export const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-600',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]}>
      <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[priority])} aria-hidden="true" />
      <span className="capitalize">{priority}</span>
    </Badge>
  )
}
