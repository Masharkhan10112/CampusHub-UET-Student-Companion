import { CalendarDays, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { formatTime } from '@/lib/format'
import { isBlank, type FieldErrors } from '@/lib/validation'
import { listCourses } from '@/services/courses'
import {
  createTimetableEntry,
  deleteTimetableEntry,
  listTimetable,
  updateTimetableEntry,
} from '@/services/timetable'
import { DAY_NAMES, WEEK_ORDER, type TimetableWithCourse } from '@/types/models'

type FormState = {
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
}

const EMPTY_FORM: FormState = {
  course_id: '',
  day_of_week: '1',
  start_time: '08:30',
  end_time: '10:00',
  room: '',
}

async function loadTimetable() {
  const [entries, courses] = await Promise.all([listTimetable(), listCourses()])
  return { entries, courses }
}

export function TimetablePage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(loadTimetable)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TimetableWithCourse | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors<FormState>>({})
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TimetableWithCourse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const entries = useMemo(() => data?.entries ?? [], [data])
  const courses = useMemo(() => data?.courses ?? [], [data])
  const todayIndex = new Date().getDay()

  useEffect(() => {
    if (!modalOpen) return
    setErrors({})
    setForm(
      editing
        ? {
            course_id: editing.course_id,
            day_of_week: String(editing.day_of_week),
            start_time: formatTime(editing.start_time),
            end_time: formatTime(editing.end_time),
            room: editing.room ?? '',
          }
        : { ...EMPTY_FORM, course_id: courses[0]?.id ?? '' },
    )
  }, [modalOpen, editing, courses])

  const byDay = useMemo(() => {
    const grouped = new Map<number, TimetableWithCourse[]>()
    for (const day of WEEK_ORDER) grouped.set(day, [])
    for (const entry of entries) grouped.get(entry.day_of_week)?.push(entry)
    return grouped
  }, [entries])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    const nextErrors: FieldErrors<FormState> = {}
    if (isBlank(form.course_id)) nextErrors.course_id = 'Choose a course.'
    if (isBlank(form.start_time)) nextErrors.start_time = 'Start time is required.'
    if (isBlank(form.end_time)) nextErrors.end_time = 'End time is required.'
    else if (form.end_time <= form.start_time)
      nextErrors.end_time = 'End time must be after the start time.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      course_id: form.course_id,
      day_of_week: Number(form.day_of_week),
      start_time: `${form.start_time}:00`,
      end_time: `${form.end_time}:00`,
      room: form.room.trim() || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateTimetableEntry(editing.id, payload)
        toast.success('Class updated')
      } else {
        await createTimetableEntry(payload, user.id)
        toast.success('Class added')
      }
      setModalOpen(false)
      setEditing(null)
      await reload()
    } catch (caught) {
      toast.error('Could not save class', getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteTimetableEntry(pendingDelete.id)
      toast.success('Class removed')
      setPendingDelete(null)
      await reload()
    } catch (caught) {
      toast.error('Could not remove class', getErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Timetable"
        description="Your weekly class schedule, Sunday through Saturday."
        actions={
          <Button onClick={openCreate} disabled={courses.length === 0}>
            <Plus className="h-4 w-4" /> Add class
          </Button>
        }
      />

      {loading && (
        <div className="card">
          <ListSkeleton rows={5} />
        </div>
      )}
      {!loading && error && (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="Add a course first"
            message="Timetable entries are linked to a course, so add your courses before building the schedule."
          />
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {WEEK_ORDER.map((day) => {
            const dayEntries = byDay.get(day) ?? []
            return (
              <section
                key={day}
                className={cn('card flex flex-col', day === todayIndex && 'ring-2 ring-brand-500')}
                aria-label={DAY_NAMES[day]}
              >
                <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    {DAY_NAMES[day]}
                  </h2>
                  {day === todayIndex && (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                      Today
                    </span>
                  )}
                </header>

                {dayEntries.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                    No classes
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {dayEntries.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-2 px-4 py-3">
                        <span
                          className="mt-1 h-8 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.course?.color ?? '#3366f2' }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {entry.course?.course_code ?? 'Class'}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {entry.course?.course_name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            {entry.room ? ` - ${entry.room}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${entry.course?.course_code ?? 'class'} on ${DAY_NAMES[day]}`}
                            onClick={() => {
                              setEditing(entry)
                              setModalOpen(true)
                            }}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${entry.course?.course_code ?? 'class'} on ${DAY_NAMES[day]}`}
                            onClick={() => setPendingDelete(entry)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit class' : 'Add class'}
        footer={
          <>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                setModalOpen(false)
                setEditing(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="timetable-form" loading={saving}>
              {editing ? 'Save changes' : 'Add class'}
            </Button>
          </>
        }
      >
        <form id="timetable-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Select
            label="Course"
            value={form.course_id}
            error={errors.course_id}
            onChange={(event) => setForm({ ...form, course_id: event.target.value })}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </option>
            ))}
          </Select>
          <Select
            label="Day"
            value={form.day_of_week}
            onChange={(event) => setForm({ ...form, day_of_week: event.target.value })}
          >
            {WEEK_ORDER.map((day) => (
              <option key={day} value={day}>
                {DAY_NAMES[day]}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start time"
              type="time"
              value={form.start_time}
              error={errors.start_time}
              onChange={(event) => setForm({ ...form, start_time: event.target.value })}
            />
            <Input
              label="End time"
              type="time"
              value={form.end_time}
              error={errors.end_time}
              onChange={(event) => setForm({ ...form, end_time: event.target.value })}
            />
          </div>
          <Input
            label="Room"
            placeholder="Lab 3, Block B"
            value={form.room}
            onChange={(event) => setForm({ ...form, room: event.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove class"
        message="This class will be removed from your weekly timetable."
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
