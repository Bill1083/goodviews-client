import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Tutorial } from './registry'

/** A short, dismissible multi-step walkthrough for one feature. Used both
 *  for the automatic "you're new here, here's what changed" popup
 *  (TutorialManager) and for voluntarily replaying any tutorial from
 *  Profile's Help button (TutorialsHelpModal) — `onClose` decides what
 *  "done" means in each case. */
export default function TutorialModal({ tutorial, onClose }: { tutorial: Tutorial; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = tutorial.steps[step]
  const isLast = step === tutorial.steps.length - 1

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="panel-card dialog-scale-in flex w-full max-w-sm flex-col gap-5 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-teal">New Feature</span>
          <button onClick={onClose} aria-label="Close" className="text-gray-muted hover:text-gray-lighter transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-lighter">{current.title}</h2>
          <p className="text-sm text-gray-light leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {tutorial.steps.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-teal' : 'bg-white/20'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="px-5 py-2 rounded-full bg-teal text-navy text-sm font-semibold hover:bg-teal-light transition-colors"
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
