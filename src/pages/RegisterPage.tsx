import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { isBlank, isValidEmail, passwordProblem, type FieldErrors } from '@/lib/validation'

type RegisterForm = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  university: string
  department: string
  semester: string
}

const EMPTY: RegisterForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  university: '',
  department: '',
  semester: '1',
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<RegisterForm>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors<RegisterForm>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof RegisterForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextErrors: FieldErrors<RegisterForm> = {}
    if (isBlank(form.fullName)) nextErrors.fullName = 'Full name is required.'
    if (isBlank(form.email)) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.'
    const passwordIssue = passwordProblem(form.password)
    if (passwordIssue) nextErrors.password = passwordIssue
    if (form.password !== form.confirmPassword)
      nextErrors.confirmPassword = 'Passwords do not match.'
    if (isBlank(form.university)) nextErrors.university = 'University is required.'
    if (isBlank(form.department)) nextErrors.department = 'Department is required.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUp({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        university: form.university,
        department: form.department,
        semester: Number(form.semester),
      })

      if (needsEmailConfirmation) {
        toast.success('Account created', 'Check your inbox to confirm your email, then sign in.')
        navigate('/login', { replace: true })
      } else {
        toast.success('Welcome to CampusHub!')
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create your account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Start organising your semester in a couple of minutes.
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
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          error={errors.fullName}
          onChange={(event) => update('fullName', event.target.value)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            value={form.password}
            error={errors.password}
            onChange={(event) => update('password', event.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
          />
        </div>
        <Input
          label="University"
          value={form.university}
          error={errors.university}
          placeholder="University of Engineering and Technology"
          onChange={(event) => update('university', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Department"
            value={form.department}
            error={errors.department}
            placeholder="Computer Science"
            onChange={(event) => update('department', event.target.value)}
          />
          <Select
            label="Semester"
            value={form.semester}
            onChange={(event) => update('semester', event.target.value)}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                Semester {value}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
