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
    <div className="flex items-center justify-center gap-4">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">← Prev</button>
      <span className="text-sm text-gray-muted">Page {page} of {Math.min(totalPages, 500)}</span>
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80">Next →</button>
    </div>
  )
}
