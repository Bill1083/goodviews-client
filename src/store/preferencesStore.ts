import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CSSProperties } from 'react'

export interface NeonColor {
  name: string
  value: string
}

/** A handful of "neon" accents, distinct from the app's own teal/magenta
 *  brand colours, for the personal film-hover highlight. */
export const NEON_COLORS: NeonColor[] = [
  { name: 'Pink', value: '#ff2bd6' },
  { name: 'Green', value: '#39ff14' },
  { name: 'Cyan', value: '#00f0ff' },
  { name: 'Purple', value: '#b936f5' },
  { name: 'Yellow', value: '#faff00' },
]

interface PreferencesState {
  /** Off by default — hovering a film stays exactly as it's always been
   *  until the user opts into a personal highlight colour. Purely a local
   *  display preference, so it lives in localStorage rather than the profile. */
  hoverHighlightEnabled: boolean
  hoverHighlightColor: string
  setHoverHighlightEnabled: (enabled: boolean) => void
  setHoverHighlightColor: (color: string) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hoverHighlightEnabled: false,
      hoverHighlightColor: NEON_COLORS[0].value,
      setHoverHighlightEnabled: (hoverHighlightEnabled) => set({ hoverHighlightEnabled }),
      setHoverHighlightColor: (hoverHighlightColor) => set({ hoverHighlightColor }),
    }),
    { name: 'goodviews-preferences', version: 1 },
  ),
)

/** Subscribes a poster card to the current highlight preference. Two
 *  primitive selectors (rather than one object selector) so a card only
 *  re-renders when the value it actually reads changes. */
export function useHoverHighlight() {
  const enabled = usePreferencesStore((s) => s.hoverHighlightEnabled)
  const color = usePreferencesStore((s) => s.hoverHighlightColor)
  return { enabled, color }
}

/** Glow to merge onto a poster card's own style when hovered. Returns {}
 *  whenever the preference is off (or the card isn't hovered), leaving the
 *  card's existing CSS hover (scale + teal shadow) completely untouched. */
export function hoverGlowStyle(enabled: boolean, color: string, hovered: boolean): CSSProperties {
  if (!enabled || !hovered) return {}
  return {
    boxShadow: `0 0 16px 2px ${color}, 0 0 34px 10px ${color}66`,
    transform: 'scale(1.06)',
  }
}
