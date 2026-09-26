import { AlertTriangle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string
  message: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
    >
      <div className="rounded-full bg-red-50 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)}
    />
  )
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-36 w-full" />
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}
