// Tracks the viewport coordinates of the most recent pointer/mouse press, app-wide.
//
// MovieDetailModal reads this on mount to anchor its "coming forward" zoom animation
// to wherever the user actually tapped/clicked — the poster in a carousel, a grid
// card, a filmography thumbnail, etc. — without every call site needing to thread a
// click position through props. A capture-phase listener on `window` always sees the
// press before React's own (bubble-phase) click handlers run, so by the time a
// selection handler opens the modal, this value is already up to date.

let lastPosition: { x: number; y: number } | null = null

function record(e: PointerEvent | MouseEvent) {
  lastPosition = { x: e.clientX, y: e.clientY }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', record, true)
  window.addEventListener('mousedown', record, true)
}

export function getLastPointerPosition() {
  return lastPosition
}
