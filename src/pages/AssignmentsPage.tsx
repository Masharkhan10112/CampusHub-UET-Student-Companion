import { ClipboardList, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import {
  AssignmentFormModal,
  type AssignmentFormValues,
} from '@/features/assignments/AssignmentFormModal'
import { AssignmentRow, isOverdue } from '@/features/assignments/AssignmentRow'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  updateAssignment,
} from '@/services/assignments'
import { listCourses } from '@/services/courses'
import type { AssignmentWithCourse } from '@/types/models'

type SortKey = 'due_date' | 'priority' | 'title'

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const

async function loadPage() {
  const [assignments, courses] = await Promise.all([listAssignments(), listCourses()])
  return { assignments, courses }
}

export function AssignmentsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(loadPage)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('due_date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AssignmentWithCourse | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AssignmentWithCourse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const assignments = useMemo(() => data?.assignments ?? [], [data])
  const courses = useMemo(() => data?.courses ?? [], [data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = assignments.filter((assignment) => {
      const matchesTerm =
        term.length === 0 ||
        assignment.title.toLowerCase().includes(term) ||
        (assignment.description ?? '').toLowerCase().includes(term)
      const matchesCourse = courseFilter === 'all' || assignment.course_id === courseFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'overdue' ? isOverdue(assignment) : assignment.status === statusFilter)
      return matchesTerm && matchesCourse && matchesStatus
    })

    return [...filtered].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title)
      if (sortKey === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
  }, [assignments, search, statusFilter, courseFilter, sortKey])

  async function handleSubmit(values: AssignmentFormValues) {
    if (!user) return
    setSaving(true)
    try {
      if (editing) {
        await updateAssignment(editing.id, {
          ...values,
          completion_percentage: values.status === 'completed' ? 100 : undefined,
        })
        toast.success('Assignment updated')
      } else {
        await createAssignment(values, user.id)
        toast.success('Assignment added')
      }
      setModalOpen(false)
      setEditing(null)
      await reload()
    } catch (caught) {
      toast.error('Could not save assignment', getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(assignment: AssignmentWithCourse) {
    setBusyId(assignment.id)
    const completed = assignment.status === 'completed'
    try {
      await updateAssignment(assignment.id, {
        status: completed ? 'pending' : 'completed',
        completion_percentage: completed ? 0 : 100,
      })
      await reload()
    } catch (caught) {
      toast.error('Could not update assignment', getErrorMessage(caught))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteAssignment(pendingDelete.id)
      toast.success('Assignment deleted')
      setPendingDelete(null)
      await reload()
    } catch (caught) {
      toast.error('Could not delete assignment', getErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  const overdueCount = assignments.filter(isOverdue).length

  return (
    <>
      <PageHeader
        title="Assignments"
        description={
          overdueCount > 0
            ? `${overdueCount} assignment${overdueCount === 1 ? ' is' : 's are'} overdue.`
            : 'Everything you need to submit, in one list.'
        }
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add assignment
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search assignments"
            placeholder="Search assignments"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select
            aria-label="Filter by course"
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_code}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort assignments"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
          >
            <option value="due_date">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </Select>
        </div>
      </div>

      <div className="card">
        {loading && <ListSkeleton />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title={
              assignments.length === 0 ? 'No assignments yet' : 'Nothing matches those filters'
            }
            message={
              assignments.length === 0
                ? 'Add your first assignment to start tracking deadlines.'
                : 'Try clearing the search box or choosing a different status.'
            }
          />
        )}
        {!loading && !error && visible.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {visible.map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                busy={busyId === assignment.id}
                onToggle={() => handleToggle(assignment)}
                onEdit={() => {
                  setEditing(assignment)
                  setModalOpen(true)
                }}
                onDelete={() => setPendingDelete(assignment)}
              />
            ))}
          </ul>
        )}
      </div>

      <AssignmentFormModal
        open={modalOpen}
        assignment={editing}
        courses={courses}
        saving={saving}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete assignment"
        message={`"${pendingDelete?.title ?? ''}" will be permanently removed.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
