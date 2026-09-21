import { useState } from 'react'
import HorizontalBars from '../../../components/charts/HorizontalBars'
import type { DashboardStats } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PersonThumb from './PersonThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onPerson: (personId: number) => void
}

type Tab = 'directors' | 'actors'

export default function PeopleSection({ stats, index, className, onPerson }: Props) {
  const [tab, setTab] = useState<Tab>('directors')
  const films = stats.headline.films
  const block = stats.people[tab]
  const best = block.highest_rated[0]
  const coverage = stats.coverage

  const rows = block.most_watched.map((p) => ({
    key: p.id,
    label: p.name,
    value: p.count,
    valueLabel: `${p.count} ${plural(p.count, 'film')}`,
    sub: `${p.avg_rating != null ? `${p.avg_rating.toFixed(1)}★ avg · ` : ''}${p.films.slice(0, 3).map((f) => f.title).join(', ')}`,
    thumb: <PersonThumb path={p.profile_path} name={p.name} />,
    onClick: () => onPerson(p.id),
  }))

  return (
    <DashboardCard
      title="The people you keep watching"
      index={index}
      className={className}
      films={films}
      minFilms={3}
      action={
        <div className="flex rounded-full border border-white/15 p-0.5 text-xs" role="tablist" aria-label="Directors or actors">
          {(['directors', 'actors'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 font-medium capitalize transition-colors ${tab === t ? 'bg-teal/20 text-teal' : 'text-gray-muted hover:text-gray-lighter'}`}
            >
              {t}
            </button>
          ))}
        </div>
      }
      footnote={
        coverage.with_people < films
          ? `Cast and crew known for ${coverage.with_people} of ${films} films — the rest fill in as details refresh.`
          : undefined
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-gray-muted">
          {coverage.with_people === 0 ? 'Cast and crew details are still being gathered.' : `No ${tab} yet.`}
        </p>
      ) : (
        <>
          {best && best.count >= 2 && (
            <p className="rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-light">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Best rated · </span>
              <button type="button" onClick={() => onPerson(best.id)} className="font-semibold text-gray-lighter hover:text-teal">
                {best.name}
              </button>{' '}
              <span className="text-gray-muted">
                {best.avg_rating?.toFixed(1)}★ over {best.count} {plural(best.count, 'film')}
              </span>
            </p>
          )}
          <HorizontalBars key={tab} rows={rows} />
        </>
      )}
    </DashboardCard>
  )
}
