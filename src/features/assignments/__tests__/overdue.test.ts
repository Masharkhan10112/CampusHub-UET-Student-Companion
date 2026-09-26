import { describe, expect, it } from 'vitest'

import { isOverdue } from '@/features/assignments/AssignmentRow'
import type { AssignmentWithCourse } from '@/types/models'

function assignment(overrides: Partial<AssignmentWithCourse>): AssignmentWithCourse {
  return {
    id: 'assignment-1',
    user_id: 'user-1',
    course_id: null,
    title: 'BST implementation',
    description: null,
    due_date: new Date(Date.now() + 86_400_000).toISOString(),
    priority: 'high',
    status: 'pending',
    completion_percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    course: null,
    ...overrides,
  }
}

describe('isOverdue', () => {
  it('is false for future deadlines', () => {
    expect(isOverdue(assignment({}))).toBe(false)
  })

  it('is true once the deadline has passed', () => {
    expect(isOverdue(assignment({ due_date: new Date(Date.now() - 1000).toISOString() }))).toBe(
      true,
    )
  })

  it('is never true for completed work', () => {
    expect(
      isOverdue(
        assignment({ due_date: new Date(Date.now() - 1000).toISOString(), status: 'completed' }),
      ),
    ).toBe(false)
  })
})
