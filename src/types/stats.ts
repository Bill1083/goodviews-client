/**
 * Contracts for /api/stats (server: app/services/stats.py). Every section is
 * nullable or empty rather than absent — the dashboard hides what it can't
 * show, so a brand-new account gets a valid page, not an error.
 */

export interface MovieRef {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string | null
}

export interface RatedFilm {
  movie: MovieRef
  rating: number
  rewatch_count: number
}

export interface PersonStat {
  id: number
  name: string
  profile_path: string | null
  count: number
  avg_rating: number | null
  films: MovieRef[]
}

export interface GenreStat {
  id: number
  name: string
  count: number
  share: number
  avg_rating: number | null
  affinity: number
}

export interface DecadeStat {
  decade: number
  count: number
  avg_rating: number | null
}

export interface EraFilm extends MovieRef {
  year: number
  rating: number
}

export interface RuntimeFilm extends MovieRef {
  runtime: number
  rating: number
}

export interface HotTake {
  movie: MovieRef
  your_rating: number
  tmdb: number
  delta: number
}

export interface Disagreement {
  movie: MovieRef
  your_rating: number
  their_rating: number
}

export interface FriendCompat {
  id: string
  username: string | null
  avatar_url: string | null
  avatar_color: string | null
  avatar_focal_y: number | null
  avatar_zoom: number | null
  shared_count: number
  compatibility: number
  mean_abs_diff: number
  most_disagreed: Disagreement | null
}

export interface PeopleBlock {
  most_watched: PersonStat[]
  highest_rated: PersonStat[]
}

export interface WatchlistOldest {
  movie: MovieRef
  added_at: string
  days_waiting: number
}

export interface DashboardStats {
  generated_at: string
  tz: string
  coverage: { films: number; with_runtime: number; with_people: number; with_extras: number }
  headline: {
    films: number
    films_excluding_onboarding: number
    watch_minutes: number
    avg_rating: number | null
    rewatches: number
    rewatched_films: number
    written_reviews: number
    written_words: number
    first_rated_at: string | null
    last_rated_at: string | null
  }
  genres: GenreStat[]
  genre_highlights: {
    most_watched: GenreStat | null
    highest_rated: GenreStat | null
    lowest_rated: GenreStat | null
    affinity_top: GenreStat[]
  }
  watchlist: { count: number; total_minutes: number }
}

// ─── Wrapped ────────────────────────────────────────────────────────────────

export type WrappedTheme = 'aurora' | 'neon' | 'ocean' | 'sunset' | 'sepia' | 'gold' | 'noir' | 'ember'

export interface WrappedPersona {
  key: string
  title: string
  tagline: string
  description: string
  emoji: string
  theme: WrappedTheme
  evidence: string[]
}

export interface WrappedSummary {
  films: number
  minutes: number
  avg_rating: number | null
  top_genre: { id: number; name: string } | null
  top_films: RatedFilm[]
  top_director: PersonStat | null
  top_actor: PersonStat | null
  persona: { key: string; title: string; emoji: string }
  poster_wall: string[]
}

interface Themed {
  theme: WrappedTheme
}

export type WrappedSlide =
  | (Themed & { kind: 'intro'; films: number; first_film: MovieRef; first_rated_at: string; poster_wall: string[] })
  | (Themed & { kind: 'volume'; films: number; minutes: number; days_equiv: number; rewatches: number; avg_rating: number | null })
  | (Themed & {
      kind: 'months'
      months: { month: number; count: number }[]
      busiest: { month: number; count: number }
      quietest: { month: number; count: number } | null
      longest_streak_weeks: number
    })
  | (Themed & { kind: 'genres'; top: GenreStat[]; total_genres: number; surprise: GenreStat | null })
  | (Themed & { kind: 'eras'; decades: DecadeStat[]; oldest: EraFilm; newest: EraFilm; mean_year: number | null })
  | (Themed & { kind: 'people'; director: PersonStat | null; actor: PersonStat | null })
  | (Themed & { kind: 'loves'; top: RatedFilm[]; loved_count: number; film_of_the_year: RatedFilm & { why: string } })
  | (Themed & { kind: 'hates'; worst: RatedFilm[]; disliked_count: number; one_star_count: number })
  | (Themed & { kind: 'hot_take'; movie: MovieRef; your_rating: number; tmdb: number; delta: number; direction: 'higher' | 'lower' })
  | (Themed & {
      kind: 'critic'
      avg_rating: number | null
      world_avg_stars: number
      delta: number | null
      label: 'kinder' | 'harsher' | 'in step' | null
      agreement_share: number | null
    })
  | (Themed & {
      kind: 'runtime'
      avg_minutes: number | null
      longest: RuntimeFilm
      shortest: RuntimeFilm | null
      share_over_2h: number
      share_under_90m: number
    })
  | (Themed & { kind: 'rewatches'; total: number; top: RatedFilm[] })
  | (Themed & {
      kind: 'words'
      written_reviews: number
      words: number
      longest: { movie: MovieRef; words: number; excerpt: string; rating: number }
    })
  | (Themed & { kind: 'watchlist'; total: number; added_this_year: number; oldest: WatchlistOldest | null; total_minutes: number })
  | (Themed & { kind: 'friends'; twin: FriendCompat; nemesis: FriendCompat | null; most_disagreed: Disagreement | null; compared: number })
  | (Themed & { kind: 'hidden_gem'; movie: MovieRef; rating: number; rewatch_count: number; popularity: number })
  | (Themed & {
      kind: 'world'
      countries: number
      top_countries: { code: string; count: number }[]
      languages: number
      non_english_share: number
    })
  | (Themed & ({ kind: 'persona' } & WrappedPersona))
  | (Themed & ({ kind: 'summary' } & WrappedSummary))

export type WrappedSlideKind = WrappedSlide['kind']

export interface WrappedReady {
  status: 'ready'
  year: number
  generated_at: string
  tz: string
  films: number
  minutes: number
  persona: WrappedPersona
  slides: WrappedSlide[]
  summary: WrappedSummary
}

export interface WrappedNotEnough {
  status: 'not_enough'
  year: number
  films: number
  min_films: number
  generated_at: string
  tz: string
}

export type WrappedPayload = WrappedReady | WrappedNotEnough

/** 423 (still locked) and 404 (no such year) are ordinary outcomes, not errors. */
export type WrappedResult =
  | WrappedPayload
  | { status: 'locked'; year: number; unlocks_at: string }
  | { status: 'missing'; year: number }

/** The year in its reveal window. Absent outside 1 Dec – 31 Dec, so nothing
 * about an unfinished year reaches the profile. */
export interface WrappedCurrentYear {
  year: number
  status: 'ready' | 'not_enough'
  films: number
  min_films: number
}

export interface WrappedHistoryYear {
  year: number
  films: number
}

export interface WrappedAvailability {
  current_year: number
  server_time: string
  current: WrappedCurrentYear | null
  history: WrappedHistoryYear[]
}
