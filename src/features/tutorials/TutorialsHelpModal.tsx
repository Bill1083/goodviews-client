import { createPortal } from 'react-dom'
import { useTutorialReplayStore } from '../../store/tutorialReplayStore'
import { TUTORIALS } from './registry'

/** The voluntary counterpart to TutorialManager's automatic popup — every
 *  tutorial, for anyone (new or returning) to browse on their own time from
 *  Profile's Help button. "View" hands the key off to tutorialReplayStore
 *  and closes this list immediately — the actual spotlight tour always
 *  renders from TutorialManager at the app root, since it may need to
 *  navigate to another page, which would unmount this modal. */
export default function TutorialsHelpModal({ onClose }: { onClose: () => void }) {
  const requestReplay = useTutorialReplayStore((s) => s.requestReplay)

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="panel-card dialog-scale-in flex max-h-[80vh] w-full max-w-md flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-lighter">Features &amp; Tutorials</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-muted hover:text-gray-lighter transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-muted">A quick look at what's changed — revisit any of these any time.</p>
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {TUTORIALS.map((t) => (
            <li key={t.key}>
              <button
                onClick={() => {
                  requestReplay(t.key)
                  onClose()
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <span className="text-sm text-gray-light">{t.title}</span>
                <span className="text-xs text-teal shrink-0">View →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
