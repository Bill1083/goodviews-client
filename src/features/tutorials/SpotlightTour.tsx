import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SpotlightStep } from './registry'

const PAD = 8 // breathing room between the ring and the real element
const GAP = 14 // space between the ring and the callout bubble
const CALLOUT_WIDTH = 280
const MARGIN = 16
const ARROW_FILL = 'rgba(22, 10, 47, 0.92)' // ≈ navy-card, matching .panel-card

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/** Polls for the target element (it may not exist yet right after a route
 *  change), scrolls it into view once found, and keeps re-measuring so the
 *  ring tracks it through scrolling/resizing/layout shifts. Gives up after
 *  ~2s rather than leaving the user stuck on a dimmed screen — e.g. if a
 *  responsive layout hides this control at the current viewport. */
function useAnchorRect(anchor: string, active: boolean) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (!active) {
      setRect(null)
      setGaveUp(false)
      return
    }
    setRect(null)
    setGaveUp(false)

    let misses = 0
    let scrolled = false
    const id = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>(`[data-tutorial-anchor="${anchor}"]`)
      if (!el) {
        misses += 1
        if (misses > 40) {
          window.clearInterval(id)
          setGaveUp(true)
        }
        return
      }
      misses = 0
      if (!scrolled) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        scrolled = true
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }, 50)

    return () => window.clearInterval(id)
  }, [anchor, active])

  return { rect, gaveUp }
}

/** Walks the real UI, lighting up one element at a time, instead of
 *  describing it in a dialog — navigates to each step's route, then dims
 *  everything but that element, wiggles a glowing ring around it, and
 *  points a small callout at it. The element itself stays fully clickable
 *  (the ring has pointer-events: none) — this is meant to be followed, not
 *  just read. */
export default function SpotlightTour({
  steps,
  highlightColor = '#14ceca',
  onDone,
}: {
  steps: SpotlightStep[]
  highlightColor?: string
  onDone: () => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== step.route) navigate(step.route)
    // Only when the target route changes — not on every location change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.route])

  const onTargetRoute = location.pathname === step.route
  const { rect, gaveUp } = useAnchorRect(step.anchor, onTargetRoute)

  useEffect(() => {
    if (gaveUp) onDone()
  }, [gaveUp, onDone])

  if (!onTargetRoute || !rect) return null

  const isLast = stepIndex === steps.length - 1
  const placement = step.placement ?? 'bottom'
  const padded = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }
  const ringRadius = padded.height / 2
  const vw = window.innerWidth
  const vh = window.innerHeight

  const strip = (s: CSSProperties): CSSProperties => ({
    position: 'fixed',
    background: 'rgba(0,0,0,0.75)',
    ...s,
  })

  const centerX = Math.min(Math.max(padded.left + padded.width / 2, MARGIN + CALLOUT_WIDTH / 2), vw - MARGIN - CALLOUT_WIDTH / 2)
  const centerY = Math.min(Math.max(padded.top + padded.height / 2, MARGIN), vh - MARGIN)

  let calloutStyle: CSSProperties = { position: 'fixed', width: CALLOUT_WIDTH }
  let arrowStyle: CSSProperties = { position: 'absolute', width: 0, height: 0 }

  if (placement === 'bottom') {
    calloutStyle = { ...calloutStyle, top: padded.top + padded.height + GAP, left: centerX, transform: 'translateX(-50%)' }
    arrowStyle = { ...arrowStyle, top: -6, left: '50%', transform: 'translateX(-50%)', borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: `7px solid ${ARROW_FILL}` }
  } else if (placement === 'top') {
    calloutStyle = { ...calloutStyle, bottom: vh - padded.top + GAP, left: centerX, transform: 'translateX(-50%)' }
    arrowStyle = { ...arrowStyle, bottom: -6, left: '50%', transform: 'translateX(-50%)', borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `7px solid ${ARROW_FILL}` }
  } else if (placement === 'left') {
    calloutStyle = { ...calloutStyle, top: centerY, right: vw - padded.left + GAP, transform: 'translateY(-50%)' }
    arrowStyle = { ...arrowStyle, top: '50%', right: -6, transform: 'translateY(-50%)', borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: `7px solid ${ARROW_FILL}` }
  } else {
    calloutStyle = { ...calloutStyle, top: centerY, left: padded.left + padded.width + GAP, transform: 'translateY(-50%)' }
    arrowStyle = { ...arrowStyle, top: '50%', left: -6, transform: 'translateY(-50%)', borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: `7px solid ${ARROW_FILL}` }
  }

  return createPortal(
    <>
      {/* Four strips dim everything except the padded hole around the
          target — clicking any of them ends the tour, same as clicking
          outside any other dialog in this app. */}
      <div onClick={onDone} role="presentation" style={strip({ top: 0, left: 0, width: '100%', height: Math.max(padded.top, 0), zIndex: 70 })} />
      <div onClick={onDone} role="presentation" style={strip({ top: padded.top + padded.height, left: 0, width: '100%', bottom: 0, zIndex: 70 })} />
      <div onClick={onDone} role="presentation" style={strip({ top: padded.top, left: 0, width: Math.max(padded.left, 0), height: padded.height, zIndex: 70 })} />
      <div onClick={onDone} role="presentation" style={strip({ top: padded.top, left: padded.left + padded.width, right: 0, height: padded.height, zIndex: 70 })} />

      {/* The ring itself never blocks clicks — the whole point is that the
          real control underneath stays usable. */}
      <div
        className="tutorial-ring"
        style={{
          position: 'fixed',
          top: padded.top,
          left: padded.left,
          width: padded.width,
          height: padded.height,
          borderRadius: ringRadius,
          pointerEvents: 'none',
          zIndex: 71,
          ['--tutorial-ring-color' as string]: highlightColor,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="panel-card dialog-scale-in flex flex-col gap-3 p-4"
        style={{ ...calloutStyle, zIndex: 72 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={arrowStyle} />
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm leading-relaxed text-gray-light">{step.text}</p>
          <button onClick={onDone} aria-label="Close" className="shrink-0 text-gray-muted hover:text-gray-lighter transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between">
          {steps.length > 1 ? (
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === stepIndex ? 'bg-teal' : 'bg-white/20'}`} />
              ))}
            </div>
          ) : <span />}
          <button
            onClick={() => (isLast ? onDone() : setStepIndex((i) => i + 1))}
            className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-navy hover:bg-teal-light transition-colors"
          >
            {isLast ? 'Got it' : 'Next →'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
