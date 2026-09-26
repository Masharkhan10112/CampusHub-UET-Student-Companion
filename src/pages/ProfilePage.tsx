import { Camera } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { isBlank, type FieldErrors } from '@/lib/validation'
import { updateProfile, uploadAvatar } from '@/services/profile'

type FormState = {
  full_name: string
  university: string
  department: string
  semester: string
}

export function ProfilePage() {
  const { user, profile, setProfile } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState<FormState>({
    full_name: '',
    university: '',
    department: '',
    semester: '',
  })
  const [errors, setErrors] = useState<FieldErrors<FormState>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name,
      university: profile.university ?? '',
      department: profile.department ?? '',
      semester: profile.semester ? String(profile.semester) : '',
    })
  }, [profile])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    if (isBlank(form.full_name)) {
      setErrors({ full_name: 'Full name is required.' })
      return
    }
    setErrors({})

    setSaving(true)
    try {
      const updated = await updateProfile(user.id, {
        full_name: form.full_name.trim(),
        university: form.university.trim() || null,
        department: form.department.trim() || null,
        semester: form.semester ? Number(form.semester) : null,
      })
      setProfile(updated)
      toast.success('Profile updated')
    } catch (error) {
      toast.error('Could not update your profile', getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatar(file: File) {
    if (!user) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large', 'Avatars must be 5 MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      const updated = await updateProfile(user.id, { profile_image_url: url })
      setProfile(updated)
      toast.success('Photo updated')
    } catch (error) {
      toast.error('Could not upload the photo', getErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  const initials = (profile?.full_name || profile?.email || 'S')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <PageHeader
        title="Profile"
        description="How CampusHub addresses you and organises your data."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <section className="card flex flex-col items-center gap-3 p-6 text-center">
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
              {initials}
            </span>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{profile?.full_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Camera className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Change photo'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleAvatar(file)
              }}
            />
          </label>
        </section>

        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <Input
            label="Full name"
            value={form.full_name}
            error={errors.full_name}
            onChange={(event) => setForm({ ...form, full_name: event.target.value })}
          />
          <Input
            label="Email"
            value={profile?.email ?? ''}
            disabled
            hint="Email cannot be changed here."
          />
          <Input
            label="University"
            value={form.university}
            onChange={(event) => setForm({ ...form, university: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Department"
              value={form.department}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
            />
            <Select
              label="Semester"
              value={form.semester}
              onChange={(event) => setForm({ ...form, semester: event.target.value })}
            >
              <option value="">Not set</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Semester {value}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
      </div>
    </>
  )
}
