import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import type { Course } from '@/types/models'

export type CourseStats = {
  assignmentCount: number
  completedCount: number
}

export function CourseCard({
  course,
  stats,
  onEdit,
  onDelete,
}: {
  course: Course
  stats: CourseStats
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const progress =
    stats.assignmentCount === 0
      ? 0
      : Math.round((stats.completedCount / stats.assignmentCount) * 100)

  return (
    <article className="card relative flex flex-col overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: course.color }}
      />
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="min-w-0">
          <Link
            to={`/courses/${course.id}`}
            className="text-base font-semibold text-slate-900 hover:underline dark:text-slate-50"
          >
            {course.course_code}
          </Link>
          <p className="truncate text-sm text-slate-600 dark:text-slate-300">
            {course.course_name}
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={`Actions for ${course.course_code}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            onBlur={() => window.setTimeout(() => setMenuOpen(false), 150)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={onEdit}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Badge>{course.credit_hours} credit hours</Badge>
          {course.semester && <Badge>Semester {course.semester}</Badge>}
          <Badge tone="brand">{stats.assignmentCount} assignments</Badge>
        </div>

        {course.instructor && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{course.instructor}</p>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Assignment progress</span>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${course.course_code} assignment progress`}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: course.color }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
