import { Navigate, Outlet } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

/** Keeps signed-in students out of login/register; reset-password stays public. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-600" label="Loading CampusHub" />
      </div>
    )
  }

  return session ? <Navigate to="/dashboard" replace /> : <Outlet />
}
