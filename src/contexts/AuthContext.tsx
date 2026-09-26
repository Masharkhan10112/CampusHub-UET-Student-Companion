import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'
import { getProfile } from '@/services/profile'
import type { Profile } from '@/types/models'

export type RegisterInput = {
  fullName: string
  email: string
  password: string
  university: string
  department: string
  semester: number
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: RegisterInput) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  refreshProfile: () => Promise<void>
  setProfile: (profile: Profile) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      setProfile(await getProfile(userId))
    } catch (error) {
      console.error('Failed to load profile', error)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        void loadProfile(data.session.user.id).finally(() => active && setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      },
      async signUp(input) {
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            data: {
              full_name: input.fullName.trim(),
              university: input.university.trim(),
              department: input.department.trim(),
              semester: String(input.semester),
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })
        if (error) throw error
        return { needsEmailConfirmation: !data.session }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setProfile(null)
      },
      async requestPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      },
      async refreshProfile() {
        if (session?.user) await loadProfile(session.user.id)
      },
      setProfile,
    }),
    [session, profile, loading, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
