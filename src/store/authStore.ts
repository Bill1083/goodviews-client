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
  /** True once this session has been confirmed as a "remembered" trusted
   * device for the current user — lets ProtectedRoute skip the MFA challenge
   * even though the underlying Supabase session is still only AAL1. */
  trustedDevice: boolean
  /** False while a stored trusted-device token is still being verified with
   * the backend — ProtectedRoute holds on a spinner during this window
   * rather than redirecting to /mfa-challenge and then bouncing back. */
  trustedDeviceChecked: boolean
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setAal: (aal: Aal) => void
  setTrustedDevice: (trustedDevice: boolean, checked?: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  aal: { current: null, next: null },
  trustedDevice: false,
  trustedDeviceChecked: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setAal: (aal) => set({ aal }),
  setTrustedDevice: (trustedDevice, checked = true) => set({ trustedDevice, trustedDeviceChecked: checked }),
}))
