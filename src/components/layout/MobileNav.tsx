import { NavLink } from 'react-router-dom'

import { MOBILE_NAV } from '@/config/navigation'
import { cn } from '@/lib/cn'

export function MobileNav() {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium',
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400',
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
