import { create } from 'zustand'
import type { ModerationOutcome, ModerationStatus } from '../types'

interface ModerationStoreState {
  /** Set when the server removed a comment - shown once in a dialog. */
  notice: ModerationOutcome | null
  /** Learned from a 403 on any request, so the UI reacts without waiting for the next /me poll. */
  statusOverride: { status: ModerationStatus; suspendedUntil: string | null } | null
  showNotice: (notice: ModerationOutcome) => void
  dismissNotice: () => void
  setStatusOverride: (status: ModerationStatus, suspendedUntil?: string | null) => void
  reset: () => void
}

export const useModerationStore = create<ModerationStoreState>((set) => ({
  notice: null,
  statusOverride: null,
  showNotice: (notice) => set({ notice }),
  dismissNotice: () => set({ notice: null }),
  setStatusOverride: (status, suspendedUntil = null) => set({ statusOverride: { status, suspendedUntil } }),
  reset: () => set({ notice: null, statusOverride: null }),
}))
