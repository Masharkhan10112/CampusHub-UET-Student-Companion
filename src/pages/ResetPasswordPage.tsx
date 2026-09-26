import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { passwordProblem } from '@/lib/validation'

/**
 * Supabase turns the recovery link into a session before this page renders, so
 * the presence of a session is what tells us the link was valid.
 */
export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [linkChecked, setLinkChecked] = useState(false)

  useEffect(() => {
    if (!loading) setLinkChecked(true)
  }, [loading])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const problem = passwordProblem(password)
    if (problem) {
      setFieldError(problem)
      return
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.')
      return
    }
    setFieldError(undefined)

    setSubmitting(true)
    try {
      await updatePassword(password)
      toast.success('Password updated', 'You can now use your new password.')
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Choose a new password
      </h1>

      {linkChecked && !session ? (
        <>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            This reset link is invalid or has expired. Request a new one to continue.
          </p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Request a new link
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
            >
              {error}
            </div>
          )}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            error={fieldError}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Update password
          </Button>
        </form>
      )}
    </div>
  )
}
