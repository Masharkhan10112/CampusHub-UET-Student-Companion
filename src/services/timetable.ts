import { supabase } from '@/lib/supabase'
import type { TimetableInsert, TimetableUpdate, TimetableWithCourse } from '@/types/models'

const SELECT_WITH_COURSE = '*, course:courses(id, course_code, course_name, color)'

export async function listTimetable(): Promise<TimetableWithCourse[]> {
  const { data, error } = await supabase
    .from('timetable')
    .select(SELECT_WITH_COURSE)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return data as TimetableWithCourse[]
}

export async function createTimetableEntry(
  payload: Omit<TimetableInsert, 'user_id'>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('timetable')
    .insert({ ...payload, user_id: userId })
    .select(SELECT_WITH_COURSE)
    .single()
  if (error) throw error
  return data as TimetableWithCourse
}

export async function updateTimetableEntry(id: string, payload: TimetableUpdate) {
  const { data, error } = await supabase
    .from('timetable')
    .update(payload)
    .eq('id', id)
    .select(SELECT_WITH_COURSE)
    .single()
  if (error) throw error
  return data as TimetableWithCourse
}

export async function deleteTimetableEntry(id: string) {
  const { error } = await supabase.from('timetable').delete().eq('id', id)
  if (error) throw error
}
