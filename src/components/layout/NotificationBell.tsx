import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncNotifications,
} from '@/services/notifications'
import type { Notification } from '@/types/models'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        await syncNotifications()
        const rows = await listNotifications()
        if (active) setNotifications(rows)
      } catch (caught) {
        if (active) setError(getErrorMessage(caught))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const unreadCount = notifications.filter((item) => !item.is_read).length

  async function handleMarkRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    )
    try {
      await markNotificationRead(id)
    } catch (caught) {
      setError(getErrorMessage(caught))
    }
  }

  async function handleMarkAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    try {
      await markAllNotificationsRead()
    } catch (caught) {
      setError(getErrorMessage(caught))
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="p-4">
                <Spinner label="Loading notifications" />
              </div>
            )}
            {!loading && error && <p className="p-4 text-sm text-red-600">{error}</p>}
            {!loading && !error && notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                You are all caught up.
              </p>
            )}
            <ul>
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.id)}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="flex w-full items-center gap-2">
                      {!item.is_read && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-brand-600"
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {item.message}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(item.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
