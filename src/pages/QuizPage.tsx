import { CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { EmptyState, Skeleton } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { isBlank } from '@/lib/validation'
import { generateQuiz, saveQuizAttempt } from '@/services/ai'
import type { QuizDifficulty, QuizQuestion } from '@/types/ai'

export function QuizPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    subject: '',
    topic: '',
    questionCount: '5',
    difficulty: 'medium' as QuizDifficulty,
  })
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [generating, setGenerating] = useState(false)

  const score = submitted
    ? (questions ?? []).reduce(
        (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
        0,
      )
    : 0

  async function handleGenerate(event: FormEvent) {
    event.preventDefault()
    if (isBlank(form.subject) || isBlank(form.topic)) {
      toast.error('Add a subject and topic', 'Both are needed to write good questions.')
      return
    }

    setGenerating(true)
    setSubmitted(false)
    try {
      const generated = await generateQuiz({
        subject: form.subject.trim(),
        topic: form.topic.trim(),
        questionCount: Number(form.questionCount),
        difficulty: form.difficulty,
      })
      setQuestions(generated)
      setAnswers(new Array(generated.length).fill(null))
    } catch (error) {
      toast.error('Could not generate the quiz', getErrorMessage(error))
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmitQuiz() {
    if (!questions || !user) return
    setSubmitted(true)

    const finalScore = questions.reduce(
      (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
      0,
    )

    try {
      await saveQuizAttempt(
        {
          subject: form.subject.trim(),
          topic: form.topic.trim(),
          difficulty: form.difficulty,
          questions,
          answers,
          score: finalScore,
        },
        user.id,
      )
    } catch (error) {
      toast.error('Result not saved', getErrorMessage(error))
    }
  }

  function resetQuiz() {
    if (!questions) return
    setAnswers(new Array(questions.length).fill(null))
    setSubmitted(false)
  }

  return (
    <>
      <PageHeader
        title="Practice quiz"
        description="Generate MCQs on any topic, answer them, and review the explanations."
      />

      <form onSubmit={handleGenerate} className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="Subject"
          placeholder="Computer Networks"
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
        />
        <Input
          label="Topic"
          placeholder="TCP vs UDP"
          value={form.topic}
          onChange={(event) => setForm({ ...form, topic: event.target.value })}
        />
        <Select
          label="Questions"
          value={form.questionCount}
          onChange={(event) => setForm({ ...form, questionCount: event.target.value })}
        >
          {[5, 10, 15, 20].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </Select>
        <Select
          label="Difficulty"
          value={form.difficulty}
          onChange={(event) =>
            setForm({ ...form, difficulty: event.target.value as QuizDifficulty })
          }
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <div className="flex items-end">
          <Button type="submit" className="w-full" loading={generating}>
            <Sparkles className="h-4 w-4" /> Generate
          </Button>
        </div>
      </form>

      {generating && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!generating && !questions && (
        <div className="card">
          <EmptyState
            title="No quiz yet"
            message="Pick a subject and topic above to generate practice questions."
          />
        </div>
      )}

      {!generating && questions && questions.length > 0 && (
        <>
          {submitted && (
            <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your score</p>
                <p className="text-3xl font-semibold text-brand-600">
                  {score}/{questions.length}
                </p>
              </div>
              <Button variant="outline" onClick={resetQuiz}>
                <RotateCcw className="h-4 w-4" /> Try again
              </Button>
            </div>
          )}

          <ol className="space-y-4">
            {questions.map((question, index) => (
              <li key={index} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">
                    {index + 1}. {question.question}
                  </h2>
                  {submitted && (
                    <Badge tone={answers[index] === question.correctIndex ? 'success' : 'danger'}>
                      {answers[index] === question.correctIndex ? 'Correct' : 'Incorrect'}
                    </Badge>
                  )}
                </div>

                <fieldset className="mt-3 space-y-2" disabled={submitted}>
                  <legend className="sr-only">Options for question {index + 1}</legend>
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[index] === optionIndex
                    const correct = submitted && optionIndex === question.correctIndex
                    const wrong = submitted && selected && optionIndex !== question.correctIndex

                    return (
                      <label
                        key={optionIndex}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                          correct
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                            : wrong
                              ? 'border-red-500 bg-red-50 dark:bg-red-950'
                              : selected
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800',
                        )}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={selected}
                          onChange={() =>
                            setAnswers((current) => {
                              const next = [...current]
                              next[index] = optionIndex
                              return next
                            })
                          }
                          className="h-4 w-4"
                        />
                        <span className="flex-1 text-slate-700 dark:text-slate-200">{option}</span>
                        {correct && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {wrong && <XCircle className="h-4 w-4 text-red-600" />}
                      </label>
                    )
                  })}
                </fieldset>

                {submitted && question.explanation && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {question.explanation}
                  </p>
                )}
              </li>
            ))}
          </ol>

          {!submitted && (
            <Button
              size="lg"
              onClick={handleSubmitQuiz}
              disabled={answers.some((answer) => answer === null)}
            >
              Submit answers
            </Button>
          )}
        </>
      )}
    </>
  )
}
