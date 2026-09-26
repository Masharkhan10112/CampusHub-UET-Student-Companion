import { supabase } from '@/lib/supabase'
import type { Course, CourseInsert, CourseUpdate } from '@/types/models'

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCourse(id: string): Promise<Course> {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createCourse(payload: Omit<CourseInsert, 'user_id'>, userId: string) {
  const { data, error } = await supabase
    .from('courses')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateCourse(id: string, payload: CourseUpdate) {
  const { data, error } = await supabase
    .from('courses')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}
