import { BookOpen, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { CardSkeletonGrid, EmptyState, ErrorState } from '@/components/ui/States'
import { CourseCard } from '@/features/courses/CourseCard'
import { CourseFormModal, type CourseFormValues } from '@/features/courses/CourseFormModal'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { createCourse, deleteCourse, listCourses, updateCourse } from '@/services/courses'
import type { Course } from '@/types/models'

type CourseWithCounts = Course & { assignmentCount: number; completedCount: number }

async function loadCourses(): Promise<CourseWithCounts[]> {
  const courses = await listCourses()
  if (courses.length === 0) return []

  // One extra query instead of one per course: fetch the (tiny) status column
  // for every assignment and fold the counts in memory.
  const { data, error } = await supabase.from('assignments').select('course_id, status')
  if (error) throw error

  return courses.map((course) => {
    const forCourse = (data ?? []).filter((row) => row.course_id === course.id)
    return {
      ...course,
      assignmentCount: forCourse.length,
      completedCount: forCourse.filter((row) => row.status === 'completed').length,
    }
  })
}

export function CoursesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(loadCourses)

  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  const courses = useMemo(() => data ?? [], [data])

  const semesters = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => course.semester).filter(Boolean))).sort(
        (a, b) => Number(a) - Number(b),
      ) as number[],
    [courses],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesTerm =
        term.length === 0 ||
        course.course_code.toLowerCase().includes(term) ||
        course.course_name.toLowerCase().includes(term) ||
        (course.instructor ?? '').toLowerCase().includes(term)
      const matchesSemester =
        semesterFilter === 'all' || String(course.semester ?? '') === semesterFilter
      return matchesTerm && matchesSemester
    })
  }, [courses, search, semesterFilter])

  async function handleSubmit(values: CourseFormValues) {
    if (!user) return
    setSaving(true)
    try {
      if (editing) {
        await updateCourse(editing.id, values)
        toast.success('Course updated')
      } else {
        await createCourse(values, user.id)
        toast.success('Course added')
      }
      setModalOpen(false)
      setEditing(null)
      await reload()
    } catch (caught) {
      toast.error('Could not save course', getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteCourse(pendingDelete.id)
      toast.success('Course deleted')
      setPendingDelete(null)
      await reload()
    } catch (caught) {
      toast.error('Could not delete course', getErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Courses"
        description="Every course you are taking this semester."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add course
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search courses"
            placeholder="Search by code, name or instructor"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by semester"
          className="sm:w-48"
          value={semesterFilter}
          onChange={(event) => setSemesterFilter(event.target.value)}
        >
          <option value="all">All semesters</option>
          {semesters.map((semester) => (
            <option key={semester} value={semester}>
              Semester {semester}
            </option>
          ))}
        </Select>
      </div>

      {loading && <CardSkeletonGrid />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && visible.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={courses.length === 0 ? 'No courses yet' : 'No matching courses'}
            message={
              courses.length === 0
                ? 'Add your first course to start tracking assignments, materials and grades.'
                : 'Try a different search term or clear the semester filter.'
            }
            action={
              courses.length === 0 ? (
                <Button
                  onClick={() => {
                    setEditing(null)
                    setModalOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" /> Add course
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={{
                assignmentCount: course.assignmentCount,
                completedCount: course.completedCount,
              }}
              onEdit={() => {
                setEditing(course)
                setModalOpen(true)
              }}
              onDelete={() => setPendingDelete(course)}
            />
          ))}
        </div>
      )}

      <CourseFormModal
        open={modalOpen}
        course={editing}
        saving={saving}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete course"
        message={`Deleting ${pendingDelete?.course_code ?? 'this course'} also removes its timetable entries, and unlinks its assignments and materials. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
