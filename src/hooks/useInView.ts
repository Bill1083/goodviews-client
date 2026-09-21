import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** Fires once when the element first scrolls into view, so count-ups and
 * chart animations start when the user can actually see them. Falls back to
 * "in view" where IntersectionObserver is missing. */
export function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px'): [RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        // Already scrolled past (bottom above the viewport) counts as seen:
        // on a reload that restores scroll position, a card above the fold
        // would otherwise sit at its starting value indefinitely — wrong for
        // anyone scrolling back up, for find-in-page and for screen readers.
        if (entries.some((e) => e.isIntersecting || e.boundingClientRect.bottom <= 0)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, inView]
}
