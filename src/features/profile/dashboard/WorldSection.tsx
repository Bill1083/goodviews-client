import { SENTIMENT, SERIES_PRIMARY, TRACK } from '../../../components/charts/chartTheme'
import type { DashboardStats, MovieRef } from '../../../types/stats'
import { formatMoney, formatPercent, languageName, plural, regionName } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PosterStrip from './PosterStrip'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

function Chips({ items }: { items: { key: string; label: string; count: number }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <li key={it.key} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-gray-light">
          {it.label} <span className="text-gray-muted">· {it.count}</span>
        </li>
      ))}
    </ul>
  )
}

/** Countries, languages, budgets, hidden gems and franchises — the sections
 * that need the sql/008 extras, so they only render once enough films have
 * them. */
export default function WorldSection({ stats, index, className, onMovie }: Props) {
  const x = stats.extras
  if (!x) return null
  const b = x.budget
  const budgetTotal = b.sample_size
  const midCount = Math.max(0, budgetTotal - b.blockbuster_count - b.indie_count)
  const partial = stats.coverage.with_extras < stats.coverage.films

  return (
    <DashboardCard
      title="Off the beaten path"
      subtitle={`${x.countries.count} ${plural(x.countries.count, 'country', 'countries')} · ${x.languages.count} ${plural(x.languages.count, 'language')}`}
      index={index}
      className={className}
      footnote={partial ? `Based on ${x.sample_size} of ${stats.coverage.films} films — details for the rest are still being gathered.` : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Countries</p>
          <Chips items={x.countries.top.map((c) => ({ key: c.code, label: regionName(c.code), count: c.count }))} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">
            Languages <span className="normal-case tracking-normal text-gray-medium">· {formatPercent(x.languages.non_english_share)} not in English</span>
          </p>
          <Chips items={x.languages.top.map((l) => ({ key: l.code, label: languageName(l.code), count: l.count }))} />
        </div>
      </div>

      {budgetTotal > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-gray-light">Blockbusters vs indies</span>
            {b.median_budget != null && <span className="text-gray-muted">median budget {formatMoney(b.median_budget)}</span>}
          </div>
          <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-[4px]" style={{ backgroundColor: TRACK }} role="img" aria-label={`${b.blockbuster_count} blockbusters, ${midCount} mid-budget, ${b.indie_count} indies`}>
            <span style={{ width: `${(b.blockbuster_count / budgetTotal) * 100}%`, backgroundColor: SERIES_PRIMARY }} />
            <span style={{ width: `${(midCount / budgetTotal) * 100}%`, backgroundColor: SENTIMENT.neutral }} />
            <span style={{ width: `${(b.indie_count / budgetTotal) * 100}%`, backgroundColor: SENTIMENT.negative }} />
          </div>
          <div className="flex justify-between text-[11px] text-gray-muted">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SERIES_PRIMARY }} aria-hidden="true" />
              {b.blockbuster_count} over $100M
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SENTIMENT.negative }} aria-hidden="true" />
              {b.indie_count} under $5M
            </span>
          </div>
        </div>
      )}

      {x.hidden_gems.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Hidden gems you loved</p>
          <PosterStrip films={x.hidden_gems} onSelect={onMovie} />
        </div>
      )}

      {x.franchises.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Franchises</p>
          <ul className="flex flex-col gap-2">
            {x.franchises.map((fr) => (
              <li key={fr.collection_id} className="flex items-center gap-3">
                <div className="flex shrink-0 gap-1">
                  {fr.films.slice(0, 3).map((f) => (
                    <PosterThumb key={f.id} path={f.poster_path} title={f.title} size="xs" onClick={() => onMovie(f)} />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-lighter">{fr.name}</p>
                  <p className="text-xs text-gray-muted">
                    {fr.count} {plural(fr.count, 'entry', 'entries')}
                    {fr.avg_rating != null && ` · ${fr.avg_rating.toFixed(1)}★ avg`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardCard>
  )
}
