// min-h/min-w-11 (44px) matches Apple's own minimum recommended touch
// target — the old plain text links were comfortably clickable with a
// mouse but easy to miss-tap on a phone, especially near a screen edge.
const BUTTON_CLASS =
  'flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-white/15 px-4 text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-navy-card/50 active:bg-navy-card/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:bg-transparent'

export default function PaginationControls({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className={BUTTON_CLASS}>← Prev</button>
      <span className="text-sm text-gray-muted">Page {page} of {Math.min(totalPages, 500)}</span>
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={BUTTON_CLASS}>Next →</button>
    </div>
  )
}
