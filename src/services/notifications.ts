import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/models'

export async function listNotifications(limit = 30): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/** Regenerates deadline notifications server-side; safe to call repeatedly. */
export async function syncNotifications() {
  const { error } = await supabase.rpc('sync_notifications')
  if (error) throw error
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) throw error
}
