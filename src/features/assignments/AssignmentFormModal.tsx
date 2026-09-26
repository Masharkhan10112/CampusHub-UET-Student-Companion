import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { isBlank, type FieldErrors } from '@/lib/validation'
import type { Assignment, AssignmentStatus, Course, Priority } from '@/types/models'
import { ASSIGNMENT_STATUSES, PRIORITIES } from '@/types/models'

export type AssignmentFormValues = {
  title: string
  description: string | null
  course_id: string | null
  due_date: string
  priority: Priority
  status: AssignmentStatus
}

type FormState = {
  title: string
  description: string
  course_id: string
  due_date: string
  priority: Priority
  status: AssignmentStatus
}

/** `datetime-local` needs `yyyy-MM-ddTHH:mm` in local time. */
function toLocalInput(iso: string | null | undefined) {
  const date = iso ? new Date(iso) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toFormState(assignment?: Assignment | null): FormState {
  return {
    title: assignment?.title ?? '',
    description: assignment?.description ?? '',
    course_id: assignment?.course_id ?? '',
    due_date: toLocalInput(assignment?.due_date),
    priority: assignment?.priority ?? 'medium',
    status: assignment?.status ?? 'pending',
  }
}

export function AssignmentFormModal({
  open,
  assignment,
  courses,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  assignment?: Assignment | null
  courses: Course[]
  saving: boolean
  onClose: () => void
  onSubmit: (values: AssignmentFormValues) => void
}) {
  const [form, setForm] = useState<FormState>(toFormState(assignment))
  const [errors, setErrors] = useState<FieldErrors<FormState>>({})

  useEffect(() => {
    if (open) {
      setForm(toFormState(assignment))
      setErrors({})
    }
  }, [open, assignment])

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: FieldErrors<FormState> = {}
    if (isBlank(form.title)) nextErrors.title = 'Title is required.'
    if (isBlank(form.due_date)) nextErrors.due_date = 'Due date is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      course_id: form.course_id || null,
      due_date: new Date(form.due_date).toISOString(),
      priority: form.priority,
      status: form.status,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={assignment ? 'Edit assignment' : 'Add assignment'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form" loading={saving}>
            {assignment ? 'Save changes' : 'Add assignment'}
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Title"
          placeholder="Binary search tree implementation"
          value={form.title}
          error={errors.title}
          onChange={(event) => update('title', event.target.value)}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="What needs to be submitted?"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Course"
            value={form.course_id}
            onChange={(event) => update('course_id', event.target.value)}
          >
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </option>
            ))}
          </Select>
          <Input
            label="Due date"
            type="datetime-local"
            value={form.due_date}
            error={errors.due_date}
            onChange={(event) => update('due_date', event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => update('priority', event.target.value as Priority)}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority} className="capitalize">
                {priority}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={form.status}
            onChange={(event) => update('status', event.target.value as AssignmentStatus)}
          >
            {ASSIGNMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  )
}
