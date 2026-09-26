import { supabase } from '@/lib/supabase'
import type { GradeInsert, GradeUpdate, GradeWithCourse } from '@/types/models'

const SELECT_WITH_COURSE = '*, course:courses(id, course_code, course_name)'

export async function listGrades(): Promise<GradeWithCourse[]> {
  const { data, error } = await supabase
    .from('grades')
    .select(SELECT_WITH_COURSE)
    .order('semester', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as GradeWithCourse[]
}

export async function createGrades(rows: Omit<GradeInsert, 'user_id'>[], userId: string) {
  const { data, error } = await supabase
    .from('grades')
    .insert(rows.map((row) => ({ ...row, user_id: userId })))
    .select(SELECT_WITH_COURSE)
  if (error) throw error
  return data as GradeWithCourse[]
}

export async function updateGrade(id: string, payload: GradeUpdate) {
  const { data, error } = await supabase
    .from('grades')
    .update(payload)
    .eq('id', id)
    .select(SELECT_WITH_COURSE)
    .single()
  if (error) throw error
  return data as GradeWithCourse
}

export async function deleteGrade(id: string) {
  const { error } = await supabase.from('grades').delete().eq('id', id)
  if (error) throw error
}
