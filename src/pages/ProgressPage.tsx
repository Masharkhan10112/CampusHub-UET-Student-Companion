import { BarChart3, Clock, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { calculateGpa, formatGpa } from '@/lib/gpa'
import { listAssignments } from '@/services/assignments'
import { listCourses } from '@/services/courses'
import { listGrades } from '@/services/grades'
import { createStudySession, listStudySessions } from '@/services/studySessions'
import { listTasks } from '@/services/tasks'

const CHART_COLORS = ['#3366f2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

async function loadProgress() {
  const since = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString()
  const [courses, assignments, tasks, grades, sessions] = await Promise.all([
    listCourses(),
    listAssignments(),
    listTasks(),
    listGrades(),
    listStudySessions({ since }),
  ])
  return { courses, assignments, tasks, grades, sessions }
}

export function ProgressPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(loadProgress)

  const [logOpen, setLogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    courseId: '',
    minutes: '60',
    notes: '',
  })

  const courses = useMemo(() => data?.courses ?? [], [data])

  const gpaTrend = useMemo(() => {
    const grades = data?.grades ?? []
    const semesters = [...new Set(grades.map((grade) => grade.semester))].sort((a, b) => a - b)
    return semesters.map((semester, index) => {
      const upToHere = grades.filter((grade) => grade.semester <= semesters[index])
      const forSemester = grades.filter((grade) => grade.semester === semester)
      const toEntries = (rows: typeof grades) =>
        rows.map((grade) => ({
          creditHours: Number(grade.credit_hours),
          gradePoints: Number(grade.grade_points),
        }))

      return {
        semester: `Sem ${semester}`,
        gpa: Number(calculateGpa(toEntries(forSemester)).gpa.toFixed(2)),
        cumulative: Number(calculateGpa(toEntries(upToHere)).gpa.toFixed(2)),
      }
    })
  }, [data])

  const assignmentsByCourse = useMemo(() => {
    const assignments = data?.assignments ?? []
    return courses.map((course) => {
      const forCourse = assignments.filter((assignment) => assignment.course_id === course.id)
      return {
        course: course.course_code,
        completed: forCourse.filter((assignment) => assignment.status === 'completed').length,
        pending: forCourse.filter((assignment) => assignment.status !== 'completed').length,
      }
    })
  }, [courses, data])

  const studyByDay = useMemo(() => {
    const sessions = data?.sessions ?? []
    const days: { date: string; hours: number }[] = []
    for (let offset = 13; offset >= 0; offset -= 1) {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - offset)
      const next = new Date(day)
      next.setDate(next.getDate() + 1)
      const minutes = sessions
        .filter((session) => {
          const start = new Date(session.start_time)
          return start >= day && start < next
        })
        .reduce((sum, session) => sum + session.duration_minutes, 0)
      days.push({ date: formatDate(day, 'dd MMM'), hours: Number((minutes / 60).toFixed(1)) })
    }
    return days
  }, [data])

  const taskBreakdown = useMemo(() => {
    const tasks = data?.tasks ?? []
    const counts = new Map<string, number>()
    for (const task of tasks) counts.set(task.category, (counts.get(task.category) ?? 0) + 1)
    return [...counts.entries()].map(([name, value]) => ({ name, value }))
  }, [data])

  const totals = useMemo(() => {
    const assignments = data?.assignments ?? []
    const tasks = data?.tasks ?? []
    const completedAssignments = assignments.filter(
      (assignment) => assignment.status === 'completed',
    ).length
    const completedTasks = tasks.filter((task) => task.status === 'completed').length
    const studyMinutes = (data?.sessions ?? []).reduce(
      (sum, session) => sum + session.duration_minutes,
      0,
    )
    const gpa = calculateGpa(
      (data?.grades ?? []).map((grade) => ({
        creditHours: Number(grade.credit_hours),
        gradePoints: Number(grade.grade_points),
      })),
    )

    return {
      assignmentRate:
        assignments.length === 0
          ? 0
          : Math.round((completedAssignments / assignments.length) * 100),
      taskRate: tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100),
      studyHours: Number((studyMinutes / 60).toFixed(1)),
      gpa: gpa.totalCreditHours > 0 ? formatGpa(gpa.gpa) : '--',
    }
  }, [data])

  const hasAnyData =
    (data?.assignments.length ?? 0) > 0 ||
    (data?.grades.length ?? 0) > 0 ||
    (data?.sessions.length ?? 0) > 0 ||
    (data?.tasks.length ?? 0) > 0

  async function handleLogSession(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    const minutes = Number(sessionForm.minutes)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error('Enter a valid duration')
      return
    }

    const end = new Date()
    const start = new Date(end.getTime() - minutes * 60_000)

    setSaving(true)
    try {
      await createStudySession(
        {
          course_id: sessionForm.courseId || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_minutes: minutes,
          notes: sessionForm.notes.trim() || null,
        },
        user.id,
      )
      toast.success('Study session logged')
      setLogOpen(false)
      setSessionForm({ courseId: '', minutes: '60', notes: '' })
      await reload()
    } catch (caught) {
      toast.error('Could not log session', getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Progress"
        description="Charts built from your own courses, grades and study sessions."
        actions={
          <Button onClick={() => setLogOpen(true)}>
            <Plus className="h-4 w-4" /> Log study session
          </Button>
        }
      />

      {error && (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {!loading && !error && !hasAnyData && (
        <div className="card">
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="No data to chart yet"
            message="Add courses, assignments and saved grades, then log a study session to see your trends."
          />
        </div>
      )}

      {!loading && !error && hasAnyData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Assignment completion', value: `${totals.assignmentRate}%` },
              { label: 'Task completion', value: `${totals.taskRate}%` },
              { label: 'Study hours (4 weeks)', value: `${totals.studyHours}h` },
              { label: 'Cumulative GPA', value: totals.gpa },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">GPA trend</h2>
              {gpaTrend.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Save semester results on the GPA page to see the trend.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gpaTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                      <XAxis dataKey="semester" fontSize={12} />
                      <YAxis domain={[0, 4]} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="gpa"
                        name="Semester GPA"
                        stroke="#3366f2"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        name="Cumulative"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="card p-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Assignments by course
              </h2>
              {assignmentsByCourse.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Add courses and assignments to see this chart.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assignmentsByCourse}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                      <XAxis dataKey="course" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="completed"
                        name="Completed"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="card p-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Study hours (last 14 days)
              </h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                    <XAxis dataKey="date" fontSize={11} interval={1} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="hours" name="Hours" fill="#3366f2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card p-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Tasks by category
              </h2>
              {taskBreakdown.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Add tasks to see how your time is split.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskBreakdown}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {taskBreakdown.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log a study session"
        description="Sessions feed the study hours chart and your weekly totals."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="session-form" loading={saving}>
              <Clock className="h-4 w-4" /> Log session
            </Button>
          </>
        }
      >
        <form id="session-form" onSubmit={handleLogSession} className="space-y-4">
          <Select
            label="Course (optional)"
            value={sessionForm.courseId}
            onChange={(event) => setSessionForm({ ...sessionForm, courseId: event.target.value })}
          >
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </option>
            ))}
          </Select>
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            max={1440}
            step={5}
            value={sessionForm.minutes}
            onChange={(event) => setSessionForm({ ...sessionForm, minutes: event.target.value })}
          />
          <Textarea
            label="Notes"
            rows={3}
            placeholder="What did you cover?"
            value={sessionForm.notes}
            onChange={(event) => setSessionForm({ ...sessionForm, notes: event.target.value })}
          />
        </form>
      </Modal>
    </>
  )
}
