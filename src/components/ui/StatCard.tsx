import type { LucideIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/States'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  loading?: boolean
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="rounded-lg bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-16" />
        ) : (
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
        )}
        {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}
