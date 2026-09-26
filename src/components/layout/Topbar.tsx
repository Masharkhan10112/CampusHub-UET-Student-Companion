import { LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { profile, user, signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error('Could not sign out', getErrorMessage(error))
    }
  }

  const displayName = profile?.full_name || user?.email || 'Student'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-5">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-400 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 sm:max-w-sm"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1">Search...</span>
        <kbd className="hidden rounded border border-slate-200 px-1.5 text-[10px] dark:border-slate-700 sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 dark:text-slate-200 md:block">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
