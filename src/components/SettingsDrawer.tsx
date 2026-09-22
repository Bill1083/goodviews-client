import { useEffect, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import SettingsPanel from './SettingsPanel'

/** Settings, opened from the navbar on top of whatever page you're already on
 *  instead of navigating away. Full-width on phones (reads as its own screen),
 *  a comfortable fixed-width side panel from `sm:` up — same slide-in-from-the-
 *  right/backdrop convention as MyMoviesPage's filter & sort panels. */
export default function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Keeps the panel's content mounted through the close animation instead of
  // vanishing the instant `open` flips false, and skips rendering (and firing
  // its profile/MFA queries) until first opened.
  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => {
    if (open) setHasOpened(true)
  }, [open])

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        data-settings-scroll="true"
        className={[
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto bg-navy border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out sm:w-[440px]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {hasOpened && (
          <div className="flex flex-1 flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
            <SettingsPanel onClose={onClose} closeLabel="Close" />
          </div>
        )}
      </div>
    </>
  )
}
