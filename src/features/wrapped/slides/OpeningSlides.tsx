import { useContext } from 'react'
import { useCountUp } from '../../../hooks/useCountUp'
import type { WrappedSlide } from '../../../types/stats'
import { formatDate, formatMinutesLong, monthName, plural } from '../../../utils/formatStats'
import { tmdbImage } from '../../../utils/tmdbImage'
import type { CSSProperties } from 'react'
import SlideShell, { Body, Eyebrow, Headline, WrappedMotionContext, useStagger } from '../SlideShell'

type Intro = Extract<WrappedSlide, { kind: 'intro' }>
type Volume = Extract<WrappedSlide, { kind: 'volume' }>
type Months = Extract<WrappedSlide, { kind: 'months' }>

/** A loose wall of the year's posters behind the title, each landing with
 * its own tilt. Deterministic tilts so re-renders don't jitter. */
export function PosterWall({ posters, opacity = 0.55 }: { posters: string[]; opacity?: number }) {
  const { reduced } = useContext(WrappedMotionContext)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-wrap justify-center gap-3 px-4" style={{ opacity }}>
        {posters.slice(0, 12).map((p, i) => {
          const src = tmdbImage(p, 'w185')
          const tilt = ((i * 37) % 13) - 6
          return src ? (
            <img
              key={`${p}-${i}`}
              src={src}
              alt=""
              className={`w-20 rounded-md shadow-2xl sm:w-24 ${reduced ? '' : 'poster-pop'}`}
              style={{ '--tilt': `${tilt}deg`, transform: `rotate(${tilt}deg)`, animationDelay: `${i * 90}ms` } as CSSProperties}
            />
          ) : null
        })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/60" />
    </div>
  )
}

export function IntroSlide({ slide, year }: { slide: Intro; year: number }) {
  return (
    <>
      <PosterWall posters={slide.poster_wall} />
      <SlideShell align="center">
        <Eyebrow index={0}>GoodViews Wrapped</Eyebrow>
        <Headline index={1} size="xl">
          Your {year} in film
        </Headline>
        <Body index={2}>
          It started on {formatDate(slide.first_rated_at, { day: 'numeric', month: 'long' })} with <span className="font-semibold text-white">{slide.first_film.title}</span>.
          {' '}{slide.films} {plural(slide.films, 'film')} later, here's how it went.
        </Body>
      </SlideShell>
    </>
  )
}

function Counter({ value, format }: { value: number; format: (v: number) => string }) {
  const shown = useCountUp(value, true, 1400)
  return <>{format(shown)}</>
}

export function VolumeSlide({ slide }: { slide: Volume }) {
  const stagger = useStagger()
  const hours = slide.minutes / 60
  return (
    <SlideShell>
      <Eyebrow index={0}>The numbers</Eyebrow>
      <div {...stagger(1)} className={stagger(1).className}>
        <p className="text-7xl font-bold leading-none text-white drop-shadow-lg sm:text-8xl" style={{ fontFamily: '"Source Sans 3", sans-serif' }}>
          <Counter value={slide.films} format={(v) => Math.round(v).toLocaleString()} />
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/70">{plural(slide.films, 'film')} watched</p>
      </div>
      <div {...stagger(2)} className={`grid grid-cols-2 gap-x-8 gap-y-4 ${stagger(2).className}`}>
        <div>
          <p className="text-3xl font-bold text-white sm:text-4xl">
            <Counter value={hours} format={(v) => `${Math.round(v).toLocaleString()}`} />
            <span className="text-lg text-white/70"> hrs</span>
          </p>
          <p className="text-xs uppercase tracking-[0.15em] text-white/60">{slide.minutes >= 1440 ? `≈ ${formatMinutesLong(slide.minutes)}` : 'on screen'}</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-white sm:text-4xl">{slide.avg_rating?.toFixed(1) ?? '—'}★</p>
          <p className="text-xs uppercase tracking-[0.15em] text-white/60">average rating</p>
        </div>
        {slide.rewatches > 0 && (
          <div>
            <p className="text-3xl font-bold text-white sm:text-4xl">{slide.rewatches}</p>
            <p className="text-xs uppercase tracking-[0.15em] text-white/60">{plural(slide.rewatches, 'rewatch', 'rewatches')}</p>
          </div>
        )}
      </div>
      <Body index={3}>
        {slide.days_equiv >= 1
          ? `That's ${slide.days_equiv} full ${plural(Math.round(slide.days_equiv), 'day')} of your year, lights down.`
          : 'A whole lot of stories for one year.'}
      </Body>
    </SlideShell>
  )
}

export function MonthsSlide({ slide, year }: { slide: Months; year: number }) {
  const stagger = useStagger()
  const { reduced } = useContext(WrappedMotionContext)
  const max = Math.max(1, ...slide.months.map((m) => m.count))
  const busiest = slide.busiest
  return (
    <SlideShell>
      <Eyebrow index={0}>Month by month</Eyebrow>
      <Headline index={1}>
        {monthName(busiest.month)} was your month
      </Headline>
      <Body index={2}>
        {busiest.count} {plural(busiest.count, 'film')} in {monthName(busiest.month)} {year}
        {slide.quietest && slide.quietest.count < busiest.count
          ? slide.quietest.count === 0
            ? `, and not a single one in ${monthName(slide.quietest.month)}.`
            : `, while ${monthName(slide.quietest.month)} managed just ${slide.quietest.count}.`
          : '.'}
        {slide.longest_streak_weeks >= 3 && ` Your longest run: ${slide.longest_streak_weeks} weeks straight with at least one film.`}
      </Body>
      <div {...stagger(3)} className={`mt-2 flex h-40 w-full items-end gap-1.5 sm:h-48 ${stagger(3).className}`} role="img" aria-label="Films per month">
        {slide.months.map((m, i) => (
          <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span
              className={`w-full max-w-7 rounded-t-[4px] ${m.month === busiest.month ? 'bg-white' : 'bg-white/45'} ${reduced ? '' : 'bar-grow'}`}
              style={{ height: `${Math.max(m.count > 0 ? 4 : 2, (m.count / max) * 100)}%`, animationDelay: `${i * 60}ms` }}
            />
            <span className={`text-[10px] ${m.month === busiest.month ? 'font-semibold text-white' : 'text-white/60'}`}>{monthName(m.month, true)[0]}</span>
          </div>
        ))}
      </div>
    </SlideShell>
  )
}
