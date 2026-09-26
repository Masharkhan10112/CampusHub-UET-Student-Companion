import { Calculator, Plus, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import {
  DEFAULT_GRADE_POINTS,
  GRADE_LETTERS,
  calculateGpa,
  formatGpa,
  type GradeLetter,
} from '@/lib/gpa'
import { listCourses } from '@/services/courses'
import { createGrades, deleteGrade, listGrades } from '@/services/grades'
import type { GradeWithCourse } from '@/types/models'

type Row = {
  key: string
  courseId: string
  label: string
  creditHours: string
  grade: GradeLetter
}

function emptyRow(): Row {
  return { key: crypto.randomUUID(), courseId: '', label: '', creditHours: '3', grade: 'A' }
}

async function loadGpaPage() {
  const [courses, grades] = await Promise.all([listCourses(), listGrades()])
  return { courses, grades }
}

export function GpaPage() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(loadGpaPage)

  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()])
  const [semester, setSemester] = useState(String(profile?.semester ?? 1))
  const [scale, setScale] = useState<Record<GradeLetter, number>>({ ...DEFAULT_GRADE_POINTS })
  const [showScale, setShowScale] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<GradeWithCourse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const courses = useMemo(() => data?.courses ?? [], [data])
  const savedGrades = useMemo(() => data?.grades ?? [], [data])

  const semesterResult = useMemo(
    () =>
      calculateGpa(
        rows.map((row) => ({
          creditHours: Number(row.creditHours) || 0,
          gradePoints: scale[row.grade],
        })),
      ),
    [rows, scale],
  )

  const cumulativeResult = useMemo(
    () =>
      calculateGpa(
        savedGrades.map((grade) => ({
          creditHours: Number(grade.credit_hours),
          gradePoints: Number(grade.grade_points),
        })),
      ),
    [savedGrades],
  )

  const bySemester = useMemo(() => {
    const groups = new Map<number, GradeWithCourse[]>()
    for (const grade of savedGrades) {
      const list = groups.get(grade.semester) ?? []
      list.push(grade)
      groups.set(grade.semester, list)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [savedGrades])

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  async function handleSave() {
    if (!user) return
    const usable = rows.filter(
      (row) => Number(row.creditHours) > 0 && (row.courseId || row.label.trim()),
    )
    if (usable.length === 0) {
      toast.error('Nothing to save', 'Add at least one course with credit hours.')
      return
    }

    setSaving(true)
    try {
      await createGrades(
        usable.map((row) => ({
          course_id: row.courseId || null,
          course_label: row.courseId ? null : row.label.trim() || null,
          grade: row.grade,
          grade_points: scale[row.grade],
          credit_hours: Number(row.creditHours),
          semester: Number(semester),
        })),
        user.id,
      )
      toast.success('Results saved', `Semester ${semester} added to your record.`)
      setRows([emptyRow(), emptyRow(), emptyRow()])
      await reload()
    } catch (caught) {
      toast.error('Could not save results', getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteGrade(pendingDelete.id)
      toast.success('Grade removed')
      setPendingDelete(null)
      await reload()
    } catch (caught) {
      toast.error('Could not remove grade', getErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="GPA calculator"
        description="GPA = sum(credit hours x grade points) / sum(credit hours)."
        actions={
          <Button variant="outline" onClick={() => setShowScale((value) => !value)}>
            {showScale ? 'Hide grade scale' : 'Edit grade scale'}
          </Button>
        }
      />

      {showScale && (
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Grade scale</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Adjust the points if your university uses a different scale.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {GRADE_LETTERS.map((letter) => (
              <Input
                key={letter}
                label={letter}
                type="number"
                step={0.1}
                min={0}
                max={5}
                value={scale[letter]}
                onChange={(event) =>
                  setScale((current) => ({ ...current, [letter]: Number(event.target.value) }))
                }
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Semester courses</h2>
            <Select
              aria-label="Semester"
              className="w-40"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Semester {value}
                </option>
              ))}
            </Select>
          </header>

          <div className="space-y-3 p-4">
            {rows.map((row) => (
              <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_7rem_6rem_2.5rem]">
                {courses.length > 0 ? (
                  <Select
                    aria-label="Course"
                    value={row.courseId}
                    onChange={(event) => updateRow(row.key, { courseId: event.target.value })}
                  >
                    <option value="">Custom course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                      </option>
                    ))}
                  </Select>
                ) : null}
                {(!row.courseId || courses.length === 0) && (
                  <Input
                    aria-label="Course name"
                    placeholder="Course name"
                    value={row.label}
                    onChange={(event) => updateRow(row.key, { label: event.target.value })}
                  />
                )}
                <Select
                  aria-label="Grade"
                  value={row.grade}
                  onChange={(event) =>
                    updateRow(row.key, { grade: event.target.value as GradeLetter })
                  }
                >
                  {GRADE_LETTERS.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter} ({scale[letter]})
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label="Credit hours"
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={row.creditHours}
                  onChange={(event) => updateRow(row.key, { creditHours: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove row"
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() =>
                    setRows((current) =>
                      current.length > 1 ? current.filter((item) => item.key !== row.key) : current,
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setRows((current) => [...current, emptyRow()])}
              >
                <Plus className="h-4 w-4" /> Add course
              </Button>
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" /> Save to record
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="card p-5 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Semester GPA</p>
            <p className="mt-1 text-4xl font-semibold text-brand-600">
              {formatGpa(semesterResult.gpa)}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {semesterResult.totalCreditHours} credit hours -{' '}
              {semesterResult.totalQualityPoints.toFixed(2)} quality points
            </p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Cumulative GPA (saved)</p>
            <p className="mt-1 text-4xl font-semibold text-slate-900 dark:text-slate-50">
              {cumulativeResult.totalCreditHours > 0 ? formatGpa(cumulativeResult.gpa) : '--'}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {cumulativeResult.totalCreditHours} credit hours across {bySemester.length} semester
              {bySemester.length === 1 ? '' : 's'}
            </p>
          </div>
        </section>
      </div>

      <section className="card">
        <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Saved results</h2>
        </header>
        {loading && <ListSkeleton rows={3} />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && savedGrades.length === 0 && (
          <EmptyState
            icon={<Calculator className="h-6 w-6" />}
            title="No saved results"
            message="Calculate a semester above and save it to build your cumulative GPA."
          />
        )}
        {!loading && !error && bySemester.length > 0 && (
          <div className="space-y-6 p-4">
            {bySemester.map(([semesterNumber, grades]) => {
              const result = calculateGpa(
                grades.map((grade) => ({
                  creditHours: Number(grade.credit_hours),
                  gradePoints: Number(grade.grade_points),
                })),
              )
              return (
                <div key={semesterNumber}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      Semester {semesterNumber}
                    </h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      GPA {formatGpa(result.gpa)} - {result.totalCreditHours} CH
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Course
                          </th>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Grade
                          </th>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Points
                          </th>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Credits
                          </th>
                          <th scope="col" className="sr-only py-2 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {grades.map((grade) => (
                          <tr key={grade.id}>
                            <td className="py-2 pr-3 text-slate-900 dark:text-slate-100">
                              {grade.course
                                ? `${grade.course.course_code} - ${grade.course.course_name}`
                                : (grade.course_label ?? 'Course')}
                            </td>
                            <td className="py-2 pr-3">{grade.grade}</td>
                            <td className="py-2 pr-3">{Number(grade.grade_points).toFixed(2)}</td>
                            <td className="py-2 pr-3">{Number(grade.credit_hours)}</td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                aria-label={`Delete grade for ${grade.course?.course_code ?? grade.course_label ?? 'course'}`}
                                onClick={() => setPendingDelete(grade)}
                                className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete saved grade"
        message="This grade will no longer count towards your cumulative GPA."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
