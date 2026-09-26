import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'
import { isValidEmail } from '@/lib/validation'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setFieldError('Enter a valid email address.')
      return
    }
    setFieldError(undefined)

    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        We will email you a link to choose a new password.
      </p>

      {sent ? (
        <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
          If an account exists for {email}, a reset link is on its way. Check your inbox and spam
          folder.
        </div>
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
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            error={fieldError}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
