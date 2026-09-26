import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Plus,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Badge, PriorityBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { isOverdue } from '@/features/assignments/AssignmentRow'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { describeDueDate, formatTime, greetingForHour } from '@/lib/format'
import { calculateGpa, formatGpa } from '@/lib/gpa'
import { listAssignments } from '@/services/assignments'
import { listCourses } from '@/services/courses'
import { listGrades } from '@/services/grades'
import { listStudySessions } from '@/services/studySessions'
import { listTasks } from '@/services/tasks'
import { listTimetable } from '@/services/timetable'

async function loadDashboard() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [courses, assignments, tasks, timetable, grades, sessions] = await Promise.all([
    listCourses(),
    listAssignments(),
    listTasks(),
    listTimetable(),
    listGrades(),
    listStudySessions({ since: weekAgo }),
  ])
  return { courses, assignments, tasks, timetable, grades, sessions }
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { data, loading, error, reload } = useAsyncData(loadDashboard)

  const stats = useMemo(() => {
    const assignments = data?.assignments ?? []
    const tasks = data?.tasks ?? []
    const grades = data?.grades ?? []
    const sessions = data?.sessions ?? []

    const pending = assignments.filter((assignment) => assignment.status !== 'completed')
    const gpa = calculateGpa(
      grades.map((grade) => ({
        creditHours: Number(grade.credit_hours),
        gradePoints: Number(grade.grade_points),
      })),
    )

    return {
      courseCount: data?.courses.length ?? 0,
      pendingCount: pending.length,
      overdueCount: assignments.filter(isOverdue).length,
      completedTasks: tasks.filter((task) => task.status === 'completed').length,
      openTasks: tasks.filter((task) => task.status !== 'completed').length,
      gpa: gpa.totalCreditHours > 0 ? formatGpa(gpa.gpa) : '--',
      studyHours:
        Math.round(sessions.reduce((sum, session) => sum + session.duration_minutes, 0) / 6) / 10,
    }
  }, [data])

  const upcoming = useMemo(
    () =>
      (data?.assignments ?? [])
        .filter((assignment) => assignment.status !== 'completed')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5),
    [data],
  )

  const todaysClasses = useMemo(() => {
    const today = new Date().getDay()
    return (data?.timetable ?? []).filter((entry) => entry.day_of_week === today)
  }, [data])

  const todaysTasks = useMemo(() => {
    const now = new Date()
    return (data?.tasks ?? []).filter((task) => {
      if (task.status === 'completed' || !task.due_date) return false
      const due = new Date(task.due_date)
      return (
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth() &&
        due.getDate() === now.getDate()
      )
    })
  }, [data])

  const firstName = (profile?.full_name ?? '').split(' ')[0]

  return (
    <>
      <PageHeader
        title={`${greetingForHour(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`}
        description="Here is where your semester stands today."
        actions={
          <Link
            to="/assignments"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add assignment
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active courses"
          value={stats.courseCount}
          icon={BookOpen}
          loading={loading}
        />
        <StatCard
          label="Pending assignments"
          value={stats.pendingCount}
          hint={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
          icon={ClipboardList}
          loading={loading}
        />
        <StatCard
          label="Tasks completed"
          value={stats.completedTasks}
          hint={`${stats.openTasks} still open`}
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Cumulative GPA"
          value={stats.gpa}
          hint={`${stats.studyHours}h studied this week`}
          icon={GraduationCap}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Upcoming deadlines</h2>
            <Link to="/assignments" className="text-sm font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </header>
          {loading ? (
            <ListSkeleton rows={4} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="Nothing due"
              message="You have no pending assignments. Add one to stay ahead."
              action={
                <Link
                  to="/assignments"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" /> Add assignment
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {upcoming.map((assignment) => {
                const overdue = isOverdue(assignment)
                return (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {assignment.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {assignment.course && <Badge>{assignment.course.course_code}</Badge>}
                        <PriorityBadge priority={assignment.priority} />
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-xs',
                        overdue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400',
                      )}
                    >
                      {describeDueDate(assignment.due_date)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Today&apos;s classes
            </h2>
            <Link to="/timetable" className="text-sm font-medium text-brand-600 hover:underline">
              Timetable
            </Link>
          </header>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : todaysClasses.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No classes today"
              message="Enjoy the free day, or use it to get ahead on revision."
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {todaysClasses.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="h-8 w-1 rounded-full"
                    style={{ backgroundColor: entry.course?.color ?? '#3366f2' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {entry.course?.course_code ?? 'Class'}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {entry.room ?? 'Room not set'}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Tasks due today</h2>
          <Link to="/tasks" className="text-sm font-medium text-brand-600 hover:underline">
            All tasks
          </Link>
        </header>
        {loading ? (
          <ListSkeleton rows={2} />
        ) : todaysTasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="No tasks due today"
            message="Nothing on the clock. Plan ahead from the tasks page."
          />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {todaysTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {task.title}
                </span>
                <PriorityBadge priority={task.priority} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
