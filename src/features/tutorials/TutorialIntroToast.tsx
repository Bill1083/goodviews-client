import { createPortal } from 'react-dom'

/** The first, low-key beat of a tutorial — a small corner toast, never a
 *  blocking dialog. "Show me" is what actually takes the user to the real
 *  control (see SpotlightTour); closing here just dismisses outright. */
export default function TutorialIntroToast({
  text,
  onShowMe,
  onDismiss,
}: {
  text: string
  onShowMe: () => void
  onDismiss: () => void
}) {
  return createPortal(
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-[70] animate-[fadeInUp_0.3s_ease-out_both] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-80"
    >
      <div className="panel-card flex items-start gap-3 overflow-hidden p-4" style={{ boxShadow: '0 0 0 1px rgba(20,206,202,0.25), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-light">{text}</p>
        <button
          onClick={onDismiss}
          aria-label="No thanks"
          title="No thanks"
          className="shrink-0 text-gray-muted hover:text-gray-lighter transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          onClick={onDismiss}
          className="text-xs text-gray-muted hover:text-gray-lighter transition-colors"
        >
          No thanks
        </button>
        <button
          onClick={onShowMe}
          className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-navy hover:bg-teal-light transition-colors"
        >
          Show me →
        </button>
      </div>
    </div>,
    document.body,
  )
}
