import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Database } from '@/types/database.types'

/**
 * End-to-end checks against a running Supabase stack (`npx supabase start`).
 * They exercise auth, CRUD through PostgREST and, most importantly, that row
 * level security keeps one student's data invisible to another.
 *
 * Run with:
 *   SUPABASE_TEST_URL=... SUPABASE_TEST_ANON_KEY=... npm test
 */
const url = process.env.SUPABASE_TEST_URL
const anonKey = process.env.SUPABASE_TEST_ANON_KEY
const enabled = Boolean(url && anonKey)

type Client = SupabaseClient<Database>

function client(): Client {
  return createClient<Database>(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function register(suffix: string) {
  const supabase = client()
  const email = `campushub.${suffix}.${Date.now()}@example.com`
  const password = 'campushub-2026'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: `Test ${suffix}`, university: 'UET', semester: '5' } },
  })
  if (error) throw error

  return { supabase, email, password, userId: data.user!.id }
}

describe.skipIf(!enabled)('Supabase integration', () => {
  let alice: Awaited<ReturnType<typeof register>>
  let bob: Awaited<ReturnType<typeof register>>
  let aliceCourseId: string

  beforeAll(async () => {
    alice = await register('alice')
    bob = await register('bob')
  }, 30_000)

  afterAll(async () => {
    await alice?.supabase.auth.signOut()
    await bob?.supabase.auth.signOut()
  })

  it('creates a profile row for every new account', async () => {
    const { data, error } = await alice.supabase
      .from('profiles')
      .select('id, full_name, university, semester')
      .eq('id', alice.userId)
      .single()

    expect(error).toBeNull()
    expect(data?.full_name).toBe('Test alice')
    expect(data?.university).toBe('UET')
    expect(data?.semester).toBe(5)
  })

  it('signs a user out and back in', async () => {
    const supabase = client()
    const signIn = await supabase.auth.signInWithPassword({
      email: alice.email,
      password: alice.password,
    })
    expect(signIn.error).toBeNull()
    expect(signIn.data.session).not.toBeNull()

    await supabase.auth.signOut()
    const { data } = await supabase.auth.getSession()
    expect(data.session).toBeNull()

    const wrong = await supabase.auth.signInWithPassword({
      email: alice.email,
      password: 'definitely-wrong',
    })
    expect(wrong.error).not.toBeNull()
  })

  it('supports the full course lifecycle', async () => {
    const created = await alice.supabase
      .from('courses')
      .insert({
        user_id: alice.userId,
        course_code: 'CS-301',
        course_name: 'Data Structures',
        instructor: 'Dr. Khan',
        credit_hours: 3,
        semester: 5,
      })
      .select()
      .single()

    expect(created.error).toBeNull()
    aliceCourseId = created.data!.id

    const updated = await alice.supabase
      .from('courses')
      .update({ instructor: 'Dr. Ahmed' })
      .eq('id', aliceCourseId)
      .select()
      .single()
    expect(updated.data?.instructor).toBe('Dr. Ahmed')

    const listed = await alice.supabase.from('courses').select('id')
    expect(listed.data?.map((course) => course.id)).toContain(aliceCourseId)
  })

  it('creates, completes and deletes an assignment', async () => {
    const created = await alice.supabase
      .from('assignments')
      .insert({
        user_id: alice.userId,
        course_id: aliceCourseId,
        title: 'Implement a BST',
        due_date: new Date(Date.now() + 86_400_000).toISOString(),
        priority: 'high',
      })
      .select()
      .single()

    expect(created.error).toBeNull()
    expect(created.data?.status).toBe('pending')
    const assignmentId = created.data!.id

    const completed = await alice.supabase
      .from('assignments')
      .update({ status: 'completed', completion_percentage: 100 })
      .eq('id', assignmentId)
      .select()
      .single()
    expect(completed.data?.status).toBe('completed')
    expect(completed.data?.completion_percentage).toBe(100)

    const removed = await alice.supabase.from('assignments').delete().eq('id', assignmentId)
    expect(removed.error).toBeNull()

    const after = await alice.supabase.from('assignments').select('id').eq('id', assignmentId)
    expect(after.data).toHaveLength(0)
  })

  it('hides one student\u2019s rows from another (RLS)', async () => {
    const visible = await bob.supabase.from('courses').select('id').eq('id', aliceCourseId)
    expect(visible.error).toBeNull()
    expect(visible.data).toHaveLength(0)

    const update = await bob.supabase
      .from('courses')
      .update({ course_name: 'Hijacked' })
      .eq('id', aliceCourseId)
      .select()
    expect(update.data ?? []).toHaveLength(0)

    const remove = await bob.supabase.from('courses').delete().eq('id', aliceCourseId).select()
    expect(remove.data ?? []).toHaveLength(0)

    const spoofed = await bob.supabase.from('courses').insert({
      user_id: alice.userId,
      course_code: 'EV-101',
      course_name: 'Evil injection',
      credit_hours: 3,
    })
    expect(spoofed.error).not.toBeNull()

    const stillThere = await alice.supabase
      .from('courses')
      .select('course_name')
      .eq('id', aliceCourseId)
      .single()
    expect(stillThere.data?.course_name).toBe('Data Structures')
  })

  it('rejects anonymous reads', async () => {
    const anonymous = client()
    const { data, error } = await anonymous.from('courses').select('id')
    expect(error ?? data).toBeTruthy()
    expect(data ?? []).toHaveLength(0)
  })
})
