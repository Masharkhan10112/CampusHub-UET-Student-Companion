import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react'

import { Badge, PriorityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { describeDueDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AssignmentWithCourse } from '@/types/models'

export function isOverdue(assignment: AssignmentWithCourse) {
  return assignment.status !== 'completed' && new Date(assignment.due_date).getTime() < Date.now()
}

export function AssignmentRow({
  assignment,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  assignment: AssignmentWithCourse
  busy?: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const completed = assignment.status === 'completed'
  const overdue = isOverdue(assignment)

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-label={
          completed
            ? `Mark ${assignment.title} as pending`
            : `Mark ${assignment.title} as completed`
        }
        className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-600 disabled:opacity-50"
      >
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-medium text-slate-900 dark:text-slate-100',
            completed && 'text-slate-400 line-through dark:text-slate-500',
          )}
        >
          {assignment.title}
        </p>
        {assignment.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
            {assignment.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {assignment.course && (
            <Badge>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: assignment.course.color }}
                aria-hidden="true"
              />
              {assignment.course.course_code}
            </Badge>
          )}
          <PriorityBadge priority={assignment.priority} />
          {completed ? (
            <Badge tone="success">Completed</Badge>
          ) : overdue ? (
            <Badge tone="danger">Overdue</Badge>
          ) : (
            <Badge tone={assignment.status === 'in_progress' ? 'brand' : 'neutral'}>
              {assignment.status === 'in_progress' ? 'In progress' : 'Pending'}
            </Badge>
          )}
          <span
            className={cn(
              'text-xs',
              overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400',
            )}
            title={formatDateTime(assignment.due_date)}
          >
            {describeDueDate(assignment.due_date)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${assignment.title}`}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${assignment.title}`}
          onClick={onDelete}
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}
