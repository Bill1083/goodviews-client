import { useEffect, useRef } from 'react'

/** Ties a modal's dismissal to the browser's native back gesture/button instead of a
 *  custom swipe-down gesture — works with the OS/browser rather than competing with it
 *  for the same gesture. Pushes a dummy history entry on mount; a back gesture pops it
 *  and closes the modal, and closing any other way (X, Escape, backdrop click) consumes
 *  the dummy entry itself so back/forward history stays clean either way. */
export function useCloseOnBack(onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    window.history.pushState({ modalOpen: true }, '')

    const handlePopState = () => onCloseRef.current()
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Closed via X/Escape/backdrop (not the back gesture) — the dummy entry we pushed
      // is still current, so consume it. If it were closed via the back gesture, we'd
      // already be on the previous entry by the time this runs, so this is a no-op then.
      if (window.history.state?.modalOpen) window.history.back()
    }
  }, [])
}
