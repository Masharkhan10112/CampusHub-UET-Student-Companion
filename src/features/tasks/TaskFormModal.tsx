import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { isBlank, type FieldErrors } from '@/lib/validation'
import type { Priority, Task, TaskCategory, TaskStatus } from '@/types/models'
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from '@/types/models'

export type TaskFormValues = {
  title: string
  description: string | null
  due_date: string | null
  priority: Priority
  category: TaskCategory
  status: TaskStatus
}

type FormState = {
  title: string
  description: string
  due_date: string
  priority: Priority
  category: TaskCategory
  status: TaskStatus
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toFormState(task?: Task | null): FormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    due_date: toLocalInput(task?.due_date),
    priority: task?.priority ?? 'medium',
    category: task?.category ?? 'study',
    status: task?.status ?? 'pending',
  }
}

export function TaskFormModal({
  open,
  task,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  task?: Task | null
  saving: boolean
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
}) {
  const [form, setForm] = useState<FormState>(toFormState(task))
  const [errors, setErrors] = useState<FieldErrors<FormState>>({})

  useEffect(() => {
    if (open) {
      setForm(toFormState(task))
      setErrors({})
    }
  }, [open, task])

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isBlank(form.title)) {
      setErrors({ title: 'Title is required.' })
      return
    }
    setErrors({})

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      priority: form.priority,
      category: form.category,
      status: form.status,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'Add task'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving}>
            {task ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Title"
          placeholder="Revise lecture 7 notes"
          value={form.title}
          error={errors.title}
          onChange={(event) => update('title', event.target.value)}
        />
        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Deadline (optional)"
            type="datetime-local"
            value={form.due_date}
            onChange={(event) => update('due_date', event.target.value)}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(event) => update('category', event.target.value as TaskCategory)}
          >
            {TASK_CATEGORIES.map((category) => (
              <option key={category} value={category} className="capitalize">
                {category}
              </option>
            ))}
          </Select>
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
            onChange={(event) => update('status', event.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((status) => (
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
