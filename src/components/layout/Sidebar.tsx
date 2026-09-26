import { GraduationCap, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { NAV_GROUPS } from '@/config/navigation'
import { cn } from '@/lib/cn'

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )
                  }
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <span className="rounded-lg bg-brand-600 p-1.5 text-white">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        CampusHub
      </span>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
      <Brand />
      <NavItems />
    </aside>
  )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div className="relative flex h-full w-72 flex-col bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavItems onNavigate={onClose} />
      </div>
    </div>
  )
}
