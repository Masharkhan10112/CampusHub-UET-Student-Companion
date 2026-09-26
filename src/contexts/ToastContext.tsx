import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

export type ToastContextValue = {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title, description) => push({ title, description, variant: 'success' }),
      error: (title, description) => push({ title, description, variant: 'error' }),
    }),
    [toasts, push, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
