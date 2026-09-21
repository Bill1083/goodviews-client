import DivergingBar from '../../../components/charts/DivergingBar'
import type { DashboardStats, HotTake, MovieRef } from '../../../types/stats'
import { formatPercent, formatStarDelta } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

function TakeCard({ take, heading, onMovie }: { take: HotTake; heading: string; onMovie: (movie: MovieRef) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <PosterThumb path={take.movie.poster_path} title={take.movie.title} size="sm" onClick={() => onMovie(take.movie)} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">{heading}</p>
        <p className="truncate text-sm font-semibold text-gray-lighter">{take.movie.title}</p>
        <p className="text-xs text-gray-light">
          You <span className="font-semibold text-gray-lighter">★{take.your_rating}</span>
          <span className="text-gray-muted"> · </span>
          the world <span className="font-semibold text-gray-lighter">{take.tmdb.toFixed(1)}/10</span>
        </p>
      </div>
    </div>
  )
}

export default function TasteVsWorldSection({ stats, index, className, onMovie }: Props) {
  const v = stats.vs_world
  const films = stats.headline.films
  const stars = (v.mean_delta ?? 0) / 2

  let sentence = 'You and the crowd mostly agree — within half a star on average.'
  if (v.label === 'kinder') sentence = `You rate films ${Math.abs(stars).toFixed(1)}★ kinder than the crowd, on average.`
  if (v.label === 'harsher') sentence = `You rate films ${Math.abs(stars).toFixed(1)}★ harsher than the crowd, on average.`

  return (
    <DashboardCard
      title="You vs the world"
      subtitle="Your stars against TMDB's crowd score"
      index={index}
      className={className}
      films={films}
      minFilms={3}
      footnote={v.sample_size > 0 ? `Compared across ${v.sample_size} films with at least 50 public votes.` : undefined}
    >
      {v.sample_size === 0 ? (
        <p className="text-sm text-gray-muted">Rate a few more widely-seen films to see how your taste compares.</p>
      ) : (
        <>
          <div className="pt-6">
            <DivergingBar
              value={stars}
              range={2}
              leftLabel="Harsher"
              rightLabel="Kinder"
              valueLabel={formatStarDelta(v.mean_delta)}
              ariaLabel={`Average difference from the crowd: ${formatStarDelta(v.mean_delta)}`}
            />
          </div>
          <p className="text-sm leading-snug text-gray-light">{sentence}</p>
          {v.agreement_share != null && (
            <p className="text-xs text-gray-muted">You land within a star of the crowd on {formatPercent(v.agreement_share)} of films.</p>
          )}
          {(v.hot_takes.loved_more[0] || v.hot_takes.loved_less[0]) && (
            <div className="flex flex-col gap-2">
              {v.hot_takes.loved_more[0] && <TakeCard take={v.hot_takes.loved_more[0]} heading="Your hidden favourite" onMovie={onMovie} />}
              {v.hot_takes.loved_less[0] && <TakeCard take={v.hot_takes.loved_less[0]} heading="Your hot take" onMovie={onMovie} />}
            </div>
          )}
        </>
      )}
    </DashboardCard>
  )
}
