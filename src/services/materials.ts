import { supabase } from '@/lib/supabase'
import type { MaterialWithCourse } from '@/types/models'

export const MATERIALS_BUCKET = 'study-materials'

const SELECT_WITH_COURSE = '*, course:courses(id, course_code, course_name, color)'

export async function listMaterials(options?: {
  courseId?: string
}): Promise<MaterialWithCourse[]> {
  let query = supabase
    .from('materials')
    .select(SELECT_WITH_COURSE)
    .order('created_at', { ascending: false })

  if (options?.courseId) query = query.eq('course_id', options.courseId)

  const { data, error } = await query
  if (error) throw error
  return data as MaterialWithCourse[]
}

/**
 * Uploads to `<userId>/<random>.<ext>` -- the storage policies key ownership off
 * that first path segment -- then records the metadata row. If the metadata
 * insert fails the uploaded object is removed so no orphan files accumulate.
 */
export async function uploadMaterial(
  params: {
    file: File
    title: string
    description: string | null
    courseId: string | null
  },
  userId: string,
): Promise<MaterialWithCourse> {
  const extension = params.file.name.includes('.') ? `.${params.file.name.split('.').pop()}` : ''
  const path = `${userId}/${crypto.randomUUID()}${extension}`

  const { error: uploadError } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .upload(path, params.file, { contentType: params.file.type || undefined, upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('materials')
    .insert({
      user_id: userId,
      course_id: params.courseId,
      title: params.title,
      description: params.description,
      file_name: params.file.name,
      file_path: path,
      file_type: params.file.type || null,
      file_size: params.file.size,
    })
    .select(SELECT_WITH_COURSE)
    .single()

  if (error) {
    await supabase.storage.from(MATERIALS_BUCKET).remove([path])
    throw error
  }

  return data as MaterialWithCourse
}

export async function getMaterialDownloadUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(filePath, 60, { download: true })
  if (error) throw error
  return data.signedUrl
}

export async function deleteMaterial(id: string, filePath: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
  await supabase.storage.from(MATERIALS_BUCKET).remove([filePath])
}
