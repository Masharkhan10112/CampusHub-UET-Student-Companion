import { CheckCircle2, Circle, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge, PriorityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { TaskFormModal, type TaskFormValues } from '@/features/tasks/TaskFormModal'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { describeDueDate } from '@/lib/format'
import { createTask, deleteTask, listTasks, updateTask } from '@/services/tasks'
import type { Task } from '@/types/models'

const FILTERS = ['all', 'today', 'upcoming', 'completed', 'overdue'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  today: 'Today',
  upcoming: 'Upcoming',
  completed: 'Completed',
  overdue: 'Overdue',
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isTaskOverdue(task: Task) {
  return (
    task.status !== 'completed' &&
    task.due_date !== null &&
    new Date(task.due_date).getTime() < Date.now()
  )
}

export function matchesFilter(task: Task, filter: Filter, now = new Date()) {
  const due = task.due_date ? new Date(task.due_date) : null
  const done = task.status === 'completed'

  switch (filter) {
    case 'today':
      return !done && due !== null && isSameDay(due, now)
    case 'upcoming':
      return !done && due !== null && due.getTime() > now.getTime()
    case 'completed':
      return done
    case 'overdue':
      return !done && due !== null && due.getTime() < now.getTime()
    default:
      return true
  }
}

export function TasksPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(listTasks)

  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const tasks = useMemo(() => data ?? [], [data])
  const visible = useMemo(
    () => tasks.filter((task) => matchesFilter(task, filter)),
    [tasks, filter],
  )

  async function handleSubmit(values: TaskFormValues) {
    if (!user) return
    setSaving(true)
    try {
      if (editing) {
        await updateTask(editing.id, values)
        toast.success('Task updated')
      } else {
        await createTask(values, user.id)
        toast.success('Task added')
      }
      setModalOpen(false)
      setEditing(null)
      await reload()
    } catch (caught) {
      toast.error('Could not save task', getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(task: Task) {
    setBusyId(task.id)
    try {
      await updateTask(task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      })
      await reload()
    } catch (caught) {
      toast.error('Could not update task', getErrorMessage(caught))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteTask(pendingDelete.id)
      toast.success('Task deleted')
      setPendingDelete(null)
      await reload()
    } catch (caught) {
      toast.error('Could not delete task', getErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Personal to-dos alongside your coursework."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add task
          </Button>
        }
      />

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Task filters"
      >
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {FILTER_LABELS[value]}
            <span className="ml-1.5 text-xs opacity-75">
              {tasks.filter((task) => matchesFilter(task, value)).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <ListSkeleton />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title={
              tasks.length === 0
                ? 'No tasks yet'
                : `Nothing in ${FILTER_LABELS[filter].toLowerCase()}`
            }
            message={
              tasks.length === 0
                ? 'Capture study sessions, errands and revision goals as tasks.'
                : 'Switch to another filter to see the rest of your tasks.'
            }
          />
        )}
        {!loading && !error && visible.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {visible.map((task) => {
              const done = task.status === 'completed'
              const overdue = isTaskOverdue(task)

              return (
                <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={busyId === task.id}
                    aria-label={
                      done ? `Mark ${task.title} as pending` : `Mark ${task.title} as completed`
                    }
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-600 disabled:opacity-50"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'font-medium text-slate-900 dark:text-slate-100',
                        done && 'text-slate-400 line-through dark:text-slate-500',
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="capitalize">{task.category}</Badge>
                      <PriorityBadge priority={task.priority} />
                      {done && <Badge tone="success">Completed</Badge>}
                      {overdue && <Badge tone="danger">Overdue</Badge>}
                      {task.due_date && (
                        <span
                          className={cn(
                            'text-xs',
                            overdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-500 dark:text-slate-400',
                          )}
                        >
                          {describeDueDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => {
                        setEditing(task)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => setPendingDelete(task)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <TaskFormModal
        open={modalOpen}
        task={editing}
        saving={saving}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete task"
        message={`"${pendingDelete?.title ?? ''}" will be permanently removed.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
