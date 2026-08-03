import { create } from 'zustand'
import type { AuthenticatorAssuranceLevels, Session, User as SupabaseUser } from '@supabase/supabase-js'

interface Aal {
  current: AuthenticatorAssuranceLevels | null
  next: AuthenticatorAssuranceLevels | null
}

interface AuthState {
  session: Session | null
  user: SupabaseUser | null
  isLoading: boolean
  /** Current vs. next required assurance level — `current !== next` means an
   * enrolled MFA factor still needs to be challenged before this session is fully trusted. */
  aal: Aal
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setAal: (aal: Aal) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  aal: { current: null, next: null },
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setAal: (aal) => set({ aal }),
}))
