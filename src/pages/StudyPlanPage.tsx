import { CalendarRange, Save, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState, Skeleton } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { isBlank } from '@/lib/validation'
import { deleteStudyPlan, generateStudyPlan, listStudyPlans, saveStudyPlan } from '@/services/ai'
import type { StudyPlan } from '@/types/ai'
import type { StudyPlanRecord } from '@/types/models'

const BLOCK_TONE = {
  study: 'brand',
  revision: 'success',
  practice: 'warning',
  break: 'neutral',
} as const

function defaultExamDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

export function StudyPlanPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    subject: '',
    examDate: defaultExamDate(),
    hoursPerDay: '3',
    topics: '',
    level: 'intermediate',
    preferredTime: 'evening',
  })
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<StudyPlanRecord[]>([])
  const [pendingDelete, setPendingDelete] = useState<StudyPlanRecord | null>(null)

  useEffect(() => {
    listStudyPlans()
      .then(setSaved)
      .catch(() => undefined)
  }, [])

  async function handleGenerate(event: FormEvent) {
    event.preventDefault()
    if (isBlank(form.subject)) {
      toast.error('Add a subject', 'Tell the planner what you are revising.')
      return
    }

    setGenerating(true)
    try {
      setPlan(
        await generateStudyPlan({
          subject: form.subject.trim(),
          examDate: form.examDate,
          hoursPerDay: Number(form.hoursPerDay),
          topics: form.topics.trim(),
          level: form.level,
          preferredTime: form.preferredTime,
        }),
      )
    } catch (error) {
      toast.error('Could not build the plan', getErrorMessage(error))
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!plan || !user) return
    setSaving(true)
    try {
      const record = await saveStudyPlan(
        {
          title: plan.title,
          subject: form.subject.trim(),
          examDate: form.examDate,
          hoursPerDay: Number(form.hoursPerDay),
          plan,
        },
        user.id,
      )
      setSaved((current) => [record, ...current])
      toast.success('Study plan saved')
    } catch (error) {
      toast.error('Could not save the plan', getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteStudyPlan(pendingDelete.id)
      setSaved((current) => current.filter((item) => item.id !== pendingDelete.id))
      toast.success('Plan deleted')
    } catch (error) {
      toast.error('Could not delete the plan', getErrorMessage(error))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Study plan generator"
        description="Turn an exam date and a topic list into a realistic day-by-day plan."
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <form onSubmit={handleGenerate} className="card space-y-4 p-4">
          <Input
            label="Subject"
            placeholder="Operating Systems"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Exam date"
              type="date"
              value={form.examDate}
              onChange={(event) => setForm({ ...form, examDate: event.target.value })}
            />
            <Input
              label="Hours per day"
              type="number"
              min={1}
              max={12}
              step={0.5}
              value={form.hoursPerDay}
              onChange={(event) => setForm({ ...form, hoursPerDay: event.target.value })}
            />
          </div>
          <Textarea
            label="Topics to cover"
            rows={4}
            placeholder="Process scheduling, deadlocks, memory management..."
            value={form.topics}
            onChange={(event) => setForm({ ...form, topics: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Level"
              value={form.level}
              onChange={(event) => setForm({ ...form, level: event.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <Select
              label="Preferred time"
              value={form.preferredTime}
              onChange={(event) => setForm({ ...form, preferredTime: event.target.value })}
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" loading={generating}>
            <Sparkles className="h-4 w-4" /> Generate plan
          </Button>
        </form>

        <section className="space-y-4">
          {generating && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!generating && !plan && (
            <div className="card">
              <EmptyState
                icon={<CalendarRange className="h-6 w-6" />}
                title="No plan yet"
                message="Fill in the form and generate a plan tailored to your exam date."
              />
            </div>
          )}

          {!generating && plan && (
            <div className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {plan.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{plan.summary}</p>
                </div>
                <Button variant="outline" onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4" /> Save plan
                </Button>
              </div>

              <ol className="mt-4 space-y-3">
                {plan.days.map((day, index) => (
                  <li
                    key={`${day.day}-${index}`}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{day.day}</h3>
                      {day.date && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {day.date}
                        </span>
                      )}
                    </div>
                    <ul className="mt-2 space-y-2">
                      {day.blocks.map((block, blockIndex) => (
                        <li
                          key={blockIndex}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <span className="text-slate-700 dark:text-slate-200">{block.topic}</span>
                          <span className="flex items-center gap-2">
                            <Badge tone={BLOCK_TONE[block.type] ?? 'neutral'}>{block.type}</Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {block.durationMinutes} min
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {saved.length > 0 && (
            <div className="card">
              <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                Saved plans
              </h2>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {saved.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {record.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {record.subject}
                        {record.exam_date ? ` - exam ${formatDate(record.exam_date)}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPlan(record.plan as unknown as StudyPlan)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${record.title}`}
                        onClick={() => setPendingDelete(record)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete study plan"
        message="This saved plan will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
