import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const SETTLE_MS = 320
const SETTLE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const COMMIT_FRACTION = 0.3 // drag past 30% of the viewport width commits to the next/prev tab
const COMMIT_VELOCITY = 0.5 // px/ms — a fast flick commits even under the distance threshold
const RUBBER_BAND = 0.35 // resistance factor when dragging past the first/last tab
const AXIS_LOCK_PX = 8 // px of movement before we decide this gesture is horizontal vs vertical

interface Props {
  /** Route paths, in display order — index N's panel renders at position N. */
  paths: string[]
  /** One panel per path, same order. All panels stay mounted so you can drag partway
   *  in, pause, and return without losing scroll position or component state. */
  panels: ReactNode[]
}

/** A live, finger-following carousel between the app's top-level tabs — replaces the old
 *  "swipe triggers a one-shot navigate()" behavior with something you can drag, pause
 *  halfway through, and reverse, like a native app's tab paging. */
export default function SwipeableTabs({ paths, panels }: Props) {
  const location = useLocation()
  const navigate = useNavigate()

  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const navHeightRef = useRef(0)

  const indexRef = useRef(Math.max(0, paths.indexOf(location.pathname)))
  const draggingRef = useRef(false)
  const lockedAxisRef = useRef<'x' | 'y' | null>(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const lastDxRef = useRef(0)
  const lastTsRef = useRef(0)
  const velocityRef = useRef(0)
  const widthRef = useRef(0)

  const currentIndex = Math.max(0, paths.indexOf(location.pathname))

  const applyTransform = (index: number, dragPx: number, animate: boolean) => {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animate ? `transform ${SETTLE_MS}ms ${SETTLE_EASING}` : 'none'
    track.style.transform = `translate3d(calc(${-index * 100}% + ${dragPx}px), 0, 0)`
  }

  // Keep the track's settled position in sync with the URL whenever we're not mid-drag —
  // covers nav-bar taps and browser back/forward, not just the gesture itself.
  useLayoutEffect(() => {
    indexRef.current = currentIndex
    if (!draggingRef.current) applyTransform(currentIndex, 0, false)
  }, [currentIndex])

  useLayoutEffect(() => {
    const measure = () => {
      widthRef.current = containerRef.current?.getBoundingClientRect().width ?? window.innerWidth
      navHeightRef.current = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      const el = containerRef.current
      if (el) el.style.height = `calc(100vh - ${navHeightRef.current}px)`
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    // Touch/pen only — a mouse-drag version of this would hijack text selection on desktop,
    // which never swiped between tabs before.
    if (e.pointerType === 'mouse') return
    let target = e.target as Element | null
    while (target) {
      if (target.hasAttribute?.('data-no-swipe')) return
      target = target.parentElement
    }
    draggingRef.current = true
    lockedAxisRef.current = null
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    lastDxRef.current = 0
    lastTsRef.current = performance.now()
    velocityRef.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const dx = e.clientX - startXRef.current
    const dy = e.clientY - startYRef.current

    if (lockedAxisRef.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      lockedAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (lockedAxisRef.current === 'y') {
        // Vertical intent — let the page scroll natively, we're done with this gesture.
        draggingRef.current = false
        return
      }
      try {
        ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      } catch {
        // Some browsers refuse capture outside a direct pointerdown target; harmless to skip.
      }
    }

    const index = indexRef.current
    const atStart = index === 0 && dx > 0
    const atEnd = index === paths.length - 1 && dx < 0
    const clamped = atStart || atEnd ? dx * RUBBER_BAND : dx

    const now = performance.now()
    const dt = now - lastTsRef.current
    if (dt > 0) velocityRef.current = (dx - lastDxRef.current) / dt
    lastDxRef.current = dx
    lastTsRef.current = now

    applyTransform(index, clamped, false)
  }

  const settle = () => {
    lockedAxisRef.current = null
    if (!draggingRef.current) return
    draggingRef.current = false

    const index = indexRef.current
    const width = widthRef.current || 1
    const dx = lastDxRef.current
    const velocity = velocityRef.current // px/ms, positive = dragging toward the previous tab

    let target = index
    if (dx <= -width * COMMIT_FRACTION || velocity < -COMMIT_VELOCITY) {
      target = Math.min(paths.length - 1, index + 1)
    } else if (dx >= width * COMMIT_FRACTION || velocity > COMMIT_VELOCITY) {
      target = Math.max(0, index - 1)
    }

    if (target !== index) {
      indexRef.current = target
      applyTransform(target, 0, true)
      navigate(paths[target])
    } else {
      applyTransform(index, 0, true)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" style={{ touchAction: 'pan-y' }}>
      <div
        ref={trackRef}
        className="flex h-full w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={settle}
        onPointerCancel={settle}
      >
        {panels.map((panel, i) => (
          <div key={paths[i]} className="h-full w-full shrink-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {panel}
          </div>
        ))}
      </div>
    </div>
  )
}
