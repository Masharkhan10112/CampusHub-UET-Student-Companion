import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { creditHoursProblem, isBlank, type FieldErrors } from '@/lib/validation'
import { COURSE_COLORS, type Course } from '@/types/models'

export type CourseFormValues = {
  course_code: string
  course_name: string
  instructor: string
  credit_hours: number
  semester: number | null
  color: string
}

type FormState = {
  course_code: string
  course_name: string
  instructor: string
  credit_hours: string
  semester: string
  color: string
}

function toFormState(course?: Course | null): FormState {
  return {
    course_code: course?.course_code ?? '',
    course_name: course?.course_name ?? '',
    instructor: course?.instructor ?? '',
    credit_hours: course ? String(course.credit_hours) : '3',
    semester: course?.semester ? String(course.semester) : '',
    color: course?.color ?? COURSE_COLORS[0],
  }
}

export function CourseFormModal({
  open,
  course,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  course?: Course | null
  saving: boolean
  onClose: () => void
  onSubmit: (values: CourseFormValues) => void
}) {
  const [form, setForm] = useState<FormState>(toFormState(course))
  const [errors, setErrors] = useState<FieldErrors<FormState>>({})

  useEffect(() => {
    if (open) {
      setForm(toFormState(course))
      setErrors({})
    }
  }, [open, course])

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: FieldErrors<FormState> = {}
    if (isBlank(form.course_code)) nextErrors.course_code = 'Course code is required.'
    if (isBlank(form.course_name)) nextErrors.course_name = 'Course name is required.'
    const creditIssue = creditHoursProblem(form.credit_hours)
    if (creditIssue) nextErrors.credit_hours = creditIssue

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      course_code: form.course_code.trim().toUpperCase(),
      course_name: form.course_name.trim(),
      instructor: form.instructor.trim(),
      credit_hours: Number(form.credit_hours),
      semester: form.semester ? Number(form.semester) : null,
      color: form.color,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={course ? 'Edit course' : 'Add course'}
      description="Courses group your assignments, materials, grades and timetable entries."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="course-form" loading={saving}>
            {course ? 'Save changes' : 'Add course'}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Course code"
            placeholder="CS301"
            value={form.course_code}
            error={errors.course_code}
            onChange={(event) => update('course_code', event.target.value)}
          />
          <Input
            label="Credit hours"
            type="number"
            min={0}
            max={30}
            step={0.5}
            value={form.credit_hours}
            error={errors.credit_hours}
            onChange={(event) => update('credit_hours', event.target.value)}
          />
        </div>
        <Input
          label="Course name"
          placeholder="Data Structures"
          value={form.course_name}
          error={errors.course_name}
          onChange={(event) => update('course_name', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Instructor"
            placeholder="Dr. Ayesha Khan"
            value={form.instructor}
            onChange={(event) => update('instructor', event.target.value)}
          />
          <Select
            label="Semester"
            value={form.semester}
            onChange={(event) => update('semester', event.target.value)}
          >
            <option value="">Not set</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                Semester {value}
              </option>
            ))}
          </Select>
        </div>

        <fieldset>
          <legend className="field-label">Colour</legend>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use colour ${color}`}
                aria-pressed={form.color === color}
                onClick={() => update('color', color)}
                style={{ backgroundColor: color }}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition',
                  form.color === color
                    ? 'border-slate-900 dark:border-white'
                    : 'border-transparent',
                )}
              />
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
