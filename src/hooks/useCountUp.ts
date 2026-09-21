import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/** Animates 0 → value with an ease-out curve over `durationMs`, starting when
 * `active` flips true. Instant under prefers-reduced-motion. */
export function useCountUp(value: number, active: boolean, durationMs = 1100): number {
  const reduced = usePrefersReducedMotion()
  const [current, setCurrent] = useState(reduced ? value : 0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    if (reduced || durationMs <= 0) {
      setCurrent(value)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setCurrent(value * eased)
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else setCurrent(value)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [value, active, durationMs, reduced])

  return current
}
