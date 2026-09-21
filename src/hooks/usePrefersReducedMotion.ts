import { useMediaQuery } from './useMediaQuery'

/** True when the OS asks for less motion. The Wrapped stops auto-advancing
 * and the dashboard skips count-ups and staggered entrances. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
