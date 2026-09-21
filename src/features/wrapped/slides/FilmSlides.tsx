import { useContext } from 'react'
import RetryImage from '../../../components/RetryImage'
import type { RatedFilm, WrappedSlide } from '../../../types/stats'
import { formatPercent, plural, releaseYear } from '../../../utils/formatStats'
import { ratingLabel } from '../../../utils/ratings'
import { tmdbImage } from '../../../utils/tmdbImage'
import SlideShell, { Body, Eyebrow, Headline, WrappedMotionContext, useStagger } from '../SlideShell'

type Loves = Extract<WrappedSlide, { kind: 'loves' }>
type Hates = Extract<WrappedSlide, { kind: 'hates' }>
type HotTake = Extract<WrappedSlide, { kind: 'hot_take' }>
type Critic = Extract<WrappedSlide, { kind: 'critic' }>
type Rewatches = Extract<WrappedSlide, { kind: 'rewatches' }>
type Words = Extract<WrappedSlide, { kind: 'words' }>
type HiddenGem = Extract<WrappedSlide, { kind: 'hidden_gem' }>

function Poster({ path, title, className = '', pop = false }: { path: string | null; title: string; className?: string; pop?: boolean }) {
  const { reduced } = useContext(WrappedMotionContext)
  const src = tmdbImage(path, 'w342')
  const fallback = <span className="flex h-full w-full items-center justify-center bg-black/40 p-2 text-center text-xs text-white/70">{title}</span>
  return (
    <span className={`block aspect-[2/3] overflow-hidden rounded-xl bg-black/40 shadow-2xl ${pop && !reduced ? 'wrapped-pop' : ''} ${className}`}>
      {src ? <RetryImage src={src} alt={title} className="h-full w-full object-cover" fallback={fallback} /> : fallback}
    </span>
  )
}

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.round(rating))}
      <span className="text-white/30">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  )
}

function FilmRow({ film, index, note }: { film: RatedFilm; index: number; note?: string }) {
  const stagger = useStagger()
  const s = stagger(index, 110)
  return (
    <li className={`flex items-center gap-3 ${s.className}`} style={s.style}>
      <Poster path={film.movie.poster_path} title={film.movie.title} className="w-12" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{film.movie.title}</p>
        <p className="text-xs text-white/70">
          <Stars rating={film.rating} /> {note ?? releaseYear(film.movie.release_date)}
        </p>
      </div>
    </li>
  )
}

export function LovesSlide({ slide }: { slide: Loves }) {
  const stagger = useStagger()
  const best = slide.film_of_the_year
  const others = slide.top.filter((f) => f.movie.id !== best.movie.id).slice(0, 4)
  return (
    <SlideShell backdropPath={best.movie.backdrop_path}>
      <Eyebrow index={0}>Your film of the year</Eyebrow>
      <div className="flex w-full items-end gap-5">
        <div {...stagger(1)} className={`w-32 shrink-0 sm:w-40 ${stagger(1).className}`}>
          <Poster path={best.movie.poster_path} title={best.movie.title} pop />
        </div>
        <div className="min-w-0">
          <Headline index={2}>{best.movie.title}</Headline>
          <p {...stagger(3)} className={`mt-2 text-lg text-white ${stagger(3).className}`}>
            <Stars rating={best.rating} /> <span className="text-white/70">{ratingLabel(best.rating)}</span>
          </p>
          <Body index={4}>{best.why}</Body>
        </div>
      </div>
      {others.length > 0 && (
        <div {...stagger(5)} className={`w-full ${stagger(5).className}`}>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
            Also loved · {slide.loved_count} {plural(slide.loved_count, 'film')} at 4★ or more
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {others.map((f, i) => (
              <FilmRow key={f.movie.id} film={f} index={6 + i} />
            ))}
          </ul>
        </div>
      )}
    </SlideShell>
  )
}

export function HatesSlide({ slide }: { slide: Hates }) {
  const worst = slide.worst[0]
  if (!worst) {
    return (
      <SlideShell align="center">
        <Eyebrow index={0}>The ones that hurt</Eyebrow>
        <Headline index={1} size="xl">
          Not a single dud
        </Headline>
        <Body index={2}>Every film you watched this year landed at "It was okay" or better. Either you choose well, or you're very forgiving.</Body>
      </SlideShell>
    )
  }
  return (
    <SlideShell backdropPath={worst.movie.backdrop_path}>
      <Eyebrow index={0}>The ones that hurt</Eyebrow>
      <Headline index={1}>
        {slide.disliked_count} {plural(slide.disliked_count, 'film')} got 2★ or less
      </Headline>
      <Body index={2}>
        {slide.one_star_count > 0
          ? `${slide.one_star_count} of them earned the full one-star treatment. Ouch.`
          : 'No one-star ratings, though — you kept it civil.'}
      </Body>
      <ul className="mt-2 flex w-full flex-col gap-3">
        {slide.worst.map((f, i) => (
          <FilmRow key={f.movie.id} film={f} index={3 + i} note={ratingLabel(f.rating)} />
        ))}
      </ul>
    </SlideShell>
  )
}

export function HotTakeSlide({ slide }: { slide: HotTake }) {
  const stagger = useStagger()
  const higher = slide.direction === 'higher'
  return (
    <SlideShell backdropPath={slide.movie.backdrop_path}>
      <Eyebrow index={0}>Your hottest take</Eyebrow>
      <div className="flex w-full items-center gap-5">
        <div {...stagger(1)} className={`w-28 shrink-0 sm:w-36 ${stagger(1).className}`}>
          <Poster path={slide.movie.poster_path} title={slide.movie.title} pop />
        </div>
        <div className="min-w-0">
          <Headline index={2}>{slide.movie.title}</Headline>
          <p {...stagger(3)} className={`mt-3 text-base leading-relaxed text-white/90 sm:text-lg ${stagger(3).className}`}>
            The world gave it <span className="font-bold text-white">{slide.tmdb.toFixed(1)}/10</span>.
            <br />
            You gave it <span className="font-bold text-white"><Stars rating={slide.your_rating} /></span>.
          </p>
          <Body index={4}>{higher ? "You saw something everyone else missed." : "You were not having it, and you were not alone in being alone."}</Body>
        </div>
      </div>
    </SlideShell>
  )
}

export function CriticSlide({ slide }: { slide: Critic }) {
  const stagger = useStagger()
  const stars = (slide.delta ?? 0) / 2
  const headline =
    slide.label === 'kinder'
      ? `You're ${Math.abs(stars).toFixed(1)}★ kinder than the crowd`
      : slide.label === 'harsher'
        ? `You're ${Math.abs(stars).toFixed(1)}★ tougher than the crowd`
        : 'You and the crowd see eye to eye'
  const pct = 50 + Math.max(-1, Math.min(1, stars / 2)) * 50
  return (
    <SlideShell>
      <Eyebrow index={0}>Your critic profile</Eyebrow>
      <Headline index={1}>{headline}</Headline>
      <Body index={2}>
        Your average this year was {slide.avg_rating?.toFixed(1)}★. On the same films, the world averages the equivalent of {slide.world_avg_stars.toFixed(1)}★
        {slide.agreement_share != null && ` — you agreed with it on ${formatPercent(slide.agreement_share)} of them`}.
      </Body>
      <div {...stagger(3)} className={`mt-4 w-full ${stagger(3).className}`}>
        <div className="relative h-3 w-full rounded-full bg-white/15">
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/50" />
          <span className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg" style={{ left: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.15em] text-white/60">
          <span>Tough</span>
          <span>In step</span>
          <span>Generous</span>
        </div>
      </div>
    </SlideShell>
  )
}

export function RewatchesSlide({ slide }: { slide: Rewatches }) {
  const stagger = useStagger()
  const top = slide.top[0]
  return (
    <SlideShell backdropPath={top?.movie.backdrop_path}>
      <Eyebrow index={0}>Comfort viewing</Eyebrow>
      <Headline index={1}>
        {top ? `${top.movie.title}, ${top.rewatch_count + 1} times over` : 'Films you keep coming back to'}
      </Headline>
      <Body index={2}>
        {slide.total} {plural(slide.total, 'rewatch', 'rewatches')} across the films you first rated this year. Some stories are worth a second (and third) look.
      </Body>
      <ul {...stagger(3)} className={`mt-2 flex gap-4 ${stagger(3).className}`}>
        {slide.top.map((f) => (
          <li key={f.movie.id} className="flex w-20 flex-col gap-1 sm:w-24">
            <Poster path={f.movie.poster_path} title={f.movie.title} />
            <span className="truncate text-xs text-white/90">{f.movie.title}</span>
            <span className="text-[11px] font-semibold text-white">×{f.rewatch_count + 1}</span>
          </li>
        ))}
      </ul>
    </SlideShell>
  )
}

export function WordsSlide({ slide }: { slide: Words }) {
  const stagger = useStagger()
  return (
    <SlideShell>
      <Eyebrow index={0}>In your own words</Eyebrow>
      <Headline index={1}>
        {slide.words.toLocaleString()} {plural(slide.words, 'word')} of reviews
      </Headline>
      <Body index={2}>
        {slide.written_reviews} written {plural(slide.written_reviews, 'review')}. Your longest went to {slide.longest.movie.title} — {slide.longest.words} {plural(slide.longest.words, 'word')}, {ratingLabel(slide.longest.rating).toLowerCase()}.
      </Body>
      <blockquote {...stagger(3)} className={`mt-2 border-l-2 border-white/40 pl-4 text-base italic leading-relaxed text-white/90 sm:text-lg ${stagger(3).className}`}>
        "{slide.longest.excerpt}"
      </blockquote>
    </SlideShell>
  )
}

export function HiddenGemSlide({ slide }: { slide: HiddenGem }) {
  const stagger = useStagger()
  return (
    <SlideShell backdropPath={slide.movie.backdrop_path}>
      <Eyebrow index={0}>Hidden gem</Eyebrow>
      <div className="flex w-full items-center gap-5">
        <div {...stagger(1)} className={`w-28 shrink-0 sm:w-36 ${stagger(1).className}`}>
          <Poster path={slide.movie.poster_path} title={slide.movie.title} pop />
        </div>
        <div className="min-w-0">
          <Headline index={2}>{slide.movie.title}</Headline>
          <p {...stagger(3)} className={`mt-2 text-lg text-white ${stagger(3).className}`}>
            <Stars rating={slide.rating} />
          </p>
          <Body index={4}>Hardly anyone is watching this one right now. You did, and you loved it. Tell someone.</Body>
        </div>
      </div>
    </SlideShell>
  )
}
