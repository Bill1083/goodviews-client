import { useEffect } from 'react'

let lockCount = 0
let savedScrollY = 0

/** Prevents the page behind a modal/overlay from scrolling while `active` is true.
 *  Uses position:fixed + restoring scrollY (not just overflow:hidden) because iOS Safari
 *  still allows rubber-band scrolling behind a plain `overflow: hidden` body. Reference-counted
 *  so multiple overlays open at once (e.g. a modal that opens another modal) don't fight over
 *  restoring body styles when the first one closes. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    if (lockCount === 0) {
      savedScrollY = window.scrollY
      const body = document.body.style
      body.position = 'fixed'
      body.top = `-${savedScrollY}px`
      body.left = '0'
      body.right = '0'
      body.width = '100%'
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        const body = document.body.style
        body.position = ''
        body.top = ''
        body.left = ''
        body.right = ''
        body.width = ''
        window.scrollTo(0, savedScrollY)
      }
    }
  }, [active])
}
