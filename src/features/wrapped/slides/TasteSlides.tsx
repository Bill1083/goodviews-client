import { useContext } from 'react'
import RetryImage from '../../../components/RetryImage'
import type { PersonStat, WrappedSlide } from '../../../types/stats'
import { formatPercent, plural, releaseYear } from '../../../utils/formatStats'
import { genreLabel, genreStyle } from '../../../utils/genres'
import { tmdbImage } from '../../../utils/tmdbImage'
import SlideShell, { Body, Eyebrow, Headline, WrappedMotionContext, useStagger } from '../SlideShell'

type Genres = Extract<WrappedSlide, { kind: 'genres' }>
type Eras = Extract<WrappedSlide, { kind: 'eras' }>
type People = Extract<WrappedSlide, { kind: 'people' }>

export function GenresSlide({ slide }: { slide: Genres }) {
  const stagger = useStagger()
  const { reduced } = useContext(WrappedMotionContext)
  const top = slide.top[0]
  const max = Math.max(1, ...slide.top.map((g) => g.share))
  return (
    <SlideShell>
      <Eyebrow index={0}>Your genres</Eyebrow>
      <Headline index={1}>
        <span aria-hidden="true">{genreStyle(top.id).emoji} </span>
        {formatPercent(top.share)} {genreLabel(top.id, top.name)}
      </Headline>
      <Body index={2}>
        {top.count} of your films were {genreLabel(top.id, top.name)}. {slide.total_genres} {plural(slide.total_genres, 'genre')} in total
        {slide.surprise ? ` — and the surprise hit was ${genreLabel(slide.surprise.id, slide.surprise.name)}, ${slide.surprise.avg_rating?.toFixed(1)}★ across only ${slide.surprise.count} ${plural(slide.surprise.count, 'film')}.` : '.'}
      </Body>
      <ul className="mt-2 flex w-full flex-col gap-2.5">
        {slide.top.map((g, i) => (
          <li key={g.id} {...stagger(3 + i, 110)} className={`flex items-center gap-3 ${stagger(3 + i, 110).className}`}>
            <span className="w-24 shrink-0 truncate text-sm text-white/90 sm:w-32">
              <span aria-hidden="true">{genreStyle(g.id).emoji} </span>
              {genreLabel(g.id, g.name)}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-r-[4px] bg-white/15">
              <span className={`block h-full rounded-r-[4px] bg-white ${reduced ? '' : 'bar-grow-x'}`} style={{ width: `${(g.share / max) * 100}%`, animationDelay: `${i * 110 + 300}ms` }} />
            </span>
            <span className="w-12 shrink-0 text-right text-sm font-semibold text-white">{formatPercent(g.share)}</span>
          </li>
        ))}
      </ul>
    </SlideShell>
  )
}

function Poster({ path, title, className = '' }: { path: string | null; title: string; className?: string }) {
  const src = tmdbImage(path, 'w342')
  const fallback = <span className="flex h-full w-full items-center justify-center bg-black/40 p-2 text-center text-xs text-white/70">{title}</span>
  return (
    <span className={`block aspect-[2/3] overflow-hidden rounded-lg bg-black/40 shadow-2xl ${className}`}>
      {src ? <RetryImage src={src} alt={title} className="h-full w-full object-cover" fallback={fallback} /> : fallback}
    </span>
  )
}

export function ErasSlide({ slide }: { slide: Eras }) {
  const stagger = useStagger()
  const { reduced } = useContext(WrappedMotionContext)
  const span = slide.newest.year - slide.oldest.year
  const max = Math.max(1, ...slide.decades.map((d) => d.count))
  const topDecade = [...slide.decades].sort((a, b) => b.count - a.count)[0]
  return (
    <SlideShell>
      <Eyebrow index={0}>Time travel</Eyebrow>
      <Headline index={1}>
        {span > 0 ? `${span} years between your oldest and newest film` : `All from ${slide.oldest.year}`}
      </Headline>
      <Body index={2}>
        {topDecade && `The ${topDecade.decade}s were home base with ${topDecade.count} ${plural(topDecade.count, 'film')}`}
        {slide.mean_year ? `, and your average film was made in ${Math.round(slide.mean_year)}.` : '.'}
      </Body>
      <div {...stagger(3)} className={`flex w-full items-end gap-1.5 ${stagger(3).className}`} role="img" aria-label="Films per decade">
        {slide.decades.map((d, i) => (
          <div key={d.decade} className="flex flex-1 flex-col items-center gap-1">
            <span className={`w-full max-w-10 rounded-t-[4px] bg-white/80 ${reduced ? '' : 'bar-grow'}`} style={{ height: 8 + (d.count / max) * 56, animationDelay: `${i * 70}ms` }} />
            <span className="text-[10px] text-white/70">{String(d.decade).slice(2)}s</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4">
        <div {...stagger(4)} className={`flex items-center gap-3 ${stagger(4).className}`}>
          <Poster path={slide.oldest.poster_path} title={slide.oldest.title} className="w-16" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Oldest</p>
            <p className="truncate text-sm font-semibold text-white">{slide.oldest.title}</p>
            <p className="text-xs text-white/70">{slide.oldest.year}</p>
          </div>
        </div>
        {slide.newest.id !== slide.oldest.id && (
          <div {...stagger(5)} className={`flex items-center gap-3 ${stagger(5).className}`}>
            <Poster path={slide.newest.poster_path} title={slide.newest.title} className="w-16" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Newest</p>
              <p className="truncate text-sm font-semibold text-white">{slide.newest.title}</p>
              <p className="text-xs text-white/70">{slide.newest.year}</p>
            </div>
          </div>
        )}
      </div>
    </SlideShell>
  )
}

function PersonCard({ person, role, index }: { person: PersonStat; role: string; index: number }) {
  const stagger = useStagger()
  const s = stagger(index)
  const photo = tmdbImage(person.profile_path, 'w185')
  return (
    <div className={`flex items-center gap-4 ${s.className}`} style={s.style}>
      <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-black/40 shadow-2xl sm:h-24 sm:w-24">
        {photo ? (
          <RetryImage src={photo} alt={person.name} className="h-full w-full object-cover" fallback={<span className="flex h-full w-full items-center justify-center text-2xl text-white/60">{person.name[0]}</span>} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl text-white/60">{person.name[0]}</span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{role}</p>
        <p className="truncate text-2xl font-bold text-white sm:text-3xl">{person.name}</p>
        <p className="text-sm text-white/80">
          {person.count} {plural(person.count, 'film')}
          {person.avg_rating != null && ` · ${person.avg_rating.toFixed(1)}★ avg`}
        </p>
        <p className="truncate text-xs text-white/60">{person.films.map((f) => `${f.title} (${releaseYear(f.release_date)})`).join(' · ')}</p>
      </div>
    </div>
  )
}

export function PeopleSlide({ slide }: { slide: People }) {
  const lead = slide.director ?? slide.actor
  return (
    <SlideShell>
      <Eyebrow index={0}>The people you kept coming back to</Eyebrow>
      <Headline index={1}>
        {lead && lead.count > 1 ? `You couldn't get enough of ${lead.name}` : `${lead?.name ?? 'Someone'} made the cut`}
      </Headline>
      <div className="mt-2 flex flex-col gap-6">
        {slide.director && <PersonCard person={slide.director} role="Most-watched director" index={2} />}
        {slide.actor && <PersonCard person={slide.actor} role="Most-watched actor" index={3} />}
      </div>
    </SlideShell>
  )
}
