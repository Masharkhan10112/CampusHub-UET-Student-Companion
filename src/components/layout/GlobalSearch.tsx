import { BookOpen, CheckSquare, FolderOpen, ListChecks, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

type SearchHit = {
  id: string
  label: string
  sublabel: string
  to: string
  kind: 'course' | 'assignment' | 'task' | 'material'
}

const ICONS = {
  course: BookOpen,
  assignment: ListChecks,
  task: CheckSquare,
  material: FolderOpen,
}

/** Queries only the columns needed for the result row, capped at 5 per table. */
async function search(term: string): Promise<SearchHit[]> {
  const pattern = `%${term}%`
  const [courses, assignments, tasks, materials] = await Promise.all([
    supabase
      .from('courses')
      .select('id, course_code, course_name')
      .or(`course_code.ilike.${pattern},course_name.ilike.${pattern}`)
      .limit(5),
    supabase.from('assignments').select('id, title, due_date').ilike('title', pattern).limit(5),
    supabase.from('tasks').select('id, title, category').ilike('title', pattern).limit(5),
    supabase.from('materials').select('id, title, file_name').ilike('title', pattern).limit(5),
  ])

  const firstError = courses.error ?? assignments.error ?? tasks.error ?? materials.error
  if (firstError) throw firstError

  return [
    ...(courses.data ?? []).map((row) => ({
      id: `course-${row.id}`,
      label: `${row.course_code} - ${row.course_name}`,
      sublabel: 'Course',
      to: `/courses/${row.id}`,
      kind: 'course' as const,
    })),
    ...(assignments.data ?? []).map((row) => ({
      id: `assignment-${row.id}`,
      label: row.title,
      sublabel: 'Assignment',
      to: '/assignments',
      kind: 'assignment' as const,
    })),
    ...(tasks.data ?? []).map((row) => ({
      id: `task-${row.id}`,
      label: row.title,
      sublabel: `Task - ${row.category}`,
      to: '/tasks',
      kind: 'task' as const,
    })),
    ...(materials.data ?? []).map((row) => ({
      id: `material-${row.id}`,
      label: row.title,
      sublabel: row.file_name,
      to: '/materials',
      kind: 'material' as const,
    })),
  ]
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounced = useDebouncedValue(term, 300)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) {
      setTerm('')
      setHits([])
      setError(null)
    }
  }, [open])

  useEffect(() => {
    const trimmed = debounced.trim()
    if (trimmed.length < 2) {
      setHits([])
      return
    }

    let active = true
    setLoading(true)
    search(trimmed)
      .then((results) => active && setHits(results))
      .catch((caught) => active && setError(getErrorMessage(caught)))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [debounced])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Search"
      description="Courses, assignments, tasks and materials"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Type at least 2 characters..."
          aria-label="Search CampusHub"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="mt-4 min-h-24">
        {loading && <Spinner label="Searching" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && term.trim().length >= 2 && hits.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No results for &ldquo;{term}&rdquo;.
          </p>
        )}
        <ul className="space-y-1">
          {hits.map((hit) => {
            const Icon = ICONS[hit.kind]
            return (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(hit.to)
                    onClose()
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {hit.label}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {hit.sublabel}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}
