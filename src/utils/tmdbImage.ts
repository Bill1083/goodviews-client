export type TmdbImageSize = 'w45' | 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original'

/** Full TMDB image URL, or null when there's no path — every caller has a
 * fallback element for that case (see RetryImage). */
export function tmdbImage(path: string | null | undefined, size: TmdbImageSize = 'w342'): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}
