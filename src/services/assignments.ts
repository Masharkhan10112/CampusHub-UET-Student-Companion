import { supabase } from '@/lib/supabase'
import type { AssignmentInsert, AssignmentUpdate, AssignmentWithCourse } from '@/types/models'

const SELECT_WITH_COURSE = '*, course:courses(id, course_code, course_name, color)'

export async function listAssignments(options?: {
  courseId?: string
  limit?: number
}): Promise<AssignmentWithCourse[]> {
  let query = supabase
    .from('assignments')
    .select(SELECT_WITH_COURSE)
    .order('due_date', { ascending: true })

  if (options?.courseId) query = query.eq('course_id', options.courseId)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data as AssignmentWithCourse[]
}

export async function listUpcomingAssignments(limit = 5): Promise<AssignmentWithCourse[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select(SELECT_WITH_COURSE)
    .neq('status', 'completed')
    .order('due_date', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data as AssignmentWithCourse[]
}

export async function createAssignment(payload: Omit<AssignmentInsert, 'user_id'>, userId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .insert({ ...payload, user_id: userId })
    .select(SELECT_WITH_COURSE)
    .single()
  if (error) throw error
  return data as AssignmentWithCourse
}

export async function updateAssignment(id: string, payload: AssignmentUpdate) {
  const { data, error } = await supabase
    .from('assignments')
    .update(payload)
    .eq('id', id)
    .select(SELECT_WITH_COURSE)
    .single()
  if (error) throw error
  return data as AssignmentWithCourse
}

export async function deleteAssignment(id: string) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}
