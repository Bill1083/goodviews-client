import type { DashboardStats, FavouriteCoverage, MovieRef } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PersonThumb from './PersonThumb'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onPerson: (personId: number) => void
  onMovie: (movie: MovieRef) => void
}

function Row({ fav, kind, onPerson, onMovie }: { fav: FavouriteCoverage; kind: string; onPerson: (id: number) => void; onMovie: (m: MovieRef) => void }) {
  const name = fav.name ?? kind
  return (
    <li className="flex items-center gap-3">
      <button type="button" onClick={() => onPerson(fav.id)} className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/60" aria-label={name}>
        <PersonThumb path={fav.profile_path} name={name} size="md" />
      </button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onPerson(fav.id)} className="block max-w-full truncate text-left text-sm font-semibold text-gray-lighter hover:text-teal">
          {name} <span className="text-[11px] font-normal text-gray-muted">· {kind.toLowerCase()}</span>
        </button>
        <p className="text-xs text-gray-muted">
          {fav.seen_count === 0
            ? `Nothing of theirs rated yet`
            : `${fav.seen_count} ${plural(fav.seen_count, 'film')} seen${fav.avg_rating != null ? ` · ${fav.avg_rating.toFixed(1)}★ avg` : ''}`}
        </p>
      </div>
      {fav.films.length > 0 && (
        <div className="flex shrink-0 gap-1">
          {fav.films.slice(0, 3).map((f) => (
            <PosterThumb key={f.id} path={f.poster_path} title={f.title} size="xs" onClick={() => onMovie(f)} />
          ))}
        </div>
      )}
    </li>
  )
}

export default function FavouritesCoverageSection({ stats, index, className, onPerson, onMovie }: Props) {
  const { actors, directors } = stats.favourites
  if (actors.length === 0 && directors.length === 0) return null
  return (
    <DashboardCard title="Your favourites, on your record" subtitle="How much of their work you've actually rated" index={index} className={className}>
      <ul className="flex flex-col gap-3">
        {directors.map((fav) => (
          <Row key={`d-${fav.id}`} fav={fav} kind="Director" onPerson={onPerson} onMovie={onMovie} />
        ))}
        {actors.map((fav) => (
          <Row key={`a-${fav.id}`} fav={fav} kind="Actor" onPerson={onPerson} onMovie={onMovie} />
        ))}
      </ul>
    </DashboardCard>
  )
}
