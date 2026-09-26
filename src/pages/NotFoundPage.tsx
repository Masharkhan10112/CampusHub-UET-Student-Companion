import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
