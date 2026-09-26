import { describe, expect, it } from 'vitest'

import { matchesFilter } from '@/pages/TasksPage'
import type { Task } from '@/types/models'

const now = new Date('2026-03-10T12:00:00.000Z')

function task(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Revise notes',
    description: null,
    due_date: null,
    priority: 'medium',
    status: 'pending',
    category: 'study',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  }
}

describe('task filters', () => {
  it('keeps everything under "all"', () => {
    expect(matchesFilter(task({}), 'all', now)).toBe(true)
  })

  it('matches tasks due today', () => {
    expect(matchesFilter(task({ due_date: '2026-03-10T18:00:00.000Z' }), 'today', now)).toBe(true)
    expect(matchesFilter(task({ due_date: '2026-03-11T18:00:00.000Z' }), 'today', now)).toBe(false)
  })

  it('matches upcoming and overdue tasks', () => {
    const upcoming = task({ due_date: '2026-03-20T09:00:00.000Z' })
    const overdue = task({ due_date: '2026-03-01T09:00:00.000Z' })

    expect(matchesFilter(upcoming, 'upcoming', now)).toBe(true)
    expect(matchesFilter(overdue, 'overdue', now)).toBe(true)
    expect(matchesFilter(overdue, 'upcoming', now)).toBe(false)
  })

  it('excludes completed tasks from the open filters', () => {
    const done = task({ due_date: '2026-03-01T09:00:00.000Z', status: 'completed' })

    expect(matchesFilter(done, 'overdue', now)).toBe(false)
    expect(matchesFilter(done, 'completed', now)).toBe(true)
  })
})
