import { ArrowLeft, Clock, Download, FileText, GraduationCap } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge, PriorityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { isOverdue } from '@/features/assignments/AssignmentRow'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { describeDueDate, formatDate, formatFileSize, formatTime } from '@/lib/format'
import { calculateGpa, formatGpa } from '@/lib/gpa'
import { listAssignments } from '@/services/assignments'
import { getCourse } from '@/services/courses'
import { listGrades } from '@/services/grades'
import { getMaterialDownloadUrl, listMaterials } from '@/services/materials'
import { listStudySessions } from '@/services/studySessions'
import { listTimetable } from '@/services/timetable'
import { DAY_NAMES } from '@/types/models'

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const loader = useCallback(async () => {
    if (!id) throw new Error('Course not found.')
    const [course, assignments, materials, grades, sessions, timetable] = await Promise.all([
      getCourse(id),
      listAssignments({ courseId: id }),
      listMaterials({ courseId: id }),
      listGrades(),
      listStudySessions({ courseId: id }),
      listTimetable(),
    ])
    return {
      course,
      assignments,
      materials,
      grades: grades.filter((grade) => grade.course_id === id),
      sessions,
      classes: timetable.filter((entry) => entry.course_id === id),
    }
  }, [id])

  const { data, loading, error, reload } = useAsyncData(loader, [id])

  const summary = useMemo(() => {
    const assignments = data?.assignments ?? []
    const completed = assignments.filter((assignment) => assignment.status === 'completed').length
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
      completed,
      total: assignments.length,
      studyHours: Number((studyMinutes / 60).toFixed(1)),
      gpa: gpa.totalCreditHours > 0 ? formatGpa(gpa.gpa) : '--',
    }
  }, [data])

  async function handleDownload(filePath: string) {
    try {
      const url = await getMaterialDownloadUrl(filePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (caught) {
      toast.error('Could not prepare the download', getErrorMessage(caught))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card">
        <ErrorState message={error ?? 'Course not found.'} onRetry={reload} />
      </div>
    )
  }

  const { course } = data

  return (
    <>
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>
      </div>

      <header className="card overflow-hidden">
        <span
          aria-hidden="true"
          className="block h-1.5"
          style={{ backgroundColor: course.color }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {course.course_code}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">{course.course_name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{Number(course.credit_hours)} credit hours</Badge>
              {course.semester && <Badge>Semester {course.semester}</Badge>}
              {course.instructor && <Badge tone="brand">{course.instructor}</Badge>}
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Assignments</dt>
              <dd className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {summary.completed}/{summary.total}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Study hours</dt>
              <dd className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {summary.studyHours}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Grade point</dt>
              <dd className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {summary.gpa}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Assignments</h2>
            <Link to="/assignments" className="text-sm font-medium text-brand-600 hover:underline">
              Manage
            </Link>
          </header>
          {data.assignments.length === 0 ? (
            <EmptyState
              title="No assignments"
              message="Assignments linked to this course appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.assignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {assignment.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={assignment.priority} />
                      {assignment.status === 'completed' ? (
                        <Badge tone="success">Completed</Badge>
                      ) : isOverdue(assignment) ? (
                        <Badge tone="danger">Overdue</Badge>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {describeDueDate(assignment.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Materials</h2>
            <Link to="/materials" className="text-sm font-medium text-brand-600 hover:underline">
              Manage
            </Link>
          </header>
          {data.materials.length === 0 ? (
            <EmptyState title="No materials" message="Upload notes and slides for this course." />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.materials.map((material) => (
                <li key={material.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {material.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(material.file_size)} - {formatDate(material.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Download ${material.title}`}
                    onClick={() => handleDownload(material.file_path)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Class schedule</h2>
          </header>
          {data.classes.length === 0 ? (
            <EmptyState title="No classes scheduled" message="Add this course to your timetable." />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.classes.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {DAY_NAMES[entry.day_of_week]}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                    {entry.room ? ` - ${entry.room}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Study sessions and grades
            </h2>
          </header>
          {data.sessions.length === 0 && data.grades.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="Nothing recorded"
              message="Log study sessions on the progress page and save grades from the GPA calculator."
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-900 dark:text-slate-100">
                    Semester {grade.semester} grade
                  </span>
                  <Badge tone="brand">
                    {grade.grade} ({Number(grade.grade_points).toFixed(2)})
                  </Badge>
                </div>
              ))}
              {data.sessions.slice(0, 8).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {formatDate(session.start_time)}
                    {session.notes ? ` - ${session.notes}` : ''}
                  </span>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">
                    {session.duration_minutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
