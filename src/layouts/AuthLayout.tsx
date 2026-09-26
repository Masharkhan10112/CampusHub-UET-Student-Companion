import { GraduationCap } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="p-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="rounded-lg bg-brand-600 p-1.5 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            CampusHub
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
