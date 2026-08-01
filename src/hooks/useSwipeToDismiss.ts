import { useRef } from 'react'
import { triggerHaptic } from '../utils/haptics'

const DISMISS_DISTANCE = 120 // px of downward drag before releasing counts as a dismiss
const DISMISS_VELOCITY = 0.6 // px/ms — a fast downward flick dismisses even under the distance threshold

/** Drag-down-to-close for a modal, mirroring the native bottom-sheet gesture. Spread the
 *  returned `handlers` onto a non-scrolling header/handle area (not the whole modal — the
 *  scrollable body needs to keep receiving normal touch scroll), and attach `panelRef` /
 *  `overlayRef` to the modal panel and its backdrop respectively. Touch-only: a mouse-drag
 *  version would fight with normal desktop interactions the gesture was never meant to cover. */
export function useSwipeToDismiss(onClose: () => void) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const startYRef = useRef(0)
  const startXRef = useRef(0)
  const lastDyRef = useRef(0)
  const lastTsRef = useRef(0)
  const velocityRef = useRef(0)
  const hapticFiredRef = useRef(false)

  const applyTransform = (dy: number, animate: boolean) => {
    const panel = panelRef.current
    const overlay = overlayRef.current
    if (panel) {
      panel.style.transition = animate ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
      panel.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
    }
    if (overlay) {
      overlay.style.transition = animate ? 'opacity 220ms ease' : 'none'
      overlay.style.opacity = String(Math.max(0, 1 - dy / (DISMISS_DISTANCE * 2.5)))
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    draggingRef.current = true
    startYRef.current = e.clientY
    startXRef.current = e.clientX
    lastDyRef.current = 0
    lastTsRef.current = performance.now()
    velocityRef.current = 0
    hapticFiredRef.current = false
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const dy = e.clientY - startYRef.current
    const dx = e.clientX - startXRef.current
    // Only a clearly-downward pull counts — ignore sideways or upward motion entirely.
    if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return
    const now = performance.now()
    const dt = now - lastTsRef.current
    if (dt > 0) velocityRef.current = (dy - lastDyRef.current) / dt
    lastDyRef.current = dy
    lastTsRef.current = now
    if (!hapticFiredRef.current && dy > DISMISS_DISTANCE) {
      hapticFiredRef.current = true
      triggerHaptic()
    }
    applyTransform(dy, false)
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    const dy = lastDyRef.current
    const velocity = velocityRef.current
    if (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      onClose()
      return
    }
    applyTransform(0, true)
  }

  return {
    overlayRef,
    panelRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
