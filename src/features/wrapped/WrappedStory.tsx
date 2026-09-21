import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import type { WrappedReady, WrappedSlide, WrappedSlideKind } from '../../types/stats'
import SlideRenderer from './slides/SlideRenderer'
import { WrappedMotionContext } from './SlideShell'

interface Props {
  data: WrappedReady
  onExit: () => void
  /** Called once the viewer is clearly watching (a few slides in). */
  onSeen?: () => void
}

/** How long each kind of slide holds before auto-advancing. Poster-heavy
 * slides get longer; the summary never auto-advances. */
const SLIDE_MS: Partial<Record<WrappedSlideKind, number>> = {
  intro: 6500,
  volume: 7000,
  months: 8000,
  genres: 7500,
  eras: 7000,
  people: 7500,
  loves: 9500,
  hates: 7000,
  hot_take: 7500,
  critic: 7000,
  rewatches: 7000,
  words: 8500,
  watchlist: 6500,
  friends: 8000,
  hidden_gem: 7000,
  world: 7000,
  persona: 11000,
}
const DEFAULT_MS = 7000
const TAP_MAX_MS = 260

/** The story engine: one slide at a time, segmented progress rail, tap zones
 * (left third back, right two-thirds forward), hold-to-pause, arrow keys and
 * Escape, and a swallowed ghost click after touch taps. Under reduced motion
 * there is no auto-advance — the viewer taps through. */
export default function WrappedStory({ data, onExit, onSeen }: Props) {
  const slides = data.slides
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [held, setHeld] = useState(false)
  const elapsedRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const lastTickRef = useRef<number | null>(null)
  const downAtRef = useRef<number | null>(null)
  const seenRef = useRef(false)

  useBodyScrollLock(true)

  const slide: WrappedSlide | undefined = slides[index]
  const isLast = index >= slides.length - 1
  const duration = slide ? SLIDE_MS[slide.kind] ?? DEFAULT_MS : DEFAULT_MS

  const goTo = useCallback(
    (next: number) => {
      elapsedRef.current = 0
      lastTickRef.current = null
      setProgress(0)
      setIndex(Math.max(0, Math.min(slides.length - 1, next)))
    },
    [slides.length],
  )
  const next = useCallback(() => {
    if (isLast) return
    goTo(index + 1)
  }, [goTo, index, isLast])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // Auto-advance clock. Paused while held; off entirely under reduced motion
  // and on the summary slide.
  useEffect(() => {
    if (reduced || isLast || !slide || slide.kind === 'summary') return
    const tick = (now: number) => {
      if (!held) {
        if (lastTickRef.current !== null) elapsedRef.current += now - lastTickRef.current
        const p = Math.min(1, elapsedRef.current / duration)
        setProgress(p)
        if (p >= 1) {
          goTo(index + 1)
          return
        }
      }
      lastTickRef.current = now
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      lastTickRef.current = null
    }
  }, [reduced, isLast, slide, duration, held, index, goTo])

  useEffect(() => {
    if (index >= 2 && !seenRef.current) {
      seenRef.current = true
      onSeen?.()
    }
  }, [index, onSeen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        // Real controls (close, summary buttons) keep Enter/Space for themselves.
        if ((e.target as HTMLElement | null)?.closest?.('[data-wrapped-control]') && e.key !== 'ArrowRight') return
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onExit])

  /** Touch taps fire a trailing synthetic click ~300ms later; if the tap just
   * revealed a button in that spot, that click would press it. Eat it. */
  const swallowGhostClick = () => {
    const eat = (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
    }
    window.addEventListener('click', eat, { capture: true, once: true })
    window.setTimeout(() => window.removeEventListener('click', eat, { capture: true }), 400)
  }

  const zoneDown = () => {
    downAtRef.current = performance.now()
    setHeld(true)
  }
  const zoneUp = (direction: 'prev' | 'next') => (e: React.PointerEvent) => {
    const downAt = downAtRef.current
    downAtRef.current = null
    setHeld(false)
    if (downAt !== null && performance.now() - downAt < TAP_MAX_MS) {
      if (e.pointerType === 'touch') swallowGhostClick()
      if (direction === 'next') next()
      else prev()
    }
  }
  const zoneCancel = () => {
    downAtRef.current = null
    setHeld(false)
  }

  const motion = useMemo(() => ({ reduced }), [reduced])
  if (!slide) return null

  return (
    <WrappedMotionContext.Provider value={motion}>
      <div
        data-no-swipe="true"
        role="dialog"
        aria-modal="true"
        aria-label={`Your ${data.year} Wrapped, slide ${index + 1} of ${slides.length}`}
        className="fixed inset-0 z-[70] select-none overflow-hidden bg-[#050308] text-white"
      >
        {/* Theme layer, swapped per slide (keyed so it fades in over the previous). */}
        <div key={`${index}-${slide.theme}`} className={`modal-backdrop-fade absolute inset-0 wrapped-theme-${slide.theme}`} aria-hidden="true" />

        {/* Slide content, re-mounted per index for its entrance. */}
        <div key={index} className="wrapped-slide-in absolute inset-0">
          <SlideRenderer slide={slide} data={data} onReplay={() => goTo(0)} onExit={onExit} />
        </div>

        {/* Tap zones — below the content's interactive elements (summary buttons) but above the art. */}
        {slide.kind !== 'summary' && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              className="absolute inset-y-0 left-0 z-10 w-[30%] cursor-default focus:outline-none"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={zoneDown}
              onPointerUp={zoneUp('prev')}
              onPointerCancel={zoneCancel}
              onPointerLeave={zoneCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{ touchAction: 'manipulation' }}
            />
            <button
              type="button"
              aria-label="Next slide"
              className="absolute inset-y-0 right-0 z-10 w-[70%] cursor-default focus:outline-none"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={zoneDown}
              onPointerUp={zoneUp('next')}
              onPointerCancel={zoneCancel}
              onPointerLeave={zoneCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{ touchAction: 'manipulation' }}
            />
          </>
        )}

        {/* Progress rail + close, above everything. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-3 px-4 pt-4 sm:px-6">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {slides.map((s, i) => (
              <span key={`${s.kind}-${i}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <span
                  className="block h-full rounded-full bg-white"
                  style={{ width: `${i < index ? 100 : i === index ? (reduced || slide.kind === 'summary' ? 100 : progress * 100) : 0}%` }}
                />
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onExit}
            aria-label="Close Wrapped"
            data-wrapped-control="true"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg leading-none text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            ×
          </button>
        </div>

        {held && slide.kind !== 'summary' && (
          <p className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
            paused
          </p>
        )}
        {reduced && slide.kind !== 'summary' && (
          <p className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
            tap the right side to continue
          </p>
        )}
      </div>
    </WrappedMotionContext.Provider>
  )
}
