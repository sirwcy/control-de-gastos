import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useDataStore } from './dataStore'

interface AuthState {
  user:            User | null
  session:         Session | null
  currentWalletId: string | null
  currentRole:     string | null
  currentWalletType: 'personal' | 'family' | null
  loading:         boolean

  initialize:       () => Promise<void>
  signIn:           (identifier: string, password: string) => Promise<{ error: string | null }>
  signUp:           (email: string, password: string, displayName: string, username: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut:          () => Promise<void>
  setCurrentWallet: (walletId: string) => void
  clearCurrentWallet: () => void
  refreshRole:      (walletId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      session:         null,
      currentWalletId: null,
      currentRole:     null,
      currentWalletType: null,
      loading:         true,

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null, loading: false })

        // Si ya había cartera guardada en storage, cargar sus datos
        const savedWalletId = useDataStore.getState().walletId
          ?? (JSON.parse(localStorage.getItem('cdg-auth') ?? '{}')?.state?.currentWalletId ?? null)
        if (session && savedWalletId) {
          useDataStore.getState().loadWalletData(savedWalletId)
          get().refreshRole(savedWalletId)
        }

        supabase.auth.onAuthStateChange((event, session) => {
          set({ session, user: session?.user ?? null })
          if (event === 'SIGNED_OUT') {
            useDataStore.getState().clearWalletData()
            set({ currentWalletId: null, currentRole: null, currentWalletType: null })
          }
        })
      },

      signIn: async (identifier, password) => {
        // El identificador puede ser email o nombre de usuario → resolver a email
        const { data: email, error: resolveError } = await supabase.rpc('cdg_email_for_login', { p_identifier: identifier })
        if (resolveError) return { error: resolveError.message }
        if (!email) return { error: 'Usuario o email no encontrado' }
        const { error } = await supabase.auth.signInWithPassword({ email: email as string, password })
        return { error: error?.message ?? null }
      },

      signUp: async (email, password, displayName, username) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName, username } },
        })
        const needsConfirmation = !error && !data.session
        return { error: error?.message ?? null, needsConfirmation }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        useDataStore.getState().clearWalletData()
        set({ user: null, session: null, currentWalletId: null, currentRole: null, currentWalletType: null })
      },

      setCurrentWallet: (walletId) => {
        set({ currentWalletId: walletId })
        useDataStore.getState().loadWalletData(walletId)
        get().refreshRole(walletId)
      },

      // Vuelve a la pantalla de selección de cartera sin cerrar sesión
      clearCurrentWallet: () => {
        useDataStore.getState().clearWalletData()
        set({ currentWalletId: null, currentRole: null, currentWalletType: null })
      },

      refreshRole: async (walletId) => {
        const [{ data: role }, { data: wallet }] = await Promise.all([
          supabase.rpc('cdg_wallet_role', { p_wallet_id: walletId }),
          supabase.from('cdg_wallets').select('type').eq('id', walletId).single(),
        ])
        set({
          currentRole: role ?? null,
          currentWalletType: (wallet?.type as 'personal' | 'family' | undefined) ?? null,
        })
      },
    }),
    {
      name: 'cdg-auth',
      // Solo persistir walletId — user/session los gestiona Supabase
      partialize: (state) => ({ currentWalletId: state.currentWalletId }),
    }
  )
)
