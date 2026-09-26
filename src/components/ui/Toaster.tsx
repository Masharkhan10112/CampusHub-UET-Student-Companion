import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const TONES = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  error:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
  info: 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg',
              TONES[toast.variant],
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-sm opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
