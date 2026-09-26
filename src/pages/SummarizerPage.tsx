import { FileText, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { summarizeNotes } from '@/services/ai'
import type { NotesSummary } from '@/types/ai'

const MIN_LENGTH = 40

export function SummarizerPage() {
  const toast = useToast()
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<NotesSummary | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (notes.trim().length < MIN_LENGTH) {
      toast.error('Add more text', `Paste at least ${MIN_LENGTH} characters of notes.`)
      return
    }

    setLoading(true)
    try {
      setResult(await summarizeNotes(notes.trim()))
    } catch (error) {
      toast.error('Could not summarise the notes', getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Notes summarizer"
        description="Paste lecture notes and get a summary, key points, definitions, formulas and likely exam questions."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="card space-y-3 p-4">
          <Textarea
            label="Your notes"
            rows={16}
            placeholder="Paste your lecture notes here..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {notes.trim().length} characters
            </span>
            <Button type="submit" loading={loading}>
              <Sparkles className="h-4 w-4" /> Summarise
            </Button>
          </div>
        </form>

        <section className="space-y-4">
          {loading && (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          )}

          {!loading && !result && (
            <div className="card">
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No summary yet"
                message="Paste your notes on the left and the structured summary will appear here."
              />
            </div>
          )}

          {!loading && result && (
            <>
              <article className="card p-4">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {result.summary}
                </p>
              </article>

              {result.keyPoints.length > 0 && (
                <article className="card p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">Key points</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                    {result.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </article>
              )}

              {result.definitions.length > 0 && (
                <article className="card p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">Definitions</h2>
                  <dl className="mt-2 space-y-2 text-sm">
                    {result.definitions.map((definition, index) => (
                      <div key={index}>
                        <dt className="font-medium text-slate-900 dark:text-slate-100">
                          {definition.term}
                        </dt>
                        <dd className="text-slate-600 dark:text-slate-300">{definition.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              )}

              {result.formulas.length > 0 && (
                <article className="card p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">Formulas</h2>
                  <ul className="mt-2 space-y-1 font-mono text-sm text-slate-700 dark:text-slate-200">
                    {result.formulas.map((formula, index) => (
                      <li key={index}>{formula}</li>
                    ))}
                  </ul>
                </article>
              )}

              {result.examQuestions.length > 0 && (
                <article className="card p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    Possible exam questions
                  </h2>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                    {result.examQuestions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ol>
                </article>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
