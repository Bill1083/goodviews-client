import { useState } from 'react'
import RadarChart from '../../../components/charts/RadarChart'
import { useInView } from '../../../hooks/useInView'
import type { DashboardStats } from '../../../types/stats'
import { formatPercent, plural } from '../../../utils/formatStats'
import { genreStyle } from '../../../utils/genres'
import DashboardCard from './DashboardCard'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
}

type Mode = 'watched' | 'loved'

/** "Taste DNA": a radar of the top genres by how often you watch them, or by
 * how much you like them (rating-weighted affinity), plus the callouts. */
export default function GenreDnaSection({ stats, index, className }: Props) {
  const [mode, setMode] = useState<Mode>('watched')
  const [ref, inView] = useInView<HTMLDivElement>()
  const films = stats.headline.films
  const top = stats.genres.slice(0, 8)
  const maxCount = Math.max(1, ...top.map((g) => g.count))
  const maxAffinity = Math.max(1, ...top.map((g) => g.affinity))
  const hl = stats.genre_highlights

  const axes = top.map((g) => ({
    label: g.name,
    value: mode === 'watched' ? g.count / maxCount : Math.max(0, g.affinity) / maxAffinity,
    valueLabel:
      mode === 'watched'
        ? `${g.count} ${plural(g.count, 'film')} · ${formatPercent(g.share)}`
        : `${g.affinity > 0 ? '+' : ''}${g.affinity} affinity · ${g.avg_rating?.toFixed(1) ?? '—'}★ avg`,
  }))

  let callout: string | null = null
  if (hl.most_watched && hl.highest_rated) {
    callout =
      hl.most_watched.id === hl.highest_rated.id
        ? `${hl.most_watched.name} is both your most-watched and your highest-rated genre (${hl.highest_rated.avg_rating?.toFixed(1)}★).`
        : `You watch ${hl.most_watched.name} the most, but you rate ${hl.highest_rated.name} the highest (${hl.highest_rated.avg_rating?.toFixed(1)}★ across ${hl.highest_rated.count} films).`
  } else if (hl.most_watched) {
    callout = `${hl.most_watched.name} leads with ${hl.most_watched.count} ${plural(hl.most_watched.count, 'film')}.`
  }

  return (
    <DashboardCard
      title="Taste DNA"
      subtitle={`${stats.genres.length} ${plural(stats.genres.length, 'genre')} watched`}
      index={index}
      className={className}
      films={films}
      minFilms={3}
      action={
        <div className="flex rounded-full border border-white/15 p-0.5 text-xs" role="tablist" aria-label="Radar mode">
          {(['watched', 'loved'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${mode === m ? 'bg-teal/20 text-teal' : 'text-gray-muted hover:text-gray-lighter'}`}
            >
              {m === 'watched' ? 'Watched' : 'Loved'}
            </button>
          ))}
        </div>
      }
      footnote={
        mode === 'loved'
          ? 'Affinity adds up every rating above "It was okay" and subtracts every rating below it, per genre.'
          : undefined
      }
    >
      <div ref={ref} className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
        {axes.length >= 3 ? (
          <RadarChart key={mode} axes={axes} ariaLabel={`Top genres by ${mode === 'watched' ? 'films watched' : 'affinity'}`} animate={inView} />
        ) : (
          <p className="text-sm text-gray-muted">Watch films across a few more genres to map your DNA.</p>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {callout && <p className="text-sm leading-snug text-gray-light">{callout}</p>}
          {hl.lowest_rated && (
            <p className="text-xs text-gray-muted">
              Least loved: {hl.lowest_rated.name} ({hl.lowest_rated.avg_rating?.toFixed(1)}★ over {hl.lowest_rated.count} films)
            </p>
          )}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {stats.genres.slice(0, 8).map((g) => (
              <li key={g.id} className="flex min-w-0 items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: genreStyle(g.id).color }} aria-hidden="true" />
                <span className="truncate text-gray-light">{g.name}</span>
                <span className="ml-auto shrink-0 text-xs text-gray-muted">
                  {g.count} · {g.avg_rating?.toFixed(1) ?? '—'}★
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardCard>
  )
}
