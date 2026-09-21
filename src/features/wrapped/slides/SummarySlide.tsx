import { useState } from 'react'
import RetryImage from '../../../components/RetryImage'
import type { WrappedSlide } from '../../../types/stats'
import { formatMinutesLong, plural } from '../../../utils/formatStats'
import { tmdbImage } from '../../../utils/tmdbImage'
import { useStagger } from '../SlideShell'
import { shareWrapped } from '../shareWrapped'

type Summary = Extract<WrappedSlide, { kind: 'summary' }>

interface Props {
  slide: Summary
  year: number
  onReplay: () => void
  onExit: () => void
}

/** The keepsake: one card with the year's highlights, plus replay / share /
 * back. This slide never auto-advances. */
export default function SummarySlide({ slide, year, onReplay, onExit }: Props) {
  const stagger = useStagger()
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'shared' | 'downloaded' | 'copied' | 'failed'>('idle')
  const hours = Math.round(slide.minutes / 60)

  const share = async () => {
    setShareState('busy')
    try {
      const result = await shareWrapped(slide, year)
      setShareState(result === 'cancelled' ? 'idle' : result)
    } catch {
      setShareState('failed')
    }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 px-5 pb-10 pt-16">
        <div
          {...stagger(0)}
          className={`w-full overflow-hidden rounded-3xl border border-white/15 bg-black/35 p-5 shadow-2xl backdrop-blur-md ${stagger(0).className}`}
          id="wrapped-summary-card"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">GoodViews Wrapped</p>
          <h2 className="text-gradient-brand mt-1 text-3xl font-bold" style={{ fontFamily: '"Source Sans 3", sans-serif' }}>
            {year}
          </h2>

          <div className="mt-4 flex gap-2">
            {slide.top_films.slice(0, 5).map((f, i) => {
              const src = tmdbImage(f.movie.poster_path, 'w185')
              return (
                <span key={f.movie.id} className="block flex-1 overflow-hidden rounded-md bg-black/40 shadow-lg" style={{ transform: `translateY(${(i % 2) * 6}px)` }}>
                  {src ? (
                    <RetryImage src={src} alt={f.movie.title} className="aspect-[2/3] w-full object-cover" fallback={<span className="block aspect-[2/3] w-full" />} />
                  ) : (
                    <span className="block aspect-[2/3] w-full" />
                  )}
                </span>
              )
            })}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-white">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-white/60">Films</dt>
              <dd className="text-2xl font-bold">{slide.films}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-white/60">Hours</dt>
              <dd className="text-2xl font-bold">{hours}</dd>
              {slide.minutes >= 1440 && <dd className="text-[11px] text-white/60">≈ {formatMinutesLong(slide.minutes)}</dd>}
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-white/60">Top genre</dt>
              <dd className="truncate text-lg font-semibold">{slide.top_genre?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-white/60">Average</dt>
              <dd className="text-lg font-semibold">{slide.avg_rating?.toFixed(1) ?? '—'}★</dd>
            </div>
            {slide.top_director && (
              <div className="col-span-2">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-white/60">Most-watched director</dt>
                <dd className="truncate text-lg font-semibold">
                  {slide.top_director.name} <span className="text-sm text-white/60">· {slide.top_director.count} {plural(slide.top_director.count, 'film')}</span>
                </dd>
              </div>
            )}
            <div className="col-span-2 mt-1 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
              <span className="text-3xl" aria-hidden="true">{slide.persona.emoji}</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">You are</p>
                <p className="text-xl font-bold">{slide.persona.title}</p>
              </div>
            </div>
          </dl>
        </div>

        <div {...stagger(1)} className={`flex flex-wrap justify-center gap-2 ${stagger(1).className}`} data-wrapped-control="true">
          <button type="button" onClick={share} disabled={shareState === 'busy'} className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60">
            {shareState === 'busy'
              ? 'Preparing…'
              : shareState === 'shared'
                ? 'Shared ✓'
                : shareState === 'downloaded'
                  ? 'Image saved ✓'
                  : shareState === 'copied'
                    ? 'Copied to clipboard ✓'
                    : shareState === 'failed'
                      ? 'Sharing failed'
                      : 'Share'}
          </button>
          <button type="button" onClick={onReplay} className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:border-teal hover:text-teal">
            Replay
          </button>
          <button type="button" onClick={onExit} className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:border-teal hover:text-teal">
            Back to profile
          </button>
        </div>
      </div>
    </div>
  )
}
