import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const ALLOWED_DOMAIN = 'centralsquarefoundation.org'

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Check existing session (also handles PKCE code exchange from OAuth redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (session.user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setUser(session.user)
        } else {
          // Domain mismatch — sign out immediately
          supabase.auth.signOut()
          setError(`Access restricted to @${ALLOWED_DOMAIN} accounts.`)
        }
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setUser(session.user)
          setError(null)
        } else {
          supabase.auth.signOut()
          setUser(null)
          setError(`Access restricted to @${ALLOWED_DOMAIN} accounts.`)
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    if (!supabase) return
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { hd: ALLOWED_DOMAIN },
        redirectTo: window.location.origin,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
