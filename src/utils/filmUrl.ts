import { siteUrl } from '../config/brand'

/**
 * URL slug for a film title: "Léon: The Professional" → "leon-the-professional".
 * The API builds the film sitemap with the same rule (app/utils/slug.py in
 * the backend, pinned by its tests) — keep the two in step, or the sitemap
 * and the pages' canonical URLs disagree.
 */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** "/film/603-the-matrix" (or "/film/603" when the title has no Latin letters). */
export function filmPath(movie: { id: number; title?: string | null }): string {
  const slug = slugify(movie.title ?? '')
  return slug ? `/film/${movie.id}-${slug}` : `/film/${movie.id}`
}

/** The absolute, shareable URL of a film's page. */
export function filmUrl(movie: { id: number; title?: string | null }): string {
  return siteUrl(filmPath(movie))
}

/** The TMDB id at the front of a /film/:filmSlug segment, or null. */
export function parseFilmId(segment: string | undefined): number | null {
  const match = /^(\d+)(?:-|$)/.exec(segment ?? '')
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
