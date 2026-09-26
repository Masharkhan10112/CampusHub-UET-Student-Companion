import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { passwordProblem } from '@/lib/validation'
import { updateProfile } from '@/services/profile'
import type { Theme } from '@/contexts/ThemeContext'

type NotificationPreferences = {
  assignment_reminders: boolean
  task_reminders: boolean
  study_reminders: boolean
}

type AiPreferences = {
  detail_level: string
  tone: string
}

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, string> = {
  assignment_reminders: 'Assignment deadlines and overdue alerts',
  task_reminders: 'Tasks due today',
  study_reminders: 'Study session reminders',
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function SettingsPage() {
  const { user, profile, setProfile, updatePassword } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    assignment_reminders: true,
    task_reminders: true,
    study_reminders: true,
  })
  const [ai, setAi] = useState<AiPreferences>({ detail_level: 'balanced', tone: 'friendly' })
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [password, setPassword] = useState({ next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!profile) return
    const storedNotifications =
      profile.notification_preferences as Partial<NotificationPreferences> | null
    const storedAi = profile.ai_preferences as Partial<AiPreferences> | null
    setNotifications({
      assignment_reminders: storedNotifications?.assignment_reminders ?? true,
      task_reminders: storedNotifications?.task_reminders ?? true,
      study_reminders: storedNotifications?.study_reminders ?? true,
    })
    setAi({
      detail_level: storedAi?.detail_level ?? 'balanced',
      tone: storedAi?.tone ?? 'friendly',
    })
  }, [profile])

  async function savePreferences() {
    if (!user) return
    setSavingPreferences(true)
    try {
      const updated = await updateProfile(user.id, {
        theme,
        notification_preferences: notifications,
        ai_preferences: ai,
      })
      setProfile(updated)
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Could not save settings', getErrorMessage(error))
    } finally {
      setSavingPreferences(false)
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault()
    const problem = passwordProblem(password.next)
    if (problem) {
      setPasswordError(problem)
      return
    }
    if (password.next !== password.confirm) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordError(undefined)

    setChangingPassword(true)
    try {
      await updatePassword(password.next)
      setPassword({ next: '', confirm: '' })
      toast.success('Password changed')
    } catch (error) {
      toast.error('Could not change your password', getErrorMessage(error))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Appearance, reminders, AI preferences and security."
      />

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose how CampusHub looks on this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium',
                theme === option.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
        <div className="mt-4 space-y-3">
          {(Object.keys(NOTIFICATION_LABELS) as (keyof NotificationPreferences)[]).map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
            >
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(event) =>
                  setNotifications({ ...notifications, [key]: event.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              {NOTIFICATION_LABELS[key]}
            </label>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">AI preferences</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Detail level"
            value={ai.detail_level}
            onChange={(event) => setAi({ ...ai, detail_level: event.target.value })}
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </Select>
          <Select
            label="Tone"
            value={ai.tone}
            onChange={(event) => setAi({ ...ai, tone: event.target.value })}
          >
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="socratic">Socratic</option>
          </Select>
        </div>
        <Button className="mt-4" onClick={savePreferences} loading={savingPreferences}>
          Save preferences
        </Button>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Security</h2>
        <form onSubmit={handlePasswordChange} noValidate className="mt-4 max-w-md space-y-4">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password.next}
            error={passwordError}
            onChange={(event) => setPassword({ ...password, next: event.target.value })}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={password.confirm}
            onChange={(event) => setPassword({ ...password, confirm: event.target.value })}
          />
          <Button type="submit" variant="outline" loading={changingPassword}>
            Change password
          </Button>
        </form>
      </section>
    </>
  )
}
