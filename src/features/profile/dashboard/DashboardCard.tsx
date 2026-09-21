import type { ReactNode } from 'react'
import { plural } from '../../../utils/formatStats'

interface Props {
  title: string
  subtitle?: string
  className?: string
  /** Rate at least this many films before the card shows its content. */
  minFilms?: number
  films?: number
  /** Position in the grid, for the staggered entrance. */
  index?: number
  action?: ReactNode
  footnote?: ReactNode
  children: ReactNode
}

/** One dashboard section: eyebrow title, optional subtitle / action, body,
 * optional footnote. Below `minFilms` the body is replaced by a nudge. */
export default function DashboardCard({
  title,
  subtitle,
  className = '',
  minFilms = 0,
  films = 0,
  index = 0,
  action,
  footnote,
  children,
}: Props) {
  const missing = Math.max(0, minFilms - films)
  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-navy-card/60 p-4 animate-[fadeInUp_0.4s_ease-out_both] sm:p-5 ${className}`}
      style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-teal">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {missing > 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-gray-muted">
          Rate {missing} more {plural(missing, 'film')} to unlock this.
        </p>
      ) : (
        children
      )}
      {footnote && missing === 0 && <p className="text-[11px] leading-snug text-gray-muted">{footnote}</p>}
    </section>
  )
}
