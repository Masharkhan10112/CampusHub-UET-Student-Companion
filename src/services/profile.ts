import { supabase } from '@/lib/supabase'
import type { Profile, ProfileUpdate } from '@/types/models'

export const AVATARS_BUCKET = 'avatars'

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, payload: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(userId: string, file: File) {
  const extension = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '.png'
  const path = `${userId}/avatar${extension}`

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined })
  if (error) throw error

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
