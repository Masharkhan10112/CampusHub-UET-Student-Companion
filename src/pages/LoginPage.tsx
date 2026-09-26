import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'
import { isBlank, isValidEmail, type FieldErrors } from '@/lib/validation'

type LoginForm = { email: string; password: string }

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<LoginForm>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextErrors: FieldErrors<LoginForm> = {}
    if (isBlank(form.email)) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (isBlank(form.password)) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await signIn(form.email, form.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/dashboard', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not sign you in.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Sign in to continue to your student dashboard.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
          >
            {formError}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          error={errors.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New to CampusHub?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
