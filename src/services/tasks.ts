import { supabase } from '@/lib/supabase'
import type { Task, TaskInsert, TaskUpdate } from '@/types/models'

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createTask(payload: Omit<TaskInsert, 'user_id'>, userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, payload: TaskUpdate) {
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
