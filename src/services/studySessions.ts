import { supabase } from '@/lib/supabase'
import type { StudySessionInsert, StudySessionWithCourse } from '@/types/models'

const SELECT_WITH_COURSE = '*, course:courses(id, course_code, course_name)'

export async function listStudySessions(options?: {
  courseId?: string
  since?: string
}): Promise<StudySessionWithCourse[]> {
  let query = supabase
    .from('study_sessions')
    .select(SELECT_WITH_COURSE)
    .order('start_time', { ascending: false })

  if (options?.courseId) query = query.eq('course_id', options.courseId)
  if (options?.since) query = query.gte('start_time', options.since)

  const { data, error } = await query
  if (error) throw error
  return data as StudySessionWithCourse[]
}

export async function createStudySession(
  payload: Omit<StudySessionInsert, 'user_id'>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ ...payload, user_id: userId })
    .select(SELECT_WITH_COURSE)
    .single()
  if (error) throw error
  return data as StudySessionWithCourse
}

export async function deleteStudySession(id: string) {
  const { error } = await supabase.from('study_sessions').delete().eq('id', id)
  if (error) throw error
}
