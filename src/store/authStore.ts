import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user:            User | null
  session:         Session | null
  currentWalletId: string | null
  loading:         boolean

  initialize:       () => Promise<void>
  signIn:           (email: string, password: string) => Promise<{ error: string | null }>
  signUp:           (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut:          () => Promise<void>
  setCurrentWallet: (walletId: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      session:         null,
      currentWalletId: null,
      loading:         true,

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null, loading: false })

        supabase.auth.onAuthStateChange((event, session) => {
          set({ session, user: session?.user ?? null })
          if (event === 'SIGNED_OUT') set({ currentWalletId: null })
        })
      },

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },

      signUp: async (email, password, displayName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        const needsConfirmation = !error && !data.session
        return { error: error?.message ?? null, needsConfirmation }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, currentWalletId: null })
      },

      setCurrentWallet: (walletId) => set({ currentWalletId: walletId }),
    }),
    {
      name: 'cdg-auth',
      // Solo persistir walletId — user/session los gestiona Supabase
      partialize: (state) => ({ currentWalletId: state.currentWalletId }),
    }
  )
)
